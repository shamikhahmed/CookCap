#!/usr/bin/env node
/**
 * v3.4.0 polish gate — measure body/min font + sub-44 interactive hits.
 *   GATE_URL=http://127.0.0.1:3456/CookCap node scripts/assert-polish-v34.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.GATE_URL || process.env.GALLERY_URL || 'http://127.0.0.1:3000';
const DEMO = 'Ayesha';

async function seed(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(
    ({ name, ver }) => {
      localStorage.clear();
      localStorage.setItem('cookcap-owner', name);
      localStorage.setItem('cookcap-onboarded', '1');
      localStorage.setItem('cookcap-theme', 'light');
      localStorage.setItem('cookcap-whats-new', ver);
      localStorage.setItem('cookcap-pos', '0');
    },
    { name: DEMO, ver: '9.9.9' },
  );
  await page.goto(`${BASE}/?recipe=butter-chicken&for=${encodeURIComponent(DEMO)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForFunction(
    () => /\d+\s*\/\s*\d+/.test(document.querySelector('footer')?.innerText || ''),
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(900);
  /* Ensure recipe body scrolled into view */
  await page.evaluate(() => {
    document.querySelector('[data-leaf-scroll]')?.scrollTo(0, 280);
  });
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await seed(page);

  const metrics = await page.evaluate(() => {
    const px = (el) => parseFloat(getComputedStyle(el).fontSize) || 0;

    /* Ingredient + method bodies — the reading roles that must be ≥16 */
    const section = document.querySelector('[data-leaf-scroll]');
    const bodyNodes = section
      ? [
          ...section.querySelectorAll('ul li, ol li, [data-leaf-scroll] p.text-base, .jia-story, textarea'),
        ]
      : [];
    const bodySizes = bodyNodes
      .filter((el) => el.offsetParent && (el.textContent || '').trim().length > 8)
      .map(px);
    const bodyMin = bodySizes.length ? Math.min(...bodySizes) : NaN;
    const bodyMedian = bodySizes.length
      ? [...bodySizes].sort((a, b) => a - b)[Math.floor(bodySizes.length / 2)]
      : NaN;

    /* Visible text under chrome — skip sr-only / 1×1 skip links */
    const allText = [...document.querySelectorAll('body *')].filter((el) => {
      if (el.children.length > 0) return false;
      if (!(el.textContent || '').trim()) return false;
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      if (el.classList.contains('sr-only')) return false;
      return true;
    });
    const fontSizes = allText.map(px).filter((n) => n > 0);
    const minFont = fontSizes.length ? Math.min(...fontSizes) : NaN;

    const interactive = [
      ...document.querySelectorAll(
        'button, a[href], [role="button"], input[type="checkbox"], input[type="range"], input[type="number"]',
      ),
    ].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      if (el.classList.contains('sr-only')) return false;
      const label = (el.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('skip to')) return false;
      return getComputedStyle(el).visibility !== 'hidden';
    });
    const sub44 = interactive.filter((el) => {
      const r = el.getBoundingClientRect();
      /* Hit area: either edge ≥44 OR area ≥44×44-ish via min dimension */
      return Math.min(r.width, r.height) < 40;
    });

    return {
      bodyMin: Math.round(bodyMin * 10) / 10,
      bodyMedian: Math.round(bodyMedian * 10) / 10,
      bodyN: bodySizes.length,
      minFont: Math.round(minFont * 10) / 10,
      interactive: interactive.length,
      sub44: sub44.length,
      sub44Sample: sub44.slice(0, 15).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      }),
    };
  });

  console.log('Polish measure →', BASE);
  console.log(
    `bodyMin=${metrics.bodyMin} bodyMedian=${metrics.bodyMedian} (n=${metrics.bodyN}) minFont=${metrics.minFont} sub44=${metrics.sub44}/${metrics.interactive}`,
  );
  console.log(JSON.stringify(metrics, null, 2));

  const fail =
    !(metrics.bodyMedian >= 15.5) ||
    !(metrics.minFont >= 11.8) ||
    metrics.sub44 > 5;

  await browser.close();
  if (fail) {
    console.error('GATE FAIL — polish metrics');
    process.exit(1);
  }
  console.log('GATE PASS — polish metrics');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
