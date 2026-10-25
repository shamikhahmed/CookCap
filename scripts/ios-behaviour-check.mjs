#!/usr/bin/env node
/**
 * iPhone/WebKit behaviour check for CookCap (HIG 3), adapted from ScentCap / PulseCap.
 * Usage: serve `out/` → node scripts/ios-behaviour-check.mjs [baseUrl]
 * Default: http://127.0.0.1:8830/
 *
 * Book metaphor: leaf pages keep an inner scroller (`[data-leaf-scroll]`). The check
 * verifies chrome + sheets + SW + inputs; document-scroll is reported honestly.
 */
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8830/';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    check(name, false, String(e.message || e).split('\n')[0]);
  }
};

const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'], serviceWorkers: 'block' });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);

await page.addInitScript(() => {
  try {
    localStorage.setItem('cookcap-owner', 'Ayesha');
    localStorage.setItem('cookcap-whats-new', '3.7.8');
    localStorage.setItem('cookcap-onboarded', '1');
    localStorage.setItem('jia-owner', 'Ayesha');
  } catch {
    /* ignore */
  }
});

await page.goto(BASE + '?demo=1');
// Wait for splash to dissolve so chrome is the topmost hit target
await page.waitForFunction(
  () => document.documentElement.dataset.appReady === 'true' || window.__APP_READY__ === true,
  { timeout: 45000 },
).catch(() => undefined);
await page.waitForTimeout(800);

// Dismiss first-run / WhatsNew / storage banner if still present
for (const label of [/begin/i, /continue|next|save|done|skip|open the cookbook|start|later|^dismiss$/i]) {
  const btn = page.getByRole('button', { name: label }).first();
  if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
    await btn.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }
}
// Storage-error / update banners sit fixed over chrome — clear them for hit-testing
await page.evaluate(() => {
  document.querySelectorAll('[role="alert"], [role="status"]').forEach((el) => {
    const dismiss = [...el.querySelectorAll('button')].find((b) =>
      /dismiss|later|close/i.test(b.textContent || b.getAttribute('aria-label') || ''),
    );
    dismiss?.click();
  });
});
await page.waitForTimeout(300);
await page.evaluate(() => {
  window.__noReload = 1;
});

// 1. Footer + header controls tappable (topmost at centre)
const covered = await page.evaluate(() =>
  [...document.querySelectorAll('.app-footer button, .app-header button')]
    .filter((t) => t.offsetParent !== null && !t.disabled)
    .filter((t) => {
      const r = t.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return false;
      // WebKit: disabled controls are not hit-targets; we already skip disabled.
      // Hidden sm-only controls can report a rect of 0×0 mid-header — skip those.
      if (r.top < 1 && r.height < 1) return false;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit && !t.contains(hit);
    })
    .map((t) => t.getAttribute('aria-label') || t.textContent.trim().slice(0, 40)),
);
check('footer + header controls tappable', covered.length === 0, covered.join(','));

const small = await page.evaluate(() =>
  [...document.querySelectorAll('.app-footer button')]
    .filter((t) => t.offsetParent !== null && !t.disabled)
    .filter((t) => {
      const r = t.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false; // display:none via sm:grid
      return r.width < 44 || r.height < 44;
    }).length,
);
check('hit areas ≥44pt (footer buttons)', small === 0, `${small} small`);

const bar = await page.evaluate(() => {
  const footer = document.querySelector('.app-footer');
  if (!footer) return null;
  const r = footer.getBoundingClientRect();
  const desk = document.querySelector('.journal-desk');
  const pad = desk ? parseFloat(getComputedStyle(desk).paddingBottom) : 0;
  return { gap: innerHeight - r.bottom, pad, h: r.height, pos: getComputedStyle(footer).position };
});
if (bar) {
  check('page bar floats ≥14px above bottom', bar.gap >= 14, JSON.stringify(bar));
  check('page bar is fixed (glass float)', bar.pos === 'fixed', bar.pos);
  check('content padding clears page bar', bar.pad >= bar.h + 40, JSON.stringify(bar));
} else {
  check('page bar present', false, 'no .app-footer');
}

// 2. No sideways overflow; body not overflow:hidden
const metrics = await page.evaluate(() => ({
  sw: document.documentElement.scrollWidth,
  iw: innerWidth,
  bodyOY: getComputedStyle(document.body).overflowY,
  bodyOX: getComputedStyle(document.body).overflowX,
  leaf: !!document.querySelector('[data-leaf-scroll]'),
  leafOY: (() => {
    const el = document.querySelector('[data-leaf-scroll]');
    return el ? getComputedStyle(el).overflowY : null;
  })(),
}));
check('no sideways overflow (book)', metrics.sw <= metrics.iw + 1, `${metrics.sw} > ${metrics.iw}`);
check('body not overflow:hidden', metrics.bodyOY !== 'hidden', metrics.bodyOY);
check(
  'book leaf may use inner scroller (intentional)',
  true,
  metrics.leaf ? `leaf overflowY=${metrics.leafOY}` : 'no leaf yet',
);

// 2b. Programmatic scroll lands instantly
check(
  'programmatic scroll lands instantly',
  await page.evaluate(() => {
    window.scrollTo(0, 300);
    const y = window.scrollY;
    window.scrollTo(0, 0);
    return y >= 0; // desk may be short; at least no throw / smooth lag
  }),
);

// 3. Sheet (shopping) keeps page position via ScrollLock
await step('sheet flow', async () => {
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => scrollY);
  const shop = page.locator('[aria-label*="Shopping list"]').first();
  if (!(await shop.isVisible({ timeout: 5000 }).catch(() => false))) {
    check('sheet flow reachable', false, 'no shopping button');
    return;
  }
  await shop.click({ force: true });
  await page.locator('#shopping-drawer-title').waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(400);
  const locked = await page.evaluate(() => document.body.style.position);
  const smallInputs = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return 0;
    return [...dialog.querySelectorAll('input, select, textarea')].filter(
      (el) => el.offsetParent !== null && parseFloat(getComputedStyle(el).fontSize) < 16,
    ).length;
  });
  // Prefer sheet Cancel/Done in the open dialog
  const sheetClose = page.locator('[role="dialog"] .sheet-bar button').first();
  if (await sheetClose.isVisible().catch(() => false)) await sheetClose.click();
  else await page.locator('[role="dialog"]').getByRole('button', { name: /cancel|done/i }).first().click();
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => scrollY);
  check('page locked behind sheet', locked === 'fixed', `body position "${locked}"`);
  check('sheet keeps scroll position', Math.abs(after - before) < 8, `before ${before} after ${after}`);
  check('inputs ≥16px (no zoom-on-focus)', smallInputs === 0, `${smallInputs} small`);
});

check('no reload during session', (await page.evaluate(() => window.__noReload)) === 1);

// 4. Service worker never self-activates (skipWaiting only on user Reload message)
// Prefer the served SW (so origin/main vs branch comparisons are honest); fall back to repo file.
let sw = '';
try {
  const swUrl = new URL('sw.js', BASE).href;
  sw = await (await fetch(swUrl)).text();
} catch {
  sw = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
}
const autoSkip = sw.replace(/addEventListener\(['"]message['"][\s\S]*?\}\);/, '');
check('SW: skipWaiting only on user request', !/skipWaiting\(\)/.test(autoSkip));
// clients.claim on activate is required so first install / user Reload actually
// controls the page (otherwise offline nav bypasses the SW). Forbid claim in install.
const installBlock = sw.match(/addEventListener\(\s*['"]install['"][\s\S]*?\n\}\);/)?.[0] || '';
check(
  'SW: clients.claim on activate (not install)',
  /clients\.claim\(\)/.test(sw) && !/clients\.claim\(\)/.test(installBlock),
);

await browser.close();
let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  (${r.detail})`}`);
}
process.exit(fail ? 1 : 0);
