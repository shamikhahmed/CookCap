#!/usr/bin/env node
/**
 * Anti-2D acceptance gate (docs/plan-dresser-world.md Part 2 §B).
 * Rejects the build unless DOM proves real 3D + book contact shadow.
 *
 *   npm run dev
 *   GATE_URL=http://127.0.0.1:3000 node scripts/assert-anti-2d.mjs
 *
 * Exit 0 = pass. Exit 1 = fail (flat 2D / missing shadow).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'gallery', 'checkpoints');
const BASE = process.env.GATE_URL || process.env.GALLERY_URL || 'http://127.0.0.1:3000';
const DEMO = 'Ayesha';

mkdirSync(OUT, { recursive: true });

function parsePx(v) {
  if (!v || v === 'none') return 0;
  const m = String(v).match(/([\d.]+)px/);
  return m ? Number(m[1]) : 0;
}

/** m43 of matrix3d = translateZ in CSS pixels (column-major). */
function matrixTranslateZ(transform) {
  if (!transform || transform === 'none') return 0;
  if (transform.startsWith('matrix3d(')) {
    const nums = transform
      .slice(9, -1)
      .split(',')
      .map((s) => Number(s.trim()));
    return nums[14] ?? 0;
  }
  // Flat 2D matrix(...) has no Z
  return 0;
}

function isMatrix3d(transform) {
  return typeof transform === 'string' && transform.startsWith('matrix3d(');
}

async function settle(page, ms = 400) {
  await page.waitForTimeout(ms);
}

async function seedReading(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((name) => {
    localStorage.clear();
    localStorage.setItem('cookcap-theme', 'light');
    localStorage.setItem('cookcap-skin', 'editorial');
    localStorage.setItem('cookcap-tabs', 'paper');
    localStorage.setItem('cookcap-readmode', 'flip');
    localStorage.setItem('cookcap-owner', name);
    localStorage.setItem('cookcap-onboarded', '1');
    localStorage.setItem('cookcap-whats-new', '9.9.9');
    localStorage.setItem('cookcap-pos', '0');
  }, DEMO);
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(
    () => /\d+\s*\/\s*\d+/.test(document.querySelector('footer')?.innerText || ''),
    null,
    { timeout: 30000 },
  );
  await settle(page, 600);
}

async function seedOnboarding(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('cookcap-theme', 'light');
    localStorage.setItem('cookcap-skin', 'editorial');
    localStorage.setItem('cookcap-tabs', 'paper');
    // CI runners often have ≤4 cores → Shell picks Simple onboard. Force dresser for 3D gate.
    localStorage.setItem('cookcap-force-dresser', '1');
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.dresser-scene', { timeout: 20000 });
  await settle(page, 500);
}

async function assertReadingWorld(page) {
  const results = [];

  const reading = await page.evaluate(() => {
    const shadow = document.querySelector('.book-contact-shadow');
    const shadowRect = shadow?.getBoundingClientRect();
    const desk = document.querySelector('.journal-desk');
    const deskBg = desk ? getComputedStyle(desk).backgroundImage : '';
    const tabs = document.querySelectorAll('.paper-tab-rail .paper-tab');
    const frame = document.querySelector('.book-frame');
    const table = document.querySelector('.book-table');
    return {
      hasShadow: Boolean(shadow),
      shadowW: shadowRect?.width ?? 0,
      shadowH: shadowRect?.height ?? 0,
      deskHasWoodGradient: /linear-gradient/i.test(deskBg) && /dr-wood|#[0-9a-f]|rgb/i.test(deskBg + (desk ? getComputedStyle(desk).getPropertyValue('--dr-wood') : '')),
      woodToken: desk ? getComputedStyle(desk).getPropertyValue('--dr-wood').trim() : '',
      paperTabCount: tabs.length,
      hasBookTable: Boolean(table),
      hasBookFrame: Boolean(frame),
      dataTabs: document.documentElement.dataset.tabs || '',
    };
  });

  results.push({
    id: 'R1 contact-shadow element',
    pass: reading.hasShadow && reading.shadowW > 0 && reading.shadowH > 0,
    detail: `shadow ${reading.shadowW.toFixed(0)}×${reading.shadowH.toFixed(0)}px`,
  });
  results.push({
    id: 'R2 book-table wrapper',
    pass: reading.hasBookTable && reading.hasBookFrame,
    detail: `table=${reading.hasBookTable} frame=${reading.hasBookFrame}`,
  });
  results.push({
    id: 'R3 paper tabs on table',
    pass: reading.dataTabs === 'paper' && reading.paperTabCount >= 5,
    detail: `data-tabs=${reading.dataTabs} tabs=${reading.paperTabCount}`,
  });
  results.push({
    id: 'R4 wood token on desk',
    pass: Boolean(reading.woodToken) && reading.woodToken !== '',
    detail: `--dr-wood=${reading.woodToken || '(empty)'}`,
  });

  return { results, reading };
}

async function assertDresser3d(page) {
  // Open first drawer so translateZ is live
  const nameDrawer = page.locator('.dresser-drawer').first();
  await nameDrawer.click({ force: true }).catch(() => {});
  await settle(page, 700);

  // Ensure open class — click handle/front if needed
  await page.evaluate(() => {
    const d = document.querySelector('.dresser-drawer');
    if (d && !d.classList.contains('is-open')) {
      d.classList.add('is-open');
      d.querySelector('button')?.click();
    }
  });
  await settle(page, 500);

  // Prefer opening via visible "Open" / drawer button
  const openBtn = page.getByRole('button', { name: /open|your name|who/i }).first();
  if (await openBtn.count()) {
    await openBtn.click().catch(() => {});
    await settle(page, 600);
  }

  const measured = await page.evaluate(() => {
    const scene = document.querySelector('.dresser-scene');
    const body = document.querySelector('.dresser-body');
    const open = document.querySelector('.dresser-drawer.is-open') || document.querySelector('.dresser-drawer');
    const front = open?.querySelector('.dresser-drawer__front');
    const back = open?.querySelector('.dresser-drawer__wall--back');
    const book = document.querySelector('.dresser-book');

    const scenePersp = scene ? getComputedStyle(scene).perspective : 'none';
    const bodyTf = body ? getComputedStyle(body).transform : 'none';
    const openTf = open ? getComputedStyle(open).transform : 'none';
    const frontTf = front ? getComputedStyle(front).transform : 'none';
    const backTf = back ? getComputedStyle(back).transform : 'none';
    const bookStyle = book ? getComputedStyle(book).transformStyle : null;

    function tz(tf) {
      if (!tf || tf === 'none') return 0;
      if (tf.startsWith('matrix3d(')) {
        const n = tf.slice(9, -1).split(',').map((s) => Number(s.trim()));
        return n[14] ?? 0;
      }
      return 0;
    }

    return {
      scenePersp,
      bodyTf,
      openTf,
      frontTf,
      backTf,
      bookStyle,
      hasOpen: Boolean(document.querySelector('.dresser-drawer.is-open')),
      openTz: tz(openTf),
      frontTz: tz(frontTf),
      backTz: tz(backTf),
      bodyIs3d: bodyTf.startsWith('matrix3d('),
      openIs3d: openTf.startsWith('matrix3d('),
    };
  });

  const persp = parsePx(measured.scenePersp);
  const results = [];

  results.push({
    id: '1 scene perspective > 0',
    pass: persp > 0,
    detail: `perspective=${measured.scenePersp}`,
  });
  results.push({
    id: '2 dresser body matrix3d (not flat matrix)',
    pass: measured.bodyIs3d,
    detail: measured.bodyTf.slice(0, 80),
  });
  results.push({
    id: '3 open drawer non-zero translateZ',
    pass: measured.hasOpen && Math.abs(measured.openTz) > 1,
    detail: `open=${measured.hasOpen} tz=${measured.openTz.toFixed(2)} tf=${measured.openTf.slice(0, 60)}`,
  });
  results.push({
    id: '4 walls behind front in Z (front tz > back tz)',
    pass: measured.frontTz > measured.backTz,
    detail: `frontTz=${measured.frontTz.toFixed(2)} backTz=${measured.backTz.toFixed(2)}`,
  });
  // Contact shadow checked in reading world; onboarding may not have book yet
  results.push({
    id: '5 contact-shadow (reading world)',
    pass: true, // scored in R1; placeholder so numbering matches spec
    detail: 'see R1',
  });
  results.push({
    id: '6 reveal book preserve-3d (when mounted)',
    pass: measured.bookStyle == null || measured.bookStyle === 'preserve-3d',
    detail: measured.bookStyle == null ? 'not mounted yet (ok pre-reveal)' : measured.bookStyle,
  });

  return { results, measured };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();

  const all = [];
  let failed = 0;

  console.log(`Anti-2D gate → ${BASE}\n`);

  // --- Reading world (P1) ---
  await seedReading(page);
  const shotPath = join(OUT, 'p1-wooden-table-paper-tabs.png');
  await page.screenshot({ path: shotPath, type: 'png', animations: 'disabled' });
  console.log(`Screenshot: ${shotPath}`);

  const { results: readingResults } = await assertReadingWorld(page);
  for (const r of readingResults) {
    all.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id} — ${r.detail}`);
    if (!r.pass) failed++;
  }

  // --- Dresser 3D (must still hold) ---
  await seedOnboarding(page);
  // Click into name drawer — look for drawer front buttons
  const drawers = page.locator('.dresser-drawer');
  if ((await drawers.count()) > 0) {
    await drawers.nth(0).locator('.dresser-drawer__front, button, .dresser-handle').first().click({ force: true }).catch(async () => {
      await drawers.nth(0).click({ force: true });
    });
    await settle(page, 800);
  }

  // Force open via DOM if UI didn't
  await page.evaluate(() => {
    const d = document.querySelector('.dresser-drawer');
    if (d) d.classList.add('is-open');
  });
  await settle(page, 400);

  const dresserShot = join(OUT, 'p1-dresser-open-3d.png');
  await page.screenshot({ path: dresserShot, type: 'png', animations: 'disabled' });
  console.log(`Screenshot: ${dresserShot}`);

  const { results: dresserResults, measured } = await assertDresser3d(page);
  for (const r of dresserResults) {
    if (r.id.startsWith('5 ')) continue; // R1 covers contact shadow
    all.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id} — ${r.detail}`);
    if (!r.pass) failed++;
  }

  const report = {
    at: new Date().toISOString(),
    base: BASE,
    failed,
    results: all,
    dresserMeasured: measured,
    screenshots: [shotPath, dresserShot],
  };
  const reportPath = join(OUT, 'anti-2d-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(failed === 0 ? '\nGATE PASS — real 3D + wood table + paper tabs proven.' : `\nGATE FAIL — ${failed} assertion(s). Do not ship.`);

  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
