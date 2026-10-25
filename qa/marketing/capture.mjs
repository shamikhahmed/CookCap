#!/usr/bin/env node
/**
 * CookCap marketing capture (reviewer runs via qa/marketing/capture.sh).
 * Writes hub-format shots, App Store PNGs, walkthrough video, site hero refresh.
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = (process.env.GALLERY_URL || 'http://127.0.0.1:8920/CookCap').replace(/\/$/, '');
const RECIPE = process.env.GALLERY_RECIPE || 'butter-chicken';
const DEMO = 'Ayesha';
const APP_VER = JSON.parse(readFileSync(join(ROOT, 'VERSION.json'), 'utf8')).version;

const OUT_SHOTS = join(ROOT, 'qa', 'marketing', 'shots');
const OUT_GALLERY = join(ROOT, 'docs', 'screenshots', 'gallery');
const OUT_APPSTORE = join(ROOT, 'qa', 'marketing', 'appstore');
const OUT_SITE = join(ROOT, 'public', 'site');
const OUT_WT = join(ROOT, 'qa', 'marketing', 'walkthrough');

/** Hub / minisite filenames (single dashes). */
const HUB_SCREENS = [
  'book-cover-default',
  'book-title-page-default',
  'book-family-friends-default',
  'book-contents-default',
  'book-chapter-default',
  'book-paper-tabs-default',
  'book-page-navigator-default',
  'cook-recipe-default',
  'cook-cooking-mode-default',
  'cook-cooking-lenses-default',
  'cook-plate-view-default',
  'find-search-default',
  'plan-shopping-list-default',
  'plan-meal-planner-default',
  'plan-calendar-default',
  'plan-pantry-default',
  'family-profiles-default',
  'you-appearance-default',
];

const DEVICES = {
  iphone: { width: 393, height: 852, dsf: 3, label: 'iPhone 15 Pro' },
  ipad: { width: 1024, height: 1366, dsf: 2, label: 'iPad' },
  mac: { width: 1440, height: 900, dsf: 1, label: 'Mac 1440' },
};

const APPSTORE = {
  iphone69: { width: 440, height: 956, dsf: 3, w: 1320, h: 2868 }, // 6.9"
  ipad13: { width: 1024, height: 1366, dsf: 2, w: 2064, h: 2752 }, // 13"
};

const SITE_MAP = {
  'book-cover-default': 'cover.webp',
  'book-contents-default': 'contents.webp',
  'cook-recipe-default': 'recipe.webp',
  'cook-cooking-mode-default': 'cook.webp',
  'plan-shopping-list-default': 'shopping.webp',
  'find-search-default': 'search.webp',
};

function hubToGallery(hub) {
  // book-cover-default → book--cover--default.webp
  const parts = hub.split('-');
  // group is first token; state is last; screen is middle joined
  const state = parts[parts.length - 1];
  const group = parts[0];
  const screen = parts.slice(1, -1).join('-');
  return `${group}--${screen}--${state}.webp`;
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
    return 'cwebp';
  }
  spawnSync('cp', [pngPath, webpPath]);
  return 'png-copy';
}

async function settle(page, ms = 400) {
  await page.waitForTimeout(ms);
}

async function waitRecipeHero(page, timeout = 20000) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-leaf-scroll]');
      if (!root) return false;
      return [...root.querySelectorAll('img')].some((img) => img.complete && img.naturalWidth > 40);
    },
    null,
    { timeout },
  ).catch(() => {});
}

async function seed(page, theme) {
  await page.evaluate(
    ({ name, ver, theme }) => {
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-onboarded', '1');
      localStorage.setItem('cookcap-theme', theme);
      localStorage.setItem('cookcap-skin', 'editorial');
      localStorage.setItem('cookcap-whats-new', ver);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-skin', 'editorial');
    },
    { name: DEMO, ver: APP_VER, theme },
  );
  await page.emulateMedia({ colorScheme: theme });
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

async function gotoPos(page, theme, pos) {
  await page.evaluate((p) => localStorage.setItem('cookcap-pos', String(p)), pos);
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await seed(page, theme);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitFooter(page);
  await settle(page, 450);
}

async function dismiss(page) {
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Got it' }).click({ timeout: 1500 }).catch(() => {});
    await page.getByRole('button', { name: 'Dismiss' }).click({ timeout: 1500 }).catch(() => {});
  }
}

async function prepareScreen(page, theme, hub) {
  await dismiss(page);
  if (hub === 'book-cover-default') return gotoPos(page, theme, 0);
  if (hub === 'book-title-page-default') return gotoPos(page, theme, 1);
  if (hub === 'book-family-friends-default') return gotoPos(page, theme, 2);
  if (hub === 'book-contents-default') return gotoPos(page, theme, 3);
  if (hub === 'book-chapter-default') return gotoPos(page, theme, 4);
  if (hub === 'book-paper-tabs-default') {
    await gotoPos(page, theme, 3);
    const tabs = page.getByRole('button', { name: 'Open chapter tabs' });
    if (await tabs.isVisible().catch(() => false)) {
      await tabs.click({ force: true });
      await settle(page, 400);
    }
    return;
  }
  if (hub === 'book-page-navigator-default') {
    await gotoPos(page, theme, 0);
    await page
      .getByRole('button', { name: /\d+\s*\/\s*\d+/ })
      .click()
      .catch(async () => {
        await page.locator('footer button').filter({ hasText: /\d+\s*\/\s*\d+/ }).click();
      });
    await settle(page, 400);
    return;
  }
  if (hub === 'cook-recipe-default') {
    await page.evaluate((name) => {
      localStorage.setItem('cookcap-mode', 'reader');
      localStorage.setItem('cookcap-owner', name);
    }, DEMO);
    await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await seed(page, theme);
    await waitFooter(page);
    await page.getByRole('button', { name: 'Mode — Reader' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await page.evaluate(() => document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0));
    await waitRecipeHero(page);
    await settle(page, 500);
    return;
  }
  if (hub === 'cook-cooking-mode-default') {
    await prepareScreen(page, theme, 'cook-recipe-default');
    const cookBtn = page.getByRole('button', { name: 'Start cooking' }).filter({ visible: true }).first();
    await cookBtn.waitFor({ state: 'visible', timeout: 30000 });
    await cookBtn.dispatchEvent('click');
    await page.getByRole('button', { name: 'Exit cooking mode' }).waitFor({ state: 'visible', timeout: 15000 });
    await settle(page, 450);
    return;
  }
  if (hub === 'cook-cooking-lenses-default' || hub === 'cook-plate-view-default') {
    await page.evaluate((name) => {
      localStorage.setItem('cookcap-mode', 'plate');
      localStorage.setItem('cookcap-owner', name);
    }, DEMO);
    await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await seed(page, theme);
    await waitFooter(page);
    await page.getByRole('button', { name: 'Mode — My Plate' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (hub === 'cook-cooking-lenses-default') {
      await page.getByRole('button', { name: /^Mode —/ }).click();
      await page.getByRole('heading', { name: 'Choose a mode' }).waitFor({ state: 'visible', timeout: 8000 });
      await settle(page, 400);
    } else {
      await page.getByText('Make it healthier').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      await page.evaluate(() => document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0));
      await waitRecipeHero(page);
      await settle(page, 500);
    }
    return;
  }
  if (hub === 'find-search-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: 'Search recipes' }).click();
    await page.getByPlaceholder(/Try|dish name|Search/i).waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 350);
    return;
  }
  if (hub === 'plan-shopping-list-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: /Shopping list/i }).first().click();
    await page.locator('#shopping-drawer-title').waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    return;
  }
  if (hub === 'plan-meal-planner-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: 'Search recipes' }).click();
    await page.getByPlaceholder(/Try|dish name|Search/i).waitFor({ state: 'visible', timeout: 8000 });
    await page.getByRole('button', { name: /^This week$/ }).click();
    await page.locator('#meal-planner-title').waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    return;
  }
  if (hub === 'family-profiles-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: /Profiles|Open profiles/i }).first().click({ force: true });
    await settle(page, 500);
    return;
  }
  if (hub === 'plan-calendar-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await settle(page, 300);
    await page.getByRole('menuitem', { name: 'Calendar', exact: true }).click({ force: true });
    await settle(page, 500);
    return;
  }
  if (hub === 'plan-pantry-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await settle(page, 300);
    await page.getByRole('menuitem', { name: /Pantry/i }).click({ force: true });
    await settle(page, 500);
    return;
  }
  if (hub === 'you-appearance-default') {
    await gotoPos(page, theme, 0);
    await page.getByRole('button', { name: 'Appearance' }).click();
    await page.getByRole('heading', { name: 'Appearance' }).waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    return;
  }
  console.warn('  skip unknown', hub);
}

async function shotHub(page, theme, device, hub) {
  const hubDir = join(OUT_SHOTS, theme, device);
  const galDir = join(OUT_GALLERY, theme, device);
  mkdirSync(hubDir, { recursive: true });
  mkdirSync(galDir, { recursive: true });
  const png = join(hubDir, `${hub}.png`);
  const webp = join(hubDir, `${hub}.webp`);
  await page.screenshot({ path: png, fullPage: false, animations: 'disabled' });
  const how = pngToWebp(png, webp);
  const galName = hubToGallery(hub);
  copyFileSync(webp, join(galDir, galName));
  if (theme === 'light' && device === 'iphone' && SITE_MAP[hub]) {
    copyFileSync(webp, join(OUT_SITE, SITE_MAP[hub]));
  }
  if (theme === 'light' && device === 'ipad' && hub === 'book-contents-default') {
    copyFileSync(webp, join(OUT_SITE, 'ipad-contents.webp'));
  }
  console.log(`  ✓ ${theme}/${device}/${hub}.webp (${how})`);
  return webp;
}

async function captureGallery(browser) {
  const results = [];
  for (const theme of ['light', 'dark']) {
    for (const [device, vp] of Object.entries(DEVICES)) {
      console.log(`\n== ${theme} · ${vp.label} ==`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dsf,
        colorScheme: theme,
        isMobile: device !== 'mac',
        hasTouch: device !== 'mac',
      });
      const page = await context.newPage();
      for (const hub of HUB_SCREENS) {
        try {
          await prepareScreen(page, theme, hub);
          await shotHub(page, theme, device, hub);
          results.push(`${theme}/${device}/${hub}`);
        } catch (err) {
          console.error(`  ✗ ${theme}/${device}/${hub}:`, err.message || err);
          results.push(`FAIL ${theme}/${device}/${hub}`);
        }
      }
      // iPad demo aliases expected by hub
      if (device === 'ipad' && theme === 'light') {
        for (const [src, dest] of [
          ['book-cover-default', 'book-cover-demo'],
          ['book-contents-default', 'book-contents-demo'],
          ['cook-recipe-default', 'book-recipe-demo'],
        ]) {
          const from = join(OUT_SHOTS, theme, device, `${src}.webp`);
          if (existsSync(from)) {
            copyFileSync(from, join(OUT_SHOTS, theme, device, `${dest}.webp`));
          }
        }
      }
      await context.close();
    }
  }
  return results;
}

async function captureAppStore(browser) {
  mkdirSync(OUT_APPSTORE, { recursive: true });
  const picks = ['book-cover-default', 'book-contents-default', 'cook-recipe-default', 'cook-cooking-mode-default', 'plan-shopping-list-default'];
  const out = [];
  for (const [key, vp] of Object.entries(APPSTORE)) {
    console.log(`\n== App Store ${key} ${vp.w}×${vp.h} ==`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dsf,
      colorScheme: 'light',
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    for (const hub of picks) {
      try {
        await prepareScreen(page, 'light', hub);
        const path = join(OUT_APPSTORE, `${key}-${hub}.png`);
        await page.screenshot({ path, fullPage: false, animations: 'disabled' });
        console.log('  ✓', path);
        out.push(path);
      } catch (err) {
        console.error('  ✗', hub, err.message || err);
      }
    }
    await context.close();
  }
  return out;
}

async function captureWalkthrough(browser) {
  mkdirSync(OUT_WT, { recursive: true });
  mkdirSync(OUT_SITE, { recursive: true });
  const vp = DEVICES.iphone;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: OUT_WT, size: { width: vp.width, height: vp.height } },
  });
  const page = await context.newPage();
  console.log('\n== Walkthrough video ==');
  try {
    await gotoPos(page, 'light', 0);
    await settle(page, 1200);
    await gotoPos(page, 'light', 3);
    await settle(page, 1500);
    await prepareScreen(page, 'light', 'cook-recipe-default');
    await settle(page, 1800);
    await prepareScreen(page, 'light', 'cook-cooking-mode-default');
    await settle(page, 2000);
    await prepareScreen(page, 'light', 'find-search-default');
    await settle(page, 1500);
    await prepareScreen(page, 'light', 'plan-shopping-list-default');
    await settle(page, 1800);
    await page.screenshot({ path: join(OUT_SITE, 'walkthrough-poster.jpg'), type: 'jpeg', quality: 82 });
    copyFileSync(join(OUT_SITE, 'walkthrough-poster.jpg'), join(OUT_WT, 'poster.jpg'));
    // also keep webp poster for landing
    const posterPng = join(OUT_WT, 'poster-tmp.png');
    await page.screenshot({ path: posterPng, animations: 'disabled' });
    pngToWebp(posterPng, join(OUT_SITE, 'walkthrough-poster.webp'));
  } catch (err) {
    console.error('  walkthrough steps:', err.message || err);
  }
  const video = page.video();
  await context.close();
  let webm = null;
  if (video) {
    webm = await video.path();
    const destWebm = join(OUT_SITE, 'walkthrough.webm');
    copyFileSync(webm, destWebm);
    copyFileSync(webm, join(OUT_WT, 'walkthrough.webm'));
    console.log('  ✓ walkthrough.webm');
    const mp4 = join(OUT_SITE, 'walkthrough.mp4');
    const ff = spawnSync(
      'ffmpeg',
      ['-y', '-i', destWebm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', mp4],
      { encoding: 'utf8' },
    );
    if (ff.status === 0 && existsSync(mp4)) {
      copyFileSync(mp4, join(OUT_WT, 'walkthrough.mp4'));
      console.log('  ✓ walkthrough.mp4 (ffmpeg)');
    } else {
      console.log('  · ffmpeg unavailable or failed — keeping webm only');
    }
  }
  // ensure captions present
  if (!existsSync(join(OUT_SITE, 'walkthrough.vtt'))) {
    console.warn('  ! missing walkthrough.vtt');
  }
  return webm;
}

function countShots() {
  let n = 0;
  for (const theme of ['light', 'dark']) {
    for (const device of Object.keys(DEVICES)) {
      const dir = join(OUT_SHOTS, theme, device);
      if (!existsSync(dir)) continue;
      n += readdirSync(dir).filter((f) => f.endsWith('.webp')).length;
    }
  }
  return n;
}

function writeSummary({ gallery, appstore, lighthouse, notes }) {
  const lines = [
    `# CookCap marketing capture — ${APP_VER}`,
    '',
    `Captured: ${new Date().toISOString()}`,
    `Base URL: ${BASE}`,
    '',
    '## Summary',
    '',
    `| Item | Count / status |`,
    `| --- | --- |`,
    `| Gallery webp (qa/marketing/shots) | ${countShots()} |`,
    `| App Store PNGs | ${appstore.length} |`,
    `| Walkthrough | ${existsSync(join(OUT_SITE, 'walkthrough.mp4')) ? 'mp4' : existsSync(join(OUT_SITE, 'walkthrough.webm')) ? 'webm' : 'missing'} + poster + vtt |`,
    `| Lighthouse landing | ${lighthouse || 'skipped'} |`,
    '',
    '## Gallery paths',
    '',
    'Hub format: `qa/marketing/shots/{light,dark}/{iphone,ipad,mac}/<screen>.webp`',
    'App gallery mirror: `docs/screenshots/gallery/{theme}/{device}/<group>--<screen>--<state>.webp`',
    'Site heroes refreshed under `public/site/*.webp`',
    '',
    '## Notes',
    '',
    ...(notes.length ? notes.map((n) => `- ${n}`) : ['- none']),
    '',
    '## Failures / skips',
    '',
    ...gallery.filter((g) => g.startsWith('FAIL')).map((g) => `- ${g}`),
    gallery.some((g) => g.startsWith('FAIL')) ? '' : '- none',
    '',
  ];
  const path = join(ROOT, 'qa', 'marketing', 'SUMMARY.md');
  writeFileSync(path, lines.join('\n'));
  console.log('\n' + lines.join('\n'));
  return path;
}

function runLighthouse() {
  const url = `${BASE.replace(/\/CookCap$/, '/CookCap')}/landing.html`;
  // Prefer offline npx; do not network-install.
  const probe = spawnSync('npx', ['--offline', 'lighthouse', '--version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    return 'npx lighthouse not available offline — skipped';
  }
  const outDir = join(ROOT, 'qa', 'marketing', 'lighthouse');
  mkdirSync(outDir, { recursive: true });
  const report = join(outDir, 'landing');
  const r = spawnSync(
    'npx',
    [
      '--offline',
      'lighthouse',
      url,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless --no-sandbox',
      '--output=json,html',
      `--output-path=${report}`,
      '--quiet',
    ],
    { encoding: 'utf8', timeout: 180000 },
  );
  if (r.status !== 0) {
    return `lighthouse failed: ${(r.stderr || r.stdout || '').slice(0, 200)}`;
  }
  try {
    const j = JSON.parse(readFileSync(`${report}.report.json`, 'utf8'));
    const cats = j.categories || {};
    const scores = ['performance', 'accessibility', 'best-practices', 'seo']
      .map((k) => `${k}=${Math.round((cats[k]?.score || 0) * 100)}`)
      .join(' ');
    return scores;
  } catch {
    return 'ran (scores unreadable)';
  }
}

async function main() {
  console.log(`CookCap marketing capture ${APP_VER}`);
  console.log(`BASE=${BASE}`);
  mkdirSync(OUT_SHOTS, { recursive: true });
  mkdirSync(OUT_APPSTORE, { recursive: true });
  mkdirSync(OUT_SITE, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const notes = [];
  let gallery = [];
  let appstore = [];
  try {
    gallery = await captureGallery(browser);
    appstore = await captureAppStore(browser);
    await captureWalkthrough(browser);
  } finally {
    await browser.close();
  }

  const lighthouse = runLighthouse();
  if (lighthouse.includes('skipped') || lighthouse.includes('failed')) notes.push(lighthouse);

  writeSummary({ gallery, appstore, lighthouse, notes });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
