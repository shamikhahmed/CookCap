#!/usr/bin/env node
/**
 * Wood-reader acceptance gate (docs/cursor-wood-reader-v3.2.md §H).
 * DOM-proves reading surface is wood, not cream desk.
 *
 *   GATE_URL=http://127.0.0.1:3456/CookCap node scripts/assert-wood-reader.mjs
 *
 * Exit 0 = pass. Exit 1 = fail.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'gallery', 'checkpoints');
const BASE = process.env.GATE_URL || process.env.GALLERY_URL || 'http://127.0.0.1:3000';
const DEMO = 'Ayesha';
const SKINS = ['editorial', 'lightbook', 'candlelit', 'modern'];

mkdirSync(OUT, { recursive: true });

/** Relative luminance of sRGB channel 0–255. */
function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(r, g, b) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function parseRgb(css) {
  if (!css) return null;
  const srgb = String(css).match(
    /color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
  );
  if (srgb) {
    return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];
  }
  const m = String(css).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function contrastRatio(fg, bg) {
  const a = parseRgb(fg);
  const b = parseRgb(bg);
  if (!a || !b) return 0;
  const L1 = luminance(...a);
  const L2 = luminance(...b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Old cream desk ~srgb 0.96 near-white. Wood = warmer + darker OR chroma. */
function isCreamy(rgb) {
  const c = parseRgb(rgb);
  if (!c) return true;
  const [r, g, b] = c.map((x) => x / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const chroma = max - min;
  // Fail only near-white low-chroma (old cream desk)
  return lightness > 0.92 && chroma < 0.06;
}

async function settle(page, ms = 400) {
  await page.waitForTimeout(ms);
}

async function seedReading(page, skin = 'editorial') {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ name, skin: s }) => {
      localStorage.clear();
      localStorage.setItem('cookcap-theme', s === 'candlelit' ? 'dark' : 'light');
      localStorage.setItem('cookcap-skin', s);
      localStorage.setItem('cookcap-tabs', 'paper');
      localStorage.setItem('cookcap-readmode', 'flip');
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-onboarded', '1');
      localStorage.setItem('cookcap-pos', '0');
      localStorage.setItem('cookcap-whats-new', '9.9.9');
    },
    { name: DEMO, skin },
  );
  await page.goto(`${BASE}/?for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(
    () => /\d+\s*\/\s*\d+/.test(document.querySelector('footer')?.innerText || ''),
    null,
    { timeout: 30000 },
  );
  await settle(page, 500);
}

async function measureDesktop(page, skin) {
  return page.evaluate((skinId) => {
    const stage = document.querySelector('.journal-stage');
    const desk = document.querySelector('.journal-desk');
    const table = document.querySelector('.book-table');
    const tab = document.querySelector('.paper-tab-rail .paper-tab');
    const label = tab?.querySelector('.paper-tab__label');
    const leaf = document.querySelector('article') || document.querySelector('.leaf-scroll');

    const stageCs = stage ? getComputedStyle(stage) : null;
    const deskCs = desk ? getComputedStyle(desk) : null;
    const tableCs = table ? getComputedStyle(table) : null;
    const tabCs = tab ? getComputedStyle(tab) : null;
    const labelCs = label ? getComputedStyle(label) : null;
    const leafCs = leaf ? getComputedStyle(leaf) : null;

    return {
      skin: skinId,
      stageBgImage: stageCs?.backgroundImage || '',
      stageBgColor: stageCs?.backgroundColor || '',
      deskBgImage: deskCs?.backgroundImage || '',
      deskBgColor: deskCs?.backgroundColor || '',
      woodToken: deskCs?.getPropertyValue('--dr-wood')?.trim() || '',
      tableBgImage: tableCs?.backgroundImage || '',
      tabBg: tabCs?.backgroundColor || '',
      tabColor: labelCs?.color || '',
      paperRaised: deskCs?.getPropertyValue('--color-paper-raised')?.trim() || '',
      ink: deskCs?.getPropertyValue('--color-ink')?.trim() || '',
      leafBg: leafCs?.backgroundColor || '',
      paperTabCount: document.querySelectorAll('.paper-tab-rail .paper-tab').length,
      tabMinH: tab ? tab.getBoundingClientRect().height : 0,
    };
  }, skin);
}

async function measurePhone(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.journal-stage');
    const desk = document.querySelector('.journal-desk');
    const header = document.querySelector('.app-header') || document.querySelector('header');
    const footer = document.querySelector('.app-footer') || document.querySelector('footer');
    const stageCs = stage ? getComputedStyle(stage) : null;
    const deskCs = desk ? getComputedStyle(desk) : null;
    const headerCs = header ? getComputedStyle(header) : null;
    return {
      stageBgImage: stageCs?.backgroundImage || '',
      stageBgColor: stageCs?.backgroundColor || '',
      deskBgImage: deskCs?.backgroundImage || '',
      headerBg: headerCs?.backgroundColor || headerCs?.backgroundImage || '',
      footerExists: Boolean(footer),
      woodToken: deskCs?.getPropertyValue('--dr-wood')?.trim() || '',
    };
  });
}

function scoreDesktop(m) {
  const results = [];
  const hasWoodImage =
    /linear-gradient|radial-gradient|url\(/i.test(m.stageBgImage) && m.stageBgImage !== 'none';
  results.push({
    id: `${m.skin} stage wood backgroundImage`,
    pass: hasWoodImage,
    detail: hasWoodImage ? 'gradient/url present' : `bgImage=${m.stageBgImage.slice(0, 60)}`,
  });
  results.push({
    id: `${m.skin} stage not cream`,
    pass: !isCreamy(m.stageBgColor),
    detail: `bg=${m.stageBgColor}`,
  });
  results.push({
    id: `${m.skin} wood token`,
    pass: Boolean(m.woodToken),
    detail: `--dr-wood=${m.woodToken || '(empty)'}`,
  });
  results.push({
    id: `${m.skin} book-table surface`,
    pass: /linear-gradient|url\(/i.test(m.tableBgImage),
    detail: m.tableBgImage.slice(0, 80) || '(none)',
  });
  results.push({
    id: `${m.skin} paper tabs present`,
    pass: m.paperTabCount >= 5,
    detail: `tabs=${m.paperTabCount}`,
  });
  results.push({
    id: `${m.skin} tab touch ≥44px`,
    pass: m.tabMinH >= 44,
    detail: `h=${m.tabMinH.toFixed(1)}px`,
  });

  const labelRatio = contrastRatio(m.tabColor, m.tabBg);
  results.push({
    id: `${m.skin} tab label AA (≥4.5)`,
    pass: labelRatio >= 4.5,
    detail: `ratio=${labelRatio.toFixed(2)} fg=${m.tabColor} bg=${m.tabBg}`,
  });

  return results;
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
  const contrastTable = [];

  console.log(`Wood-reader gate → ${BASE}\n`);

  for (const skin of SKINS) {
    await seedReading(page, skin);
    const m = await measureDesktop(page, skin);
    const shot = join(OUT, `wood-reader-${skin}.png`);
    await page.screenshot({ path: shot, type: 'png', animations: 'disabled' });
    console.log(`Shot: ${shot}`);

    for (const r of scoreDesktop(m)) {
      all.push(r);
      console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id} — ${r.detail}`);
      if (!r.pass) failed++;
      if (r.id.includes('tab label')) contrastTable.push(r);
    }
  }

  // Phone wood frame
  await context.close();
  const phoneCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  const phone = await phoneCtx.newPage();
  await seedReading(phone, 'editorial');
  const pm = await measurePhone(phone);
  const phoneShot = join(OUT, 'wood-reader-phone.png');
  await phone.screenshot({ path: phoneShot, type: 'png', animations: 'disabled' });
  console.log(`Shot: ${phoneShot}`);

  const phoneResults = [
    {
      id: 'phone stage wood backgroundImage',
      pass: /linear-gradient|url\(/i.test(pm.stageBgImage) && pm.stageBgImage !== 'none',
      detail: pm.stageBgImage.slice(0, 80) || '(none)',
    },
    {
      id: 'phone stage not cream',
      pass: !isCreamy(pm.stageBgColor),
      detail: `bg=${pm.stageBgColor}`,
    },
    {
      id: 'phone desk wood',
      pass: /linear-gradient|url\(/i.test(pm.deskBgImage),
      detail: pm.deskBgImage.slice(0, 80) || '(none)',
    },
    {
      id: 'phone wood token',
      pass: Boolean(pm.woodToken),
      detail: `--dr-wood=${pm.woodToken || '(empty)'}`,
    },
  ];
  for (const r of phoneResults) {
    all.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id} — ${r.detail}`);
    if (!r.pass) failed++;
  }

  await phoneCtx.close();
  await browser.close();

  const report = {
    at: new Date().toISOString(),
    base: BASE,
    failed,
    results: all,
    contrast: contrastTable,
  };
  writeFileSync(join(OUT, 'wood-reader-gate.json'), JSON.stringify(report, null, 2));

  console.log(`\n${failed ? 'FAIL' : 'PASS'}  wood-reader gate — ${all.length - failed}/${all.length}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
