#!/usr/bin/env node
/**
 * Perf probe at 956 recipes — longtask observer during search / chapter / flip.
 *
 *   NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
 *   node scripts/measure-perf-956.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');
const REPORT = join(ROOT, 'docs/perf-956.json');
const PORT = 3457;
const BASE = process.env.PERF_BASE || '/CookCap';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function startStatic() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let url = decodeURIComponent(req.url || '/');
      if (url.startsWith(BASE)) url = url.slice(BASE.length) || '/';
      if (url.endsWith('/')) url += 'index.html';
      const file = join(OUT, url.replace(/^\//, ''));
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        try {
          const body = await readFile(join(OUT, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(body);
        } catch {
          res.writeHead(404);
          res.end('missing');
        }
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  if (!(await exists(join(OUT, 'index.html')))) {
    console.error('out/ missing — run NEXT_PUBLIC_BASE_PATH=/CookCap npm run build first');
    process.exit(1);
  }

  const server = await startStatic();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.addInitScript(() => {
    window.__lt = [];
    window.__ltPhase = 'boot';
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__lt.push({
            name: e.name,
            duration: e.duration,
            start: e.startTime,
            phase: window.__ltPhase,
          });
        }
      });
      po.observe({ type: 'longtask', buffered: true });
    } catch {
      /* unsupported */
    }
    localStorage.setItem('cookcap-onboarded', '1');
    localStorage.setItem('jia-name', 'Cap');
  });

  const url = `http://127.0.0.1:${PORT}${BASE}/`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(3500);

  const enter = page
    .locator('button:has-text("Open"), button:has-text("Continue"), button:has-text("Enter")')
    .first();
  if (await enter.count()) {
    await enter.click().catch(() => {});
    await page.waitForTimeout(1000);
  }

  // Clear boot noise; measure interaction phases only.
  await page.evaluate(() => {
    window.__lt = [];
    window.__ltPhase = 'search';
  });

  await page.keyboard.press('Meta+k').catch(() => page.keyboard.press('Control+k'));
  await page.waitForTimeout(200);
  const input = page
    .locator('input[type="search"], input[placeholder*="earch"], [role="dialog"] input')
    .first();
  if (await input.count()) {
    await input.type('chicken', { delay: 40 });
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    window.__ltPhase = 'chapter';
  });
  const tab = page.locator('.paper-tab').nth(3);
  if (await tab.count()) {
    await tab.click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
  }

  await page.evaluate(() => {
    window.__ltPhase = 'flip';
  });
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => {
    const tasks = (window.__lt || []).filter((t) => t.phase !== 'boot');
    const byPhase = {};
    for (const t of tasks) {
      byPhase[t.phase] = byPhase[t.phase] || { count: 0, max: 0 };
      byPhase[t.phase].count++;
      byPhase[t.phase].max = Math.max(byPhase[t.phase].max, t.duration);
    }
    const over50 = tasks.filter((t) => t.duration > 50);
    return {
      longtaskCount: tasks.length,
      longtaskMaxMs: tasks.reduce((m, t) => Math.max(m, t.duration), 0),
      longtaskOver50: over50.length,
      byPhase,
      longtasks: over50.slice(0, 20),
      mountedLeaves: document.querySelectorAll('[data-leaf-scroll]').length,
    };
  });

  const report = {
    at: new Date().toISOString(),
    url,
    recipeCatalog: 956,
    warmLeafPoolOffsets: [-3, -2, -1, 1, 2, 3, 4],
    assetPreload: 'SW full catalog + decode window ±12',
    chapterListCap: 24,
    search: 'indexed haystack + 120ms debounce',
    ...result,
    pass: result.mountedLeaves <= 12,
    longtaskBudgetMs: 50,
    longtaskAdvisoryMaxMs: result.longtaskMaxMs,
    note:
      'Hard fail = mount storm (>12 data-leaf-scroll). Longtasks advisory: headless Motion curl often 50–170ms; real-device GPU target ≤50ms.',
  };

  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
  server.close();
  process.exit(report.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
