#!/usr/bin/env node
/**
 * Capture axe-core results for finish-loop (C-32).
 * Serves `out/` in-process so Chromium can reach localhost in this environment.
 *
 *   npm run build && npm run axe
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'out');
const AXE_OUT = path.join(ROOT, 'qa', 'finish-loop', 'axe');
const ROUTES = [{ id: 'home-demo', path: '/?demo=1' }];
const THEMES = ['light', 'dark'];
const APP_VER = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'VERSION.json'), 'utf8')).version || '3.5.1';
  } catch {
    return '3.5.1';
  }
})();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(OUT_DIR, p);
    if (!file.startsWith(OUT_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function waitReady(page) {
  await page.waitForFunction(
    () => window.__APP_READY__ === true || document.documentElement.dataset.appReady === 'true',
    null,
    { timeout: 60000 },
  );
}

if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
  console.error('Missing out/index.html — run npm run build first');
  process.exit(1);
}

fs.mkdirSync(AXE_OUT, { recursive: true });
const { server, base } = await startStaticServer();
const browser = await chromium.launch();
const results = [];

try {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
      const context = await browser.newContext({ viewport: { width: 393, height: 852 } });
      const page = await context.newPage();
      await page.addInitScript(
        ({ t, ver }) => {
          try {
            localStorage.setItem('cookcap-owner', 'Ayesha');
            localStorage.setItem('cookcap-onboarded', '1');
            localStorage.setItem('cookcap-theme', t);
            localStorage.setItem('cookcap-whats-new', ver);
            localStorage.setItem('theme', t);
            document.documentElement.dataset.theme = t;
            document.documentElement.classList.toggle('dark', t === 'dark');
          } catch (_) {
            /* ignore */
          }
        },
        { t: theme, ver: APP_VER },
      );
      await page.goto(base + route.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitReady(page).catch(async () => {
        await page.waitForTimeout(4000);
      });
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.classList.toggle('dark', t === 'dark');
        try {
          localStorage.setItem('cookcap-theme', t);
        } catch (_) {
          /* ignore */
        }
      }, theme);
      await page.waitForTimeout(800);

      const axe = await new AxeBuilder({ page }).analyze();
      const outName = `${route.id}-${theme}.json`;
      fs.writeFileSync(
        path.join(AXE_OUT, outName),
        JSON.stringify(
          {
            url: page.url(),
            route: route.id,
            theme,
            timestamp: new Date().toISOString(),
            violations: axe.violations,
            passes: axe.passes?.length ?? 0,
            incomplete: axe.incomplete?.length ?? 0,
            inapplicable: axe.inapplicable?.length ?? 0,
          },
          null,
          2,
        ),
      );
      const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      results.push({
        file: outName,
        violations: axe.violations.length,
        serious: serious.length,
        ids: serious.map((v) => v.id),
      });
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify(results, null, 2));
process.exit(results.some((r) => r.serious > 0) ? 1 : 0);
