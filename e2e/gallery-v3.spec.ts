/**
 * CookCap gallery v3 — hub capture (CK-V3-5).
 * Run: npm run gallery:v3:hub
 */
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  GALLERY_VIEWPORTS,
  galleryClockInitScript,
  GALLERY_FREEZE_CSS,
  isGalleryCapture,
  shotEntry,
  shotRelativePath,
} from '../../capricorn-tooling/shared/gallery/capture-helpers.mjs';

const GALLERY_DIR = join(process.cwd(), 'docs', 'screenshots', 'gallery');
const MANIFEST = join(GALLERY_DIR, 'gallery-manifest.json');
const BASE = (process.env.GALLERY_BASE_URL || 'https://shamikhahmed.github.io/CookCap').replace(/\/$/, '');
const APP_VER = JSON.parse(readFileSync(join(process.cwd(), 'VERSION.json'), 'utf8')).version as string;
const ACCENT = '#8b4513';
const RECIPE = 'butter-chicken';

const SCREENS = [
  {
    kind: 'cover' as const,
    group: 'Book',
    screen: 'Cover',
    state: 'demo',
    caption: 'Leather cover — Ayesha Cooks demo edition.',
  },
  {
    kind: 'contents' as const,
    group: 'Book',
    screen: 'Contents',
    state: 'demo',
    caption: 'The Chapters — full TOC and occasions.',
  },
  {
    kind: 'recipe' as const,
    group: 'Book',
    screen: 'Recipe',
    state: 'demo',
    caption: 'Primary recipe leaf (Butter Chicken).',
  },
];

const DEVICES = ['iphone', 'ipad', 'mac'] as const;
const THEMES = ['light', 'dark'] as const;

type Shot = ReturnType<typeof shotEntry>;

function url(path: string) {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function dismissChrome(page: Page) {
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Got it' }).click({ timeout: 2500 }).catch(() => undefined);
    await page.getByRole('button', { name: 'Dismiss' }).click({ timeout: 2500 }).catch(() => undefined);
    await page.keyboard.press('Escape').catch(() => undefined);
  }
}

async function applyTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(
    ({ theme, ver }) => {
      localStorage.setItem('cookcap-onboarded', '1');
      localStorage.setItem('cookcap-theme', theme);
      localStorage.setItem('cookcap-whats-new', ver);
      document.documentElement.setAttribute('data-theme', theme);
    },
    { theme, ver: APP_VER },
  );
  await page.emulateMedia({ colorScheme: theme });
}

async function waitBookReady(page: Page) {
  await page
    .waitForFunction(() => (window as unknown as { __APP_READY__?: boolean }).__APP_READY__ === true, null, {
      timeout: 60_000,
    })
    .catch(() => undefined);
  await page
    .waitForFunction(
      () => /\d+\s*\/\s*\d+/.test(document.querySelector('footer')?.innerText || ''),
      null,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
}

async function bootDemo(page: Page, theme: 'light' | 'dark') {
  await page.goto(url('/?demo=1'), { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await dismissChrome(page);
  await applyTheme(page, theme);
  await waitBookReady(page);
}

async function jumpToPos(page: Page, pos: number) {
  await page.evaluate((p) => localStorage.setItem('cookcap-pos', String(p)), pos);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
  await dismissChrome(page);
  await waitBookReady(page);
  await page.waitForTimeout(600);
}

async function openSurface(
  page: Page,
  kind: (typeof SCREENS)[number]['kind'],
  theme: 'light' | 'dark',
  booted: { done: boolean },
) {
  if (kind === 'cover') {
    if (!booted.done) {
      await bootDemo(page, theme);
      booted.done = true;
    } else {
      await applyTheme(page, theme);
    }
    await jumpToPos(page, 0);
    await expect(page.locator('footer')).toContainText(/\//, { timeout: 25_000 });
    return;
  }
  if (kind === 'contents') {
    if (!booted.done) {
      await bootDemo(page, theme);
      booted.done = true;
    } else {
      await applyTheme(page, theme);
    }
    await jumpToPos(page, 3);
    return;
  }
  if (kind === 'recipe') {
    await page.goto(url(`/?demo=1&recipe=${RECIPE}`), { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await dismissChrome(page);
    await applyTheme(page, theme);
    booted.done = false;
    await waitBookReady(page);
    await page.waitForTimeout(500);
  }
}

async function settleForShot(page: Page, theme: 'light' | 'dark') {
  await applyTheme(page, theme);
  await page.addStyleTag({ content: GALLERY_FREEZE_CSS }).catch(() => undefined);
  await page.waitForTimeout(300);
}

function pngToWebp(pngPath: string, webpPath: string) {
  mkdirSync(dirname(webpPath), { recursive: true });
  const cwebp = spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath], { encoding: 'utf8' });
  if (cwebp.status === 0 && existsSync(webpPath)) {
    try {
      unlinkSync(pngPath);
    } catch {
      /* keep png */
    }
    return;
  }
  spawnSync('cp', [pngPath, webpPath]);
}

function writeManifest(shots: Shot[]) {
  mkdirSync(GALLERY_DIR, { recursive: true });
  let existing: { shots?: Shot[] } = { shots: [] };
  try {
    existing = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    /* first */
  }
  const byKey = new Map<string, Shot>();
  const legacyShots =
    (existing as { legacyShots?: Shot[] }).legacyShots ||
    (existing as { shots?: Shot[] }).shots?.filter((s) => s && s.viewport && !s.device) ||
    [];
  for (const s of (existing as { shots?: Shot[] }).shots || []) {
    if (s?.theme && s?.device && s?.file) {
      byKey.set(`${s.theme}/${s.device}/${s.file}`, s);
    }
  }
  for (const s of shots) {
    byKey.set(`${s.theme}/${s.device}/${s.file}`, s);
  }
  const merged = [...byKey.values()].sort((a, b) => String(a.file).localeCompare(String(b.file)));
  writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        app: 'CookCap',
        version: APP_VER,
        capturedAt: new Date().toISOString(),
        accent: ACCENT,
        schema: 2,
        note: 'v3 hub capture — Cover/Contents/Recipe × light/dark × iphone/ipad/mac (CK-V3-5). Legacy docs/gallery PNG index retained under legacyShots.',
        legacyGalleryRoot: 'docs/gallery',
        v3: {
          themesRequired: ['light', 'dark'],
          devicesRequired: ['iphone', 'ipad', 'mac'],
          darkShots: merged.filter((s) => s.theme === 'dark').length,
        },
        shots: merged,
        legacyShots,
      },
      null,
      2,
    ),
  );
}

for (const device of DEVICES) {
  for (const theme of THEMES) {
    test.describe(`gallery v3 · ${theme} · ${device}`, () => {
      test.skip(!isGalleryCapture(), 'Run via npm run gallery:v3:hub (CAPTURE_GALLERY=1)');

      const vp = GALLERY_VIEWPORTS[device];
      test.use({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: device === 'iphone' || device === 'ipad',
        hasTouch: device === 'iphone' || device === 'ipad',
        colorScheme: theme,
      });

      test.beforeEach(async ({ context }) => {
        await context.addInitScript(galleryClockInitScript());
        await context.addInitScript(
          ({ theme, ver }) => {
            try {
              localStorage.setItem('cookcap-onboarded', '1');
              localStorage.setItem('cookcap-theme', theme);
              localStorage.setItem('cookcap-whats-new', ver);
            } catch {
              /* ignore */
            }
          },
          { theme, ver: APP_VER },
        );
      });

      test(`capture ${SCREENS.length} leaves`, async ({ page }) => {
        const shots: Shot[] = [];
        const booted = { done: false };

        for (const screen of SCREENS) {
          await openSurface(page, screen.kind, theme, booted);
          await settleForShot(page, theme);

          const rel = shotRelativePath({
            theme,
            device,
            group: screen.group,
            screen: screen.screen,
            state: screen.state,
            ext: 'webp',
          });
          const webpPath = join(GALLERY_DIR, rel);
          const pngPath = webpPath.replace(/\.webp$/, '.png');
          mkdirSync(dirname(pngPath), { recursive: true });
          await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' });
          pngToWebp(pngPath, webpPath);

          const box = page.viewportSize();
          shots.push(
            shotEntry({
              id: `${screen.group}--${screen.screen}--${screen.state}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
              group: screen.group,
              screen: screen.screen,
              state: screen.state,
              theme,
              device,
              file: rel,
              route: '/?demo=1',
              caption: screen.caption,
              w: (box?.width ?? vp.width) * vp.deviceScaleFactor,
              h: (box?.height ?? vp.height) * vp.deviceScaleFactor,
            }),
          );
        }

        writeManifest(shots);
      });
    });
  }
}
