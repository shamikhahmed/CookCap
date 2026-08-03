/**
 * Live product smoke — prove chrome + IA menu order + offline shell.
 * Requires static out served (same as gate:anti-2d).
 *
 *   GATE_URL=http://127.0.0.1:3456/CookCap node scripts/smoke-product.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'gallery', 'checkpoints');
const BASE = process.env.GATE_URL || 'http://127.0.0.1:3456/CookCap';
const DEMO = 'Ayesha';

mkdirSync(OUT, { recursive: true });

const results = [];
function check(id, pass, detail) {
  results.push({ id, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id} — ${detail}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();

  // Seed reading world
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((name) => {
    localStorage.clear();
    localStorage.setItem('cookcap-theme', 'light');
    localStorage.setItem('cookcap-skin', 'editorial');
    localStorage.setItem('cookcap-tabs', 'paper');
    localStorage.setItem('cookcap-readmode', 'flip');
    localStorage.setItem('cookcap-owner', name);
    localStorage.setItem('cookcap-onboarded', '1');
    localStorage.setItem('cookcap-pos', '0');
  }, DEMO);
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => /\d+\s*\/\s*\d+/.test(document.querySelector('footer')?.innerText || ''),
    null,
    { timeout: 30000 },
  );

  const footer = await page.locator('footer').innerText();
  check('S1 footer page chrome', /\d+\s*\/\s*\d+/.test(footer), footer.replace(/\s+/g, ' ').trim());

  const hasBook = await page.locator('.book-frame').count();
  check('S2 book-frame', hasBook > 0, `count=${hasBook}`);

  const searchBox = await page.getByRole('button', { name: 'Search recipes' }).boundingBox();
  check(
    'S3 header search ≥44px',
    searchBox && searchBox.height >= 44 && searchBox.width >= 44,
    searchBox ? `${searchBox.width.toFixed(0)}×${searchBox.height.toFixed(0)}` : 'missing',
  );

  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.waitForTimeout(200);
  const menu = page.getByRole('menu', { name: 'More actions' });
  await menu.waitFor({ state: 'visible', timeout: 5000 });
  const labels = await menu.getByRole('menuitem').allTextContents();
  const joined = labels.map((t) => t.trim()).filter(Boolean);
  const shopIdx = joined.findIndex((t) => /Shopping list/i.test(t));
  const renameIdx = joined.findIndex((t) => /Change book name/i.test(t));
  const aboutIdx = joined.findIndex((t) => /About/i.test(t));
  check(
    'S4 IA: shopping before rename',
    shopIdx >= 0 && renameIdx > shopIdx,
    `shop@${shopIdx} rename@${renameIdx} → ${joined.join(' | ')}`,
  );
  check(
    'S5 IA: about last',
    aboutIdx === joined.length - 1 && aboutIdx >= 0,
    `about@${aboutIdx} of ${joined.length} → ${joined.join(' | ')}`,
  );

  // Phone viewport hit targets
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const phoneBtn = await page.getByRole('button', { name: 'Search recipes' }).boundingBox();
  check(
    'S6 phone search ≥44px',
    phoneBtn && phoneBtn.height >= 44 && phoneBtn.width >= 44,
    phoneBtn ? `${phoneBtn.width.toFixed(0)}×${phoneBtn.height.toFixed(0)}` : 'missing',
  );

  // Viewport matrix — book frame survives narrow → ultrawide
  for (const [label, w, h] of [
    ['S6a 320', 320, 568],
    ['S6b 768', 768, 1024],
    ['S6c 1920', 1920, 1080],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(200);
    const frame = await page.locator('.book-frame').count();
    const search = await page.getByRole('button', { name: 'Search recipes' }).boundingBox();
    check(
      `${label} book + search`,
      frame > 0 && search && search.height >= 40,
      `frame=${frame} search=${search ? `${search.width.toFixed(0)}×${search.height.toFixed(0)}` : 'missing'}`,
    );
  }
  await page.setViewportSize({ width: 1280, height: 800 });

  // No third-party network after load (collect briefly)
  const external = [];
  page.on('request', (req) => {
    const u = req.url();
    if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) {
      external.push(u);
    }
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const bad = external.filter(
    (u) => !u.includes('127.0.0.1') && !u.includes('localhost') && !u.startsWith(BASE),
  );
  check('S7 no third-party runtime fetch', bad.length === 0, bad.slice(0, 5).join(', ') || 'none');

  await page.screenshot({
    path: join(OUT, 'smoke-product-desktop.png'),
    type: 'png',
    animations: 'disabled',
  });

  const failed = results.filter((r) => !r.pass).length;
  const report = { at: new Date().toISOString(), base: BASE, failed, results };
  writeFileSync(join(OUT, 'smoke-product-report.json'), JSON.stringify(report, null, 2));
  console.log(failed === 0 ? '\nSMOKE PASS' : `\nSMOKE FAIL — ${failed}`);
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
