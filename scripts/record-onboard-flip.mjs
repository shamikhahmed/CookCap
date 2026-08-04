#!/usr/bin/env node
/**
 * Record onboarding → cover open → page flip, with frame timing.
 * Proves 60fps-ish: no >50ms longtasks during the ceremony (bible Acceptance).
 *
 *   npm run pages:build
 *   # serve out under /CookCap on :3456
 *   GATE_URL=http://127.0.0.1:3456/CookCap node scripts/record-onboard-flip.mjs
 *
 * Outputs:
 *   docs/gallery/recordings/onboard-flip.webm
 *   docs/gallery/recordings/onboard-flip-metrics.json
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, renameSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'gallery', 'recordings');
const BASE = process.env.GATE_URL || process.env.GALLERY_URL || 'http://127.0.0.1:3456/CookCap';
const DEMO = 'Ayesha';

mkdirSync(OUT, { recursive: true });

/** @param {import('playwright').Locator} loc */
async function domClick(loc) {
  await loc.evaluate((el) => /** @type {HTMLElement} */ (el).click());
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
    recordVideo: {
      dir: OUT,
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();

  /* Force 3D dresser + fresh first-run + concurrency for dresser gate */
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        get: () => 8,
      });
    } catch {
      /* ignore */
    }
    localStorage.clear();
    localStorage.setItem('cookcap-force-dresser', '1');
    localStorage.setItem('cookcap-theme', 'light');
    localStorage.setItem('cookcap-skin', 'editorial');
    localStorage.setItem('cookcap-tabs', 'paper');
    localStorage.setItem('cookcap-sound', '0');
  });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  /* Inject longtask + rAF frame sampler */
  await page.evaluate(() => {
    window.__ccFrames = [];
    window.__ccLong = [];
    let last = performance.now();
    const tick = (t) => {
      window.__ccFrames.push(t - last);
      last = t;
      if (window.__ccFrames.length < 1200) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__ccLong.push({ name: e.name, dur: e.duration, start: e.startTime });
        }
      });
      po.observe({ type: 'longtask', buffered: true });
      window.__ccPo = po;
    } catch {
      /* Safari / missing longtask */
    }
  });

  const mark = async (label) => {
    await page.evaluate((l) => {
      performance.mark(`cc:${l}`);
      window.__ccMarks = window.__ccMarks || [];
      window.__ccMarks.push({ label: l, t: performance.now() });
    }, label);
  };

  await page.waitForTimeout(600);
  await mark('ready');

  /* Prefer dresser; fall back to simple Begin */
  const dresser = page.locator('.dresser-scene');
  if (await dresser.isVisible().catch(() => false)) {
    await mark('dresser');
  }

  const begin = page.getByRole('button', { name: 'Begin', exact: true });
  await begin.waitFor({ state: 'visible', timeout: 30000 });
  await begin.click();
  await mark('begin');

  /* Name — #dresser-name or labeled field */
  const nameInput = page.locator('#dresser-name').or(page.getByLabel('Your name'));
  await nameInput.first().waitFor({ state: 'visible', timeout: 15000 });
  await nameInput.first().fill(DEMO);

  const continueInDrawer = page
    .locator('.dresser-drawer.is-open .dresser-drawer__content')
    .getByRole('button', { name: 'Continue' });
  if (await continueInDrawer.isVisible().catch(() => false)) {
    await domClick(continueInDrawer);
  } else {
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  await mark('named');

  /* Profile */
  await page.getByRole('heading', { name: /Who eats/i }).waitFor({ state: 'visible', timeout: 15000 });
  const skipProfile = page
    .locator('.dresser-drawer.is-open .dresser-drawer__content button')
    .filter({ hasText: /^Skip$/ });
  if (await skipProfile.first().isVisible().catch(() => false)) {
    await domClick(skipProfile.first());
  } else {
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await mark('skip-profile');

  /* Mode */
  await page.getByRole('heading', { name: /How do you like to cook/i }).waitFor({
    state: 'visible',
    timeout: 15000,
  });
  const skipMode = page
    .locator('.dresser-drawer.is-open .dresser-drawer__content button')
    .filter({ hasText: /Skip — open my book/ });
  if (await skipMode.first().isVisible().catch(() => false)) {
    await domClick(skipMode.first());
  } else {
    await page.getByRole('button', { name: /Skip — open my book/i }).click();
  }
  await mark('skip-mode');

  /* Reveal → cover */
  await page.waitForTimeout(1200);
  await mark('after-reveal');

  /* Wait for book chrome / cover */
  await page.locator('button[aria-label="Next page"]').waitFor({ state: 'visible', timeout: 30000 });
  await mark('book-ready');
  /* Reset frame sampler for ceremony-only gate */
  await page.evaluate(() => {
    window.__ccFrames = [];
    window.__ccLongCeremony = [];
    let last = performance.now();
    const tick = (t) => {
      window.__ccFrames.push(t - last);
      last = t;
      if (window.__ccFrames.length < 600) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const cover = page.locator('[data-tap-advance]').first();
  if (await cover.isVisible().catch(() => false)) {
    await mark('cover-visible');
    await cover.click({ force: true });
    await mark('cover-open');
    await page.waitForTimeout(900);
  } else {
    await mark('no-cover-tap');
  }

  const nextBtn = page.locator('button[aria-label="Next page"]');
  for (let i = 0; i < 3; i++) {
    if (!(await nextBtn.isVisible().catch(() => false))) break;
    await nextBtn.click();
    await mark(`flip-${i + 1}`);
    await page.waitForTimeout(750);
  }

  await page.waitForTimeout(400);
  await mark('done');

  const metrics = await page.evaluate(() => {
    const frames = window.__ccFrames || [];
    const long = window.__ccLong || [];
    const marks = window.__ccMarks || [];
    const bookMark = marks.find((m) => m.label === 'book-ready');
    const t0 = bookMark ? bookMark.t : 0;
    /* Approx: frames sampled from page start; slice last N covering ceremony */
    const ceremonyLong = long.filter((x) => x.start >= t0);
    const over33 = frames.filter((d) => d > 33.4).length;
    const over50 = frames.filter((d) => d > 50).length;
    const max = frames.length ? Math.max(...frames) : 0;
    const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0;
    return {
      frameSamples: frames.length,
      avgFrameMs: Math.round(avg * 100) / 100,
      maxFrameMs: Math.round(max * 100) / 100,
      framesOver33ms: over33,
      framesOver50ms: over50,
      longTasks: long.length,
      longTaskMaxMs: long.length ? Math.round(Math.max(...long.map((x) => x.dur)) * 100) / 100 : 0,
      longTasksOver50: long.filter((x) => x.dur > 50).length,
      ceremony: {
        fromMark: 'book-ready',
        t0,
        longTasks: ceremonyLong.length,
        longTaskMaxMs: ceremonyLong.length
          ? Math.round(Math.max(...ceremonyLong.map((x) => x.dur)) * 100) / 100
          : 0,
        longTasksOver50: ceremonyLong.filter((x) => x.dur > 50).length,
      },
      marks,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      dpr: window.devicePixelRatio,
    };
  });

  const pagePath = await page.video()?.path();
  await context.close();
  await browser.close();

  const destWebm = join(OUT, 'onboard-flip.webm');
  if (pagePath && existsSync(pagePath)) {
    try {
      renameSync(pagePath, destWebm);
    } catch {
      copyFileSync(pagePath, destWebm);
    }
  }

  const report = {
    recordedAt: new Date().toISOString(),
    base: BASE,
    demo: DEMO,
    video: 'docs/gallery/recordings/onboard-flip.webm',
    note: 'Mobile viewport 390×844 @3x Chromium (device-class). Gate = ceremony window after book-ready (cover open + flips). Full-session longtasks reported separately (hydrators may spike on Begin).',
    metrics,
    /* Bible acceptance: no >50ms longtask during cover/flip ceremony */
    pass:
      metrics.ceremony.longTasksOver50 === 0 &&
      metrics.framesOver50ms <= Math.max(5, Math.floor(metrics.frameSamples * 0.03)),
  };

  writeFileSync(join(OUT, 'onboard-flip-metrics.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) {
    console.error('RECORD FAIL — too many long frames/tasks');
    process.exit(1);
  }
  console.log('RECORD PASS — video + metrics written');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
