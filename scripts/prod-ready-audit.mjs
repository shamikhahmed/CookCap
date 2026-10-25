#!/usr/bin/env node
/**
 * CookCap prod-ready sweep — Chromium + iPhone 15 Pro metrics (WebKit may fail in sandbox).
 * Usage: serve out/ → node scripts/prod-ready-audit.mjs [baseUrl]
 * Writes qa/prod-ready/audit-log.json + representative shots.
 */
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const BASE = process.argv[2] || 'http://127.0.0.1:8920/';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'qa', 'prod-ready');
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const APP_VER = JSON.parse(fs.readFileSync(path.join(ROOT, 'VERSION.json'), 'utf8')).version;
const CHROME =
  process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const require = createRequire(import.meta.url);
let AxeBuilder = null;
try {
  AxeBuilder = require('@axe-core/playwright').default;
} catch {
  /* optional */
}

function phoneCtx(browser, extra = {}) {
  const d = { ...devices['iPhone 15 Pro'] };
  delete d.defaultBrowserType;
  return browser.newContext({ ...d, ...extra });
}

async function seed(page, theme = 'light') {
  await page.addInitScript(
    ({ theme, ver }) => {
      try {
        localStorage.setItem('cookcap-theme', theme);
        localStorage.setItem('cookcap-owner', 'Ayesha');
        localStorage.setItem('cookcap-whats-new', ver);
        localStorage.setItem('cookcap-onboarded', '1');
      } catch {
        /* ignore */
      }
    },
    { theme, ver: APP_VER },
  );
}

async function dismissChrome(page) {
  for (const label of [/begin/i, /dismiss/i, /later/i, /skip/i, /got it/i]) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
      await btn.click().catch(() => undefined);
    }
  }
}

async function waitAppReady(page, timeout = 45000) {
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.appReady === 'true' ||
      window.__APP_READY__ === true,
    { timeout },
  );
}

async function goPage(page, n) {
  const trigger = page.locator('.app-footer button[aria-haspopup="dialog"]').first();
  await trigger.click({ force: true });
  const dialog = page.locator('[role="dialog"][aria-label="Go to page"]');
  await dialog.waitFor({ state: 'visible', timeout: 3000 });
  const num = dialog.locator('input[type="number"]').first();
  await num.fill(String(n));
  await dialog.getByRole('button', { name: /^Go$/i }).click();
  await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function shot(page, name) {
  const dest = path.join(SHOTS, name);
  await page.screenshot({ path: dest, type: 'png' });
  return dest;
}

async function axeScan(page, id, findings) {
  if (!AxeBuilder) {
    findings.push({ id, severity: 'info', msg: 'axe skipped — @axe-core/playwright missing' });
    return;
  }
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const bad = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact || ''),
  );
  for (const v of bad) {
    findings.push({
      id,
      severity: v.impact,
      msg: `${v.id}: ${v.help}`,
      nodes: v.nodes.length,
    });
  }
  return { violations: results.violations.length, serious: bad.length };
}

const log = {
  base: BASE,
  browser: 'chromium (iPhone 15 Pro metrics — WebKit not required here)',
  started: new Date().toISOString(),
  console: [],
  pageErrors: [],
  findings: [],
  screens: [],
  axe: {},
  overlays: [],
  offline: null,
  emptyProfile: null,
};

const browser = await chromium.launch({
  headless: true,
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
});

// ——— Demo profile visual pass ———
{
  const ctx = await phoneCtx(browser, { colorScheme: 'light' });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push({ theme: 'light', text: m.text() });
  });
  page.on('pageerror', (e) => log.pageErrors.push({ theme: 'light', text: String(e) }));
  await seed(page, 'light');
  await page.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await dismissChrome(page);

  const sizes = [
    { w: 375, h: 812, tag: '375' },
    { w: 390, h: 844, tag: '390' },
    { w: 430, h: 932, tag: '430' },
  ];
  for (const s of sizes) {
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    if (overflow.docW > overflow.clientW + 1) {
      log.findings.push({
        id: `overflow-${s.tag}`,
        severity: 'high',
        msg: `horizontal overflow ${overflow.docW}>${overflow.clientW}`,
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });

  for (const [n, name] of [
    [1, 'leaf-cover-light'],
    [4, 'leaf-contents-light'],
    [7, 'leaf-recipe-light'],
  ]) {
    await goPage(page, n);
    await shot(page, `${name}.png`);
    log.screens.push(name);
    log.axe[name] = await axeScan(page, name, log.findings);
  }

  // Overlays
  const overlayOps = [
    {
      id: 'search',
      open: async () => page.getByRole('button', { name: /search/i }).first().click(),
      close: async () => page.keyboard.press('Escape'),
    },
    {
      id: 'shop',
      open: async () => page.getByRole('button', { name: /shopping/i }).first().click(),
      close: async () => {
        const c = page.getByRole('button', { name: /cancel|close|done/i }).first();
        if (await c.isVisible().catch(() => false)) await c.click();
        else await page.keyboard.press('Escape');
      },
    },
    {
      id: 'more-about',
      open: async () => {
        await page.getByRole('button', { name: /^More$/i }).click();
        await page.waitForTimeout(200);
        await page.getByRole('menuitem', { name: /about/i }).click();
      },
      close: async () => {
        const c = page.getByRole('button', { name: /close|done|cancel/i }).first();
        if (await c.isVisible().catch(() => false)) await c.click();
        else await page.keyboard.press('Escape');
      },
    },
  ];
  for (const op of overlayOps) {
    try {
      await op.open();
      await page.waitForTimeout(500);
      await shot(page, `overlay-${op.id}.png`);
      log.axe[`overlay-${op.id}`] = await axeScan(page, `overlay-${op.id}`, log.findings);
      await op.close();
      await page.waitForTimeout(300);
      log.overlays.push({ id: op.id, ok: true });
    } catch (e) {
      log.overlays.push({ id: op.id, ok: false, err: String(e.message || e) });
      log.findings.push({ id: op.id, severity: 'high', msg: `overlay failed: ${e.message || e}` });
    }
  }

  // Dead data-act / onclick smoke: click visible header buttons once
  const acts = await page.evaluate(() =>
    [...document.querySelectorAll('[data-act]')].map((el) => el.getAttribute('data-act')),
  );
  log.dataActs = acts;

  await ctx.close();
}

// ——— Dark recipe (already contrast-fixed) ———
{
  const ctx = await phoneCtx(browser, { colorScheme: 'dark' });
  const page = await ctx.newPage();
  await seed(page, 'dark');
  await page.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await dismissChrome(page);
  await goPage(page, 7);
  await shot(page, 'leaf-recipe-dark.png');
  log.screens.push('leaf-recipe-dark');
  log.axe['leaf-recipe-dark'] = await axeScan(page, 'leaf-recipe-dark', log.findings);
  await ctx.close();
}

// ——— iPad / desktop ———
{
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await seed(page, 'light');
  await page.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await dismissChrome(page);
  await shot(page, 'ipad-cover-light.png');
  log.screens.push('ipad-cover-light');
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await seed(page, 'light');
  await page.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await dismissChrome(page);
  await shot(page, 'desktop-cover-light.png');
  log.screens.push('desktop-cover-light');
  await ctx.close();
}

// ——— Empty / fresh profile ———
{
  const ctx = await phoneCtx(browser, { colorScheme: 'light' });
  const page = await ctx.newPage();
  // no owner seed — first-run path
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, 'fresh-first-run.png');
  const hasNameGate = await page.getByRole('textbox').or(page.getByLabel(/name/i)).first().isVisible().catch(() => false);
  const dresser = await page.locator('text=/name your|welcome|begin|your cookbook/i').first().isVisible().catch(() => false);
  log.emptyProfile = { hasNameGate, dresser, shot: 'fresh-first-run.png' };
  await ctx.close();
}

// ——— Offline after warm ———
{
  const ctx = await phoneCtx(browser, { colorScheme: 'light' });
  const page = await ctx.newPage();
  await seed(page, 'light');
  await page.goto(BASE + '?demo=1', { waitUntil: 'networkidle' }).catch(() =>
    page.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded' }),
  );
  await waitAppReady(page).catch(() => undefined);
  // Ensure SW controls the page and has warmed shell + JS/CSS before cutting network
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { regs: 0 };
    const reg = await navigator.serviceWorker.ready;
    // Ask active SW to cache current document scripts/styles
    const urls = [...document.querySelectorAll('script[src],link[rel="stylesheet"]')]
      .map((el) => el.href || el.src)
      .filter(Boolean);
    reg.active?.postMessage({ type: 'CACHE_URLS', urls });
    await new Promise((r) => setTimeout(r, 2000));
    return { regs: (await navigator.serviceWorker.getRegistrations()).length, controlled: !!navigator.serviceWorker.controller };
  });
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' }).catch((e) => e);
  let ready = false;
  try {
    await waitAppReady(page, 45000);
    ready = true;
  } catch {
    ready = false;
  }
  const offlineOk = await page.evaluate(() => {
    const splash = !!document.querySelector('.fixed.inset-0.z-\\[100\\], [aria-hidden] .font-serif');
    return {
      hasDesk: !!document.querySelector('.journal-desk'),
      hasBook: !!document.querySelector('.book-frame, .leather, [data-leaf-scroll]'),
      title: document.title,
      ready: document.documentElement.dataset.appReady || null,
      appReadyFlag: window.__APP_READY__ === true,
      bodyText: (document.body?.innerText || '').slice(0, 120),
      splashOnly:
        /cookcap\s*v?\s*[\d.]+/i.test((document.body?.innerText || '').trim()) &&
        !(document.documentElement.dataset.appReady === 'true'),
    };
  });
  await shot(page, 'offline-reload.png');
  log.offline = {
    ok: ready && offlineOk.hasDesk && offlineOk.ready === 'true' && !offlineOk.splashOnly,
    waitedForAppReady: ready,
    ...offlineOk,
  };
  if (!log.offline.ok) {
    log.findings.push({
      id: 'offline',
      severity: 'high',
      msg: 'offline reload did not reach app-ready / book (splash-only or timeout)',
    });
  }
  await ctx.close();
}

await browser.close();

log.finished = new Date().toISOString();
log.summary = {
  findings: log.findings.length,
  serious: log.findings.filter((f) => f.severity === 'critical' || f.severity === 'serious' || f.severity === 'high').length,
  consoleErrors: log.console.length,
  pageErrors: log.pageErrors.length,
};
fs.writeFileSync(path.join(OUT, 'audit-log.json'), JSON.stringify(log, null, 2));
console.log(JSON.stringify(log.summary, null, 2));
console.log('Wrote', path.join(OUT, 'audit-log.json'));
if (log.findings.length) {
  console.log('Findings:');
  for (const f of log.findings) console.log(`- [${f.severity}] ${f.id}: ${f.msg}`);
}
process.exit(log.summary.serious > 0 ? 1 : 0);
