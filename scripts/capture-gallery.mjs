#!/usr/bin/env node
/**
 * Capture CookCap screen gallery (desktop + mobile).
 * Requires static `out/` or `npm run dev` + Playwright Chromium.
 *
 *   npm run build && npx serve out -l 3456
 *   GALLERY_URL=http://127.0.0.1:3456 npm run gallery
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'gallery');
const BASE = process.env.GALLERY_URL || 'http://localhost:3000';
const RECIPE = process.env.GALLERY_RECIPE || 'butter-chicken';
/** Demo edition — not a hard-coded product name */
const DEMO = 'Ayesha';

mkdirSync(join(OUT, 'desktop'), { recursive: true });
mkdirSync(join(OUT, 'mobile'), { recursive: true });

async function settle(page, ms = 450) {
  await page.waitForTimeout(ms);
}

async function shot(page, rel) {
  const path = join(OUT, rel);
  await page.screenshot({ path, type: 'png', animations: 'disabled' });
  console.log('  ✓', rel);
}

async function waitFooterReady(page, timeout = 20000) {
  await page.waitForFunction(
    () => {
      const t = document.querySelector('footer')?.innerText || '';
      return /\d+\s*\/\s*\d+/.test(t);
    },
    null,
    { timeout },
  );
}

async function waitFooterPage(page, n, timeout = 20000) {
  await page.waitForFunction(
    (want) => {
      const t = document.querySelector('footer')?.innerText || '';
      const m = t.match(/(\d+)\s*\/\s*(\d+)/);
      return m && Number(m[1]) === want;
    },
    n,
    { timeout },
  );
  await settle(page, 350);
}

async function nextPage(page) {
  await page.getByRole('button', { name: 'Next page' }).click();
  await settle(page, 500);
}

async function openMore(page) {
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await settle(page, 350);
}

async function setDarkMode(page, dark) {
  await page.evaluate((wantDark) => {
    localStorage.setItem('cookcap-theme', wantDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', wantDark ? 'dark' : 'light');
  }, dark);
  await settle(page, 300);
}

async function clearForFirstRun(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cookcap-theme', 'light');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Shell delays first-run portal ~480ms after needsName
  await settle(page, 700);
}

/** Simple / reduced-motion onboarding (gallery default context uses reduce). */
async function captureSimpleOnboarding(page, folder) {
  await clearForFirstRun(page);
  await page.getByRole('heading', { name: /living family cookbook/i }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await settle(page, 400);
  await shot(page, `${folder}/00-welcome.png`);

  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.getByLabel('Your name').waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 350);
  await shot(page, `${folder}/00b-name-gate.png`);

  await page.getByLabel('Your name').fill(DEMO);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: /Who eats/i }).waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 300);
  await shot(page, `${folder}/00c-profile.png`);

  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('heading', { name: /How do you like to cook/i }).waitFor({
    state: 'visible',
    timeout: 8000,
  });
  await settle(page, 300);
  await shot(page, `${folder}/00d-mode.png`);

  await page.getByRole('button', { name: /Skip — open my book/i }).click();
  // Brief reveal flash then book
  await settle(page, 250);
  await shot(page, `${folder}/00e-reveal.png`).catch(() => {});
  await waitFooterPage(page, 1);
  await shot(page, `${folder}/01-cover.png`);
}

/**
 * Dresser path — needs no reduced-motion + hardwareConcurrency > 4.
 * Call from a context created with reducedMotion: 'no-preference'.
 */
async function captureDresserOnboarding(page, folder) {
  mkdirSync(join(OUT, folder, 'dresser'), { recursive: true });
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        get: () => 8,
      });
    } catch {
      /* ignore */
    }
  });

  await clearForFirstRun(page);
  await page.getByRole('heading', { name: /living family cookbook/i }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  // Confirm dresser (plate on dresser), not simple full-bleed alone
  await page.locator('.dresser-scene').waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 500);
  await shot(page, `${folder}/dresser/00-welcome.png`);

  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.locator('#dresser-name').waitFor({ state: 'visible', timeout: 10000 });
  await settle(page, 500);
  await shot(page, `${folder}/dresser/00b-name.png`);

  await page.locator('#dresser-name').fill(DEMO);
  // Playwright pointer click flaky on velvet interior — DOM click is reliable
  await page
    .locator('.dresser-drawer.is-open .dresser-drawer__content')
    .getByRole('button', { name: 'Continue' })
    .evaluate((el) => /** @type {HTMLElement} */ (el).click());
  await page.getByRole('heading', { name: /Who eats/i }).waitFor({ state: 'visible', timeout: 15000 });
  await settle(page, 700);
  await shot(page, `${folder}/dresser/00c-profile.png`);

  await page
    .locator('.dresser-drawer.is-open .dresser-drawer__content button')
    .filter({ hasText: /^Skip$/ })
    .evaluate((el) => /** @type {HTMLElement} */ (el).click());
  await settle(page, 600);
  await page.getByRole('heading', { name: /How do you like to cook/i }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await settle(page, 500);
  await shot(page, `${folder}/dresser/00d-mode.png`);

  await page
    .locator('.dresser-drawer.is-open .dresser-drawer__content button')
    .filter({ hasText: /Skip — open my book/ })
    .evaluate((el) => /** @type {HTMLElement} */ (el).click());
  await settle(page, 400);
  // Rise → settle window (~700–1400ms); capture mid-reveal
  await page.locator('.dresser-book').waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 900);
  await shot(page, `${folder}/dresser/00e-reveal.png`);

  await waitFooterPage(page, 1, 30000);
  await shot(page, `${folder}/dresser/01-cover-handoff.png`);

  // Skin stills — editorial + candlelit welcome
  for (const skin of ['editorial', 'candlelit']) {
    await page.addInitScript(() => {
      try {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          configurable: true,
          get: () => 8,
        });
      } catch {
        /* ignore */
      }
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((s) => {
      localStorage.clear();
      localStorage.setItem('cookcap-theme', 'light');
      localStorage.setItem('cookcap-skin', s);
      document.documentElement.setAttribute('data-skin', s);
    }, skin);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page, 700);
    await page.locator('.dresser-scene').waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    await shot(page, `${folder}/dresser/skin-${skin}-welcome.png`);
  }
}

async function captureBookChrome(page, folder) {
  // Assumes already past onboarding with DEMO owner (or set owner)
  await page.evaluate((name) => {
    localStorage.setItem('cookcap-owner', name);
    localStorage.setItem('cookcap-onboarded', '1');
    localStorage.setItem('cookcap-theme', 'light');
  }, DEMO);

  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitFooterPage(page, 1);
  await shot(page, `${folder}/01-cover.png`);

  await nextPage(page);
  await waitFooterPage(page, 2);
  await shot(page, `${folder}/02-title.png`);

  await nextPage(page);
  await waitFooterPage(page, 3);
  await shot(page, `${folder}/03-friends.png`);

  await nextPage(page);
  await waitFooterPage(page, 4);
  await shot(page, `${folder}/04-contents.png`);

  await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await waitFooterReady(page, 60000);
  await page.waitForFunction(
    () => {
      const cook = [...document.querySelectorAll('button')].find(
        (b) => (b.textContent || '').trim() === 'Cook mode' && b.offsetParent !== null,
      );
      return Boolean(cook);
    },
    null,
    { timeout: 60000 },
  );
  await settle(page, 800);
  const cookBtn = page
    .getByRole('button', { name: 'Cook mode' })
    .filter({ visible: true })
    .first();
  await page.evaluate(() => {
    document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0);
  });
  await settle(page, 500);
  await shot(page, `${folder}/05-recipe.png`);

  await cookBtn.scrollIntoViewIfNeeded();
  await cookBtn.click();
  await page.getByRole('button', { name: 'Exit cooking mode' }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await settle(page, 450);
  await shot(page, `${folder}/06-cook-mode.png`);
  await page.keyboard.press('Escape');
  await settle(page, 350);

  await page.getByRole('button', { name: 'Search recipes' }).click();
  await page.getByPlaceholder(/Search recipes/i).waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 350);
  await shot(page, `${folder}/07-search.png`);

  await page.getByRole('button', { name: /^Shopping$/ }).click();
  await page.locator('#shopping-drawer-title').waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 400);
  await shot(page, `${folder}/08-shopping.png`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  await page.getByRole('button', { name: 'Search recipes' }).click();
  await page.getByPlaceholder(/Search recipes/i).waitFor({ state: 'visible', timeout: 8000 });
  await page.getByRole('button', { name: /^This week$/ }).click();
  await page.locator('#meal-planner-title').waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 400);
  await shot(page, `${folder}/09-meal-planner.png`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  await setDarkMode(page, true);
  await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await waitFooterReady(page, 60000);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button')].some(
        (b) => (b.textContent || '').trim() === 'Cook mode' && b.offsetParent !== null,
      ),
    null,
    { timeout: 60000 },
  );
  await page.evaluate(() => {
    document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0);
  });
  await settle(page, 600);
  await shot(page, `${folder}/10-recipe-dark.png`);
  await setDarkMode(page, false);

  await page.evaluate(() => localStorage.setItem('cookcap-pos', '4'));
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitFooterPage(page, 5);
  await shot(page, `${folder}/11-chapter.png`);

  const tabs = page.getByRole('button', { name: 'Open chapter tabs' });
  if (await tabs.isVisible().catch(() => false)) {
    await tabs.click();
    await page.getByText(/Chapters|Pakistani/i).first().waitFor({ state: 'visible', timeout: 8000 });
    await settle(page, 400);
    await shot(page, `${folder}/12-tabs-sheet.png`);
    await page.keyboard.press('Escape');
    await settle(page, 300);
  }

  await page.evaluate((name) => {
    localStorage.setItem('cookcap-mode', 'plate');
    localStorage.setItem('cookcap-owner', name);
  }, DEMO);
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitFooterReady(page, 60000);
  await settle(page, 600);

  await page.getByRole('button', { name: /^Mode —/ }).click();
  await page.getByRole('heading', { name: 'Choose a mode' }).waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 400);
  await shot(page, `${folder}/13-mode-chooser.png`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  await page.getByRole('button', { name: /Profiles|Open profiles/i }).first().click({ force: true });
  await settle(page, 500);
  await shot(page, `${folder}/14-profiles.png`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  await openMore(page);
  await page.getByRole('button', { name: 'Calendar', exact: true }).click({ force: true });
  await settle(page, 500);
  await shot(page, `${folder}/15-calendar.png`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  await openMore(page);
  await page.getByRole('button', { name: /Pantry/i }).click({ force: true });
  await settle(page, 500);
  await shot(page, `${folder}/16-pantry.png`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  await page.goto(`${BASE}/?recipe=${RECIPE}&for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitFooterReady(page, 60000);
  await page.evaluate(() => document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 0));
  await settle(page, 600);
  await shot(page, `${folder}/17-recipe-plate.png`);

  // Appearance panel (clickable after desk z-fix)
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('heading', { name: 'Appearance' }).waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 400);
  await shot(page, `${folder}/18-appearance.png`);
  await page.keyboard.press('Escape');
}

async function captureSet(page, folder) {
  await captureSimpleOnboarding(page, folder);
  await captureBookChrome(page, folder);
}

async function captureAppearanceMatrix(page, folder) {
  const skins = ['editorial', 'candlelit', 'lightbook', 'modern'];
  const tabStyles = ['paper', 'cloth', 'index', 'top', 'pills'];
  mkdirSync(join(OUT, folder, 'appearance'), { recursive: true });

  for (const skin of skins) {
    for (const tabs of tabStyles) {
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.evaluate(
        ({ skin, tabs, name }) => {
          localStorage.clear();
          localStorage.setItem('cookcap-skin', skin);
          localStorage.setItem('cookcap-tabs', tabs);
          localStorage.setItem('cookcap-readmode', 'flip');
          localStorage.setItem('cookcap-theme', 'light');
          localStorage.setItem('cookcap-owner', name);
          localStorage.setItem('cookcap-onboarded', '1');
          localStorage.setItem('cookcap-pos', '0');
          document.documentElement.setAttribute('data-skin', skin);
          document.documentElement.setAttribute('data-tabs', tabs);
          document.documentElement.setAttribute('data-readmode', 'flip');
          document.documentElement.setAttribute('data-theme', 'light');
        },
        { skin, tabs, name: DEMO },
      );
      await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await waitFooterReady(page, 60000);
      await settle(page, 600);
      await shot(page, `${folder}/appearance/${skin}-${tabs}-cover.png`);
    }
  }

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((name) => {
    localStorage.clear();
    localStorage.setItem('cookcap-skin', 'editorial');
    localStorage.setItem('cookcap-tabs', 'paper');
    localStorage.setItem('cookcap-readmode', 'flip');
    localStorage.setItem('cookcap-theme', 'light');
    localStorage.setItem('cookcap-owner', name);
    localStorage.setItem('cookcap-onboarded', '1');
    document.documentElement.setAttribute('data-skin', 'editorial');
    document.documentElement.setAttribute('data-tabs', 'paper');
    document.documentElement.setAttribute('data-theme', 'light');
  }, DEMO);
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, { waitUntil: 'domcontentloaded' });
  await waitFooterReady(page, 60000);
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('heading', { name: 'Appearance' }).waitFor({ state: 'visible', timeout: 8000 });
  await settle(page, 400);
  await shot(page, `${folder}/appearance/panel.png`);
  await page.keyboard.press('Escape');
}

/** All 4 tab styles × 2 skins — for owner pick (do not change default). */
async function captureTabOptions(page, folder) {
  const styles = ['paper', 'cloth', 'index', 'top', 'pills'];
  const skins = ['editorial', 'candlelit'];
  mkdirSync(join(OUT, folder, 'tabs'), { recursive: true });

  for (const skin of skins) {
    for (const tabs of styles) {
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.evaluate(
        ({ skin, tabs, name }) => {
          localStorage.clear();
          localStorage.setItem('cookcap-skin', skin);
          localStorage.setItem('cookcap-tabs', tabs);
          localStorage.setItem('cookcap-readmode', 'flip');
          localStorage.setItem('cookcap-theme', 'light');
          localStorage.setItem('cookcap-owner', name);
          localStorage.setItem('cookcap-onboarded', '1');
          localStorage.setItem('cookcap-pos', '0');
          document.documentElement.setAttribute('data-skin', skin);
          document.documentElement.setAttribute('data-tabs', tabs);
          document.documentElement.setAttribute('data-theme', 'light');
        },
        { skin, tabs, name: DEMO },
      );
      await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await waitFooterReady(page, 60000);
      await settle(page, 700);
      await shot(page, `${folder}/tabs/${tabs}-${skin}.png`);
    }
  }
}

async function main() {
  console.log(`Gallery → ${OUT}`);
  console.log(`Base URL ${BASE} · recipe ${RECIPE} · demo ${DEMO}`);

  const only = (process.env.GALLERY_DEVICE || 'all').toLowerCase();
  const browser = await chromium.launch({ headless: true });

  if (only === 'all' || only === 'desktop') {
    // Simple path (reduce) + book chrome
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    console.log('Desktop (simple onboard + chrome)…');
    await captureSet(page, 'desktop');
    console.log('Desktop appearance matrix…');
    await captureAppearanceMatrix(page, 'desktop');
    console.log('Desktop tab options…');
    await captureTabOptions(page, 'desktop');
    await context.close();

    // Dresser stills
    const dresserCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    });
    const dresserPage = await dresserCtx.newPage();
    console.log('Desktop dresser…');
    await captureDresserOnboarding(dresserPage, 'desktop');
    await dresserCtx.close();
  }

  if (only === 'all' || only === 'mobile') {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    console.log('Mobile (simple onboard + chrome)…');
    await captureSet(page, 'mobile');
    console.log('Mobile appearance matrix…');
    await captureAppearanceMatrix(page, 'mobile');
    console.log('Mobile tab options…');
    await captureTabOptions(page, 'mobile');
    await context.close();

    const dresserCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    });
    const dresserPage = await dresserCtx.newPage();
    console.log('Mobile dresser…');
    await captureDresserOnboarding(dresserPage, 'mobile');
    await dresserCtx.close();
  }

  await browser.close();
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
