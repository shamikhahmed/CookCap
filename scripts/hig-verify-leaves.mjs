#!/usr/bin/env node
/**
 * HIG cover-height / leaf-fill verify + screenshot regen for qa/hig/.
 * Usage: serve out/ → node scripts/hig-verify-leaves.mjs [baseUrl]
 * Default: http://127.0.0.1:8831/
 */
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://127.0.0.1:8831/';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'qa', 'hig');
fs.mkdirSync(OUT, { recursive: true });

async function boot(kind) {
  const browser = kind === 'ipad' ? await chromium.launch() : await webkit.launch();
  const ctx =
    kind === 'ipad'
      ? await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
      : await browser.newContext({
          ...devices['iPhone 15 Pro'],
          colorScheme: kind === 'dark' ? 'dark' : 'light',
        });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookcap-owner', 'Ayesha');
      localStorage.setItem('cookcap-whats-new', '3.7.6');
      localStorage.setItem('cookcap-onboarded', '1');
    } catch {
      /* ignore */
    }
  });
  await page.goto(BASE + '?demo=1');
  if (kind === 'dark') {
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
  }
  await page
    .waitForFunction(() => document.documentElement.dataset.appReady === 'true', { timeout: 45000 })
    .catch(() => undefined);
  await page.waitForTimeout(700);
  for (const label of [/begin/i, /dismiss/i, /later/i, /skip/i]) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
      await btn.click().catch(() => undefined);
    }
  }
  const coverBtn = page.getByRole('button', { name: /Cover/i }).first();
  if (await coverBtn.isVisible().catch(() => false)) {
    await coverBtn.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
  return { browser, page };
}

async function goPage(page, pageNum1) {
  await page.locator('.app-footer button[aria-haspopup="dialog"]').first().click({ force: true });
  await page.waitForTimeout(200);
  const num = page.locator('input[type="number"]').first();
  await num.waitFor({ state: 'visible', timeout: 3000 });
  await num.fill(String(pageNum1));
  await num.press('Enter');
  await page.waitForTimeout(700);
}

async function measure(page) {
  return page.evaluate(() => {
    const frame = document.querySelector('.book-frame')?.getBoundingClientRect();
    const footer = document.querySelector('.app-footer')?.getBoundingClientRect();
    const desk = document.querySelector('.journal-desk');
    const pad = desk ? parseFloat(getComputedStyle(desk).paddingBottom) : 0;
    return {
      vh: innerHeight,
      frameH: frame?.height ?? 0,
      fill: frame ? frame.height / innerHeight : 0,
      pad,
      footerH: footer?.height ?? 0,
      gap: footer && frame ? footer.top - frame.bottom : null,
      bodyOY: getComputedStyle(document.body).overflowY,
    };
  });
}

const issues = [];
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `  (${detail})`}`);
  if (!ok) issues.push({ name, detail });
};

async function shotKind(kind, pages) {
  for (const [pageNum, file] of pages) {
    const { browser, page } = await boot(kind);
    if (pageNum !== 1) await goPage(page, pageNum);
    const m = await measure(page);
    check(
      `${kind} p${pageNum} fills`,
      m.fill >= 0.55 && m.frameH >= m.vh * 0.4,
      JSON.stringify({ fill: m.fill, frameH: m.frameH }),
    );
    check(`${kind} p${pageNum} pad clears bar`, m.pad >= m.footerH + 40, JSON.stringify(m));
    check(`${kind} p${pageNum} body not hidden`, m.bodyOY !== 'hidden', m.bodyOY);
    check(
      `${kind} p${pageNum} above bar`,
      m.gap == null || m.gap >= -4,
      JSON.stringify({ gap: m.gap }),
    );
    await page.screenshot({ path: path.join(OUT, file), fullPage: false, animations: 'disabled' });
    await browser.close();
  }
}

await shotKind('light', [
  [1, 'after-phone-light.png'],
  [4, 'after-phone-light-contents.png'],
  [7, 'after-phone-light-recipe.png'],
  [826, 'after-phone-light-last.png'],
]);
await shotKind('dark', [
  [1, 'after-phone-dark.png'],
  [4, 'after-phone-dark-contents.png'],
  [7, 'after-phone-dark-recipe.png'],
  [826, 'after-phone-dark-last.png'],
]);
await shotKind('ipad', [
  [1, 'after-ipad.png'],
  [4, 'after-ipad-contents.png'],
  [7, 'after-ipad-recipe.png'],
  [826, 'after-ipad-last.png'],
]);

async function pair(afterName, outName, label) {
  const beforePath = path.join(OUT, 'before-phone-light.png');
  const afterPath = path.join(OUT, afterName);
  if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
    console.log(`SKIP pair ${outName}`);
    return;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 980 } });
  const before = fs.readFileSync(beforePath).toString('base64');
  const after = fs.readFileSync(afterPath).toString('base64');
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;font-family:ui-sans-serif,system-ui;background:#1a1510;color:#f5efe4}
    .wrap{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px}
    figure{margin:0} img{width:100%;display:block;border-radius:8px}
    figcaption{font:600 13px/1.2 ui-sans-serif;padding:8px 4px;letter-spacing:.04em;text-transform:uppercase}
    h1{font:600 15px/1.2 ui-sans-serif;padding:12px 12px 0;margin:0;letter-spacing:.06em;text-transform:uppercase;opacity:.85}
  </style></head><body>
  <h1>${label}</h1>
  <div class="wrap">
    <figure><figcaption>Before (origin/main)</figcaption><img src="data:image/png;base64,${before}"/></figure>
    <figure><figcaption>After (design/hig-3)</figcaption><img src="data:image/png;base64,${after}"/></figure>
  </div></body></html>`);
  await page.screenshot({ path: path.join(OUT, outName), fullPage: true, animations: 'disabled' });
  await browser.close();
  console.log(`wrote ${outName}`);
}

await pair('after-phone-light.png', 'pairs-phone-light.png', 'CookCap HIG 3 — phone light cover');
await pair('after-phone-dark.png', 'pairs-phone-dark.png', 'CookCap HIG 3 — phone dark cover');
await pair('after-ipad.png', 'pairs-ipad.png', 'CookCap HIG 3 — iPad cover');

if (issues.length) {
  console.error(`\n${issues.length} FAIL(s)`);
  process.exit(1);
}
console.log('\nAll leaf geometry checks PASS');
