#!/usr/bin/env node
/**
 * Capture Editorial night-paper dark gallery — same screen ids as light/.
 * Writes docs/screenshots/gallery/dark/{iphone,ipad,mac}/*.webp + updates manifest.
 *
 *   npm run pages:build
 *   mkdir -p /tmp/gal-root && ln -sfn "$PWD/out" /tmp/gal-root/CookCap
 *   python3 -m http.server 3456 --directory /tmp/gal-root &
 *   GALLERY_URL=http://127.0.0.1:3456/CookCap node scripts/capture-gallery-v3-dark.mjs
 *
 * PW_CORE may point at MasteryCap's playwright-core; we prefer local @playwright/test.
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(ROOT, 'docs', 'screenshots', 'gallery');
const MANIFEST = join(GALLERY, 'gallery-manifest.json');
const BASE = (process.env.GALLERY_URL || 'http://127.0.0.1:3456/CookCap').replace(/\/$/, '');
const RECIPE = process.env.GALLERY_RECIPE || 'butter-chicken';
const DEMO = 'Ayesha';
const APP_VER = JSON.parse(readFileSync(join(ROOT, 'VERSION.json'), 'utf8')).version;
const ACCENT = '#8b4513';

const DEVICES = {
  iphone: { width: 390, height: 844, dsf: 2, mobile: true },
  ipad: { width: 1024, height: 768, dsf: 2, mobile: true },
  mac: { width: 1440, height: 900, dsf: 1, mobile: false },
};

function lightFiles(device) {
  const dir = join(GALLERY, 'light', device);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.webp')).sort();
}

function pngToWebp(pngPath, webpPath) {
  mkdirSync(dirname(webpPath), { recursive: true });
  const r = spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath], { encoding: 'utf8' });
  if (r.status === 0 && existsSync(webpPath)) {
    try {
      unlinkSync(pngPath);
    } catch {
      /* keep */
    }
    return;
  }
  spawnSync('cp', [pngPath, webpPath]);
}

async function settle(page, ms = 400) {
  await page.waitForTimeout(ms);
}

/** Wait until the recipe leaf hero has decoded pixels (avoids empty plate/recipe shots). */
async function waitRecipeHero(page, timeout = 20000) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-leaf-scroll]');
      if (!root) return false;
      const imgs = [...root.querySelectorAll('img')];
      return imgs.some((img) => img.complete && img.naturalWidth > 40);
    },
    null,
    { timeout },
  );
}

async function seedDark(page) {
  await page.evaluate(
    ({ name, ver }) => {
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-onboarded', '1');
      localStorage.setItem('cookcap-theme', 'dark');
      localStorage.setItem('cookcap-skin', 'editorial');
      localStorage.setItem('cookcap-whats-new', ver);
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-skin', 'editorial');
    },
    { name: DEMO, ver: APP_VER },
  );
}

async function waitFooter(page, timeout = 60000) {
  await page
    .waitForFunction(() => window.__APP_READY__ === true, null, { timeout: Math.min(timeout, 20000) })
    .catch(() => {});
  await page.waitForFunction(
    () => /\d+\s*\/\s*\d+/.test(document.querySelector('footer')?.innerText || ''),
    null,
    { timeout },
  );
}

async function gotoPos(page, pos) {
  await page.evaluate((p) => localStorage.setItem('cookcap-pos', String(p)), pos);
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await seedDark(page);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitFooter(page);
  await settle(page, 500);
}

async function shotWebp(page, device, file) {
  const webp = join(GALLERY, 'dark', device, file);
  const png = webp.replace(/\.webp$/, '.png');
  mkdirSync(dirname(png), { recursive: true });
  await page.screenshot({ path: png, fullPage: false, animations: 'disabled' });
  pngToWebp(png, webp);
  console.log('  ✓', `dark/${device}/${file}`);
  const box = page.viewportSize();
  const dsf = DEVICES[device].dsf;
  return {
    id: file.replace(/\.webp$/, '').replace(/--/g, '-'),
    group: file.split('--')[0].replace(/^\w/, (c) => c.toUpperCase()),
    screen: file.replace(/\.webp$/, '').split('--')[1] || file,
    state: 'default',
    theme: 'dark',
    device,
    file: `dark/${device}/${file}`,
    route: 'book',
    caption: `Dark · ${file.replace(/\.webp$/, '')}`,
    w: (box?.width ?? DEVICES[device].width) * dsf,
    h: (box?.height ?? DEVICES[device].height) * dsf,
  };
}

/** Map light filename → capture action. Returns true if shot taken. */
async function captureOne(page, device, file) {
  const base = file.replace(/\.webp$/, '');

  if (base === 'book--cover--default' || base === 'book--cover--demo') {
    await gotoPos(page, 0);
    return shotWebp(page, device, file);
  }
  if (base === 'book--title-page--default') {
    await gotoPos(page, 1);
    return shotWebp(page, device, file);
  }
  if (base === 'book--family-friends--default') {
    await gotoPos(page, 2);
    return shotWebp(page, device, file);
  }
  if (base === 'book--contents--default' || base === 'book--contents--demo') {
    await gotoPos(page, 3);
    return shotWebp(page, device, file);
  }
  if (base === 'book--chapter--default') {
    await gotoPos(page, 4);
    return shotWebp(page, device, file);
  }
  if (base === 'book--paper-tabs--default') {
    await gotoPos(page, 3);
    const tabs = page.getByRole('button', { name: 'Open chapter tabs' });
    if (await tabs.isVisible().catch(() => false)) {
      await tabs.click({ force: true });
      await settle(page, 400);
    }
    return shotWebp(page, device, file);
  }
  if (base === 'book--page-navigator--default') {
    await gotoPos(page, 0);
    await page
      .getByRole('button', { name: /\d+\s*\/\s*\d+/ })
      .click()
      .catch(async () => {
        await page.locator('footer button').filter({ hasText: /\d+\s*\/\s*\d+/ }).click();
      });
    await settle(page, 400);
    return shotWebp(page, device, file);
  }
  if (base === 'cook--recipe--default' || base === 'book--recipe--demo') {
    // Reader must be explicit — earlier plate/lenses shots leave cookcap-mode=plate.
    await page.evaluate((name) => {
      localStorage.setItem('cookcap-mode', 'reader');
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-theme', 'dark');
      localStorage.setItem('cookcap-skin', 'editorial');
    }, DEMO);
    await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await seedDark(page);
    await waitFooter(page);
    await page.getByRole('button', { name: 'Mode — Reader' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0));
    await waitRecipeHero(page);
    await settle(page, 600);
    return shotWebp(page, device, file);
  }
  if (base === 'cook--cooking-mode--default') {
    await page.evaluate((name) => {
      localStorage.setItem('cookcap-mode', 'reader');
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-theme', 'dark');
      localStorage.setItem('cookcap-skin', 'editorial');
    }, DEMO);
    await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await seedDark(page);
    await waitFooter(page);
    const cookBtn = page.getByRole('button', { name: 'Start cooking' }).filter({ visible: true }).first();
    await cookBtn.waitFor({ state: 'visible', timeout: 30000 });
    await cookBtn.dispatchEvent('click');
    await page.getByRole('button', { name: 'Exit cooking mode' }).waitFor({ state: 'visible', timeout: 15000 });
    await settle(page, 450);
    return shotWebp(page, device, file);
  }
  if (base === 'cook--cooking-lenses--default' || base === 'cook--plate-view--default') {
    await page.evaluate((name) => {
      localStorage.setItem('cookcap-mode', 'plate');
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-theme', 'dark');
      localStorage.setItem('cookcap-skin', 'editorial');
    }, DEMO);
    await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await seedDark(page);
    await waitFooter(page);
    // Prove plate mode mounted (Mode letter + healthier chrome) before shooting.
    await page.getByRole('button', { name: 'Mode — My Plate' }).waitFor({ state: 'visible', timeout: 15000 });
    if (base === 'cook--cooking-lenses--default') {
      await page.getByRole('button', { name: /^Mode —/ }).click();
      await page.getByRole('heading', { name: 'Choose a mode' }).waitFor({ state: 'visible', timeout: 8000 });
      await settle(page, 400);
    } else {
      await page.getByText('Make it healthier').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.evaluate(() => document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0));
      await waitRecipeHero(page);
      await settle(page, 600);
    }
    return shotWebp(page, device, file);
  }
  if (base === 'find--search--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: 'Search recipes' }).click();
    await page.getByPlaceholder(/Try|dish name|Search/i).waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 350);
    return shotWebp(page, device, file);
  }
  if (base === 'plan--shopping-list--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: /Shopping list/i }).first().click();
    await page.locator('#shopping-drawer-title').waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    return shotWebp(page, device, file);
  }
  if (base === 'plan--meal-planner--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: 'Search recipes' }).click();
    await page.getByPlaceholder(/Try|dish name|Search/i).waitFor({ state: 'visible', timeout: 8000 });
    await page.getByRole('button', { name: /^This week$/ }).click();
    await page.locator('#meal-planner-title').waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    return shotWebp(page, device, file);
  }
  if (base === 'family--profiles--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: /Profiles|Open profiles/i }).first().click({ force: true });
    await settle(page, 500);
    return shotWebp(page, device, file);
  }
  if (base === 'plan--calendar--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await settle(page, 300);
    await page.getByRole('menuitem', { name: 'Calendar', exact: true }).click({ force: true });
    await settle(page, 500);
    return shotWebp(page, device, file);
  }
  if (base === 'plan--pantry--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await settle(page, 300);
    await page.getByRole('menuitem', { name: /Pantry/i }).click({ force: true });
    await settle(page, 500);
    return shotWebp(page, device, file);
  }
  if (base === 'you--appearance--default') {
    await gotoPos(page, 0);
    await page.getByRole('button', { name: 'Appearance' }).click();
    await page.getByRole('heading', { name: 'Appearance' }).waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    return shotWebp(page, device, file);
  }

  console.warn('  skip unknown', file);
  return null;
}

function mergeManifest(newShots) {
  let prior = { shots: [] };
  try {
    prior = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    /* first */
  }
  const byKey = new Map();
  for (const s of prior.shots || []) {
    if (s?.theme && s?.device && s?.file) byKey.set(`${s.theme}/${s.device}/${s.file}`, s);
  }
  for (const s of newShots) {
    if (s) byKey.set(`${s.theme}/${s.device}/${s.file}`, s);
  }
  const merged = [...byKey.values()].sort((a, b) => String(a.file).localeCompare(String(b.file)));
  const out = {
    app: 'CookCap',
    version: APP_VER,
    capturedAt: new Date().toISOString(),
    accent: ACCENT,
    schema: 2,
    note: 'v4 gallery — Editorial night paper dark + light; same screen ids across schemes.',
    legacyGalleryRoot: 'docs/gallery',
    schemes: ['light', 'dark'],
    v3: {
      themesRequired: ['light', 'dark'],
      devicesRequired: ['iphone', 'ipad', 'mac'],
      darkShots: merged.filter((s) => s.theme === 'dark').length,
    },
    shots: merged,
  };
  if (prior.legacyShots) out.legacyShots = prior.legacyShots;
  // Explicitly drop schemeNote if it existed
  writeFileSync(MANIFEST, JSON.stringify(out, null, 2));
  console.log(`Wrote manifest (${merged.length} shots, ${out.v3.darkShots} dark)`);
}

/** Optional: GALLERY_ONLY=cook--plate-view--default,cook--recipe--default */
function onlyFilter(files) {
  const raw = (process.env.GALLERY_ONLY || '').trim();
  if (!raw) return files;
  const want = new Set(
    raw
      .split(',')
      .map((s) => s.trim().replace(/\.webp$/, ''))
      .filter(Boolean)
      .map((s) => (s.endsWith('.webp') ? s : `${s}.webp`)),
  );
  return files.filter((f) => want.has(f));
}

async function main() {
  console.log(`Dark v3 gallery → ${GALLERY}`);
  console.log(`Base ${BASE} · ver ${APP_VER}`);
  const browser = await chromium.launch({ headless: true });
  const collected = [];
  const deviceFilter = (process.env.GALLERY_DEVICES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const [device, vp] of Object.entries(DEVICES)) {
    if (deviceFilter.length && !deviceFilter.includes(device)) continue;
    const files = onlyFilter(lightFiles(device));
    if (!files.length) {
      console.warn(`No light/${device} webps — skipping device`);
      continue;
    }
    console.log(`${device} (${files.length} screens)…`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dsf,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await seedDark(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitFooter(page).catch(() => {});

    for (const file of files) {
      try {
        const entry = await captureOne(page, device, file);
        if (entry) collected.push(entry);
      } catch (err) {
        console.warn(`  fail ${device}/${file}:`, err?.message || err);
      }
    }
    await context.close();
  }

  await browser.close();
  mergeManifest(collected);
  console.log('Done.');
}

const isMain =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
