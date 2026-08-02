#!/usr/bin/env node
/**
 * Stratified photo honesty audit for TheMealDB imports (mdb-*).
 *
 *   node scripts/audit-photo-honesty.mjs
 *
 * Exit 0 when no confirmed title≠matched mismatches (missing hero → art is OK).
 * Exit 1 only on confirmed wrong-dish mismatches.
 */
import { readFile, access, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEALDB_TS = join(ROOT, 'src/lib/recipes/data-themealdb.ts');
const HERO_DIR = join(ROOT, 'public/recipes');
const MANIFEST_PATH = join(ROOT, 'src/lib/recipes/images.generated.json');
const REPORT_PATH = join(ROOT, 'docs/photo-honesty-pass.json');

const MIN_PER_CHAPTER = 3;
const MIN_TOTAL = 40;
const MISMATCH_RATIO = 0.3;

function normalizeTitle(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function normalizedDistance(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 1;
  const dist = levenshtein(na, nb);
  return dist / Math.max(na.length, nb.length);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function parseMealDbRecipes(text) {
  const recipes = [];
  const idRe = /\bid:\s*'(mdb-[^']+)'/g;
  let m;
  while ((m = idRe.exec(text))) {
    const id = m[1];
    const slice = text.slice(m.index, m.index + 2500);
    const chapter = slice.match(/chapter:\s*'([^']+)'/)?.[1] || 'unknown';
    const title = slice.match(/title:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'") || id;
    recipes.push({ id, chapter, title });
  }
  return recipes;
}

function stratifiedSample(recipes) {
  const byChapter = new Map();
  for (const r of recipes) {
    if (!byChapter.has(r.chapter)) byChapter.set(r.chapter, []);
    byChapter.get(r.chapter).push(r);
  }

  const picked = new Map();
  for (const [chapter, list] of byChapter.entries()) {
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    const take = Math.min(list.length, MIN_PER_CHAPTER);
    for (let i = 0; i < take; i++) picked.set(shuffled[i].id, shuffled[i]);
  }

  if (picked.size < MIN_TOTAL) {
    const remaining = recipes.filter((r) => !picked.has(r.id)).sort(() => Math.random() - 0.5);
    for (const r of remaining) {
      if (picked.size >= MIN_TOTAL) break;
      picked.set(r.id, r);
    }
  }

  return [...picked.values()].sort(
    (a, b) => a.chapter.localeCompare(b.chapter) || a.title.localeCompare(b.title),
  );
}

async function auditRecipe(recipe, manifest) {
  const heroPath = join(HERO_DIR, `${recipe.id}.webp`);
  const hasHero = await exists(heroPath);
  const entry = manifest[recipe.id];

  if (!hasHero) {
    return {
      id: recipe.id,
      title: recipe.title,
      chapter: recipe.chapter,
      status: 'missing→art',
      detail: 'No public/recipes/<id>.webp — heroSeed art fallback is OK',
    };
  }

  if (!entry) {
    return {
      id: recipe.id,
      title: recipe.title,
      chapter: recipe.chapter,
      status: 'missing→art',
      detail: 'Hero file exists but no images.generated.json entry — treat as art path',
    };
  }

  if (entry.credit !== 'TheMealDB') {
    return {
      id: recipe.id,
      title: recipe.title,
      chapter: recipe.chapter,
      status: 'warn',
      detail: `Manifest credit is "${entry.credit ?? 'unknown'}", expected TheMealDB`,
    };
  }

  const matched = entry.matched || '';
  const ratio = normalizedDistance(recipe.title, matched);

  if (ratio > MISMATCH_RATIO) {
    return {
      id: recipe.id,
      title: recipe.title,
      chapter: recipe.chapter,
      status: 'fail',
      detail: `Title≠matched mismatch (distance ${ratio.toFixed(3)}): "${matched}"`,
    };
  }

  return {
    id: recipe.id,
    title: recipe.title,
    chapter: recipe.chapter,
    status: 'pass',
    detail: matched ? `matched "${matched}"` : 'TheMealDB manifest entry OK',
  };
}

async function main() {
  const text = await readFile(MEALDB_TS, 'utf8');
  const all = parseMealDbRecipes(text);

  if (all.length === 0) {
    console.error('No mdb-* recipes found');
    process.exit(1);
  }

  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch {
    console.warn('images.generated.json missing or invalid — manifest checks limited');
  }

  const sample = stratifiedSample(all);
  const items = [];

  for (const recipe of sample) {
    items.push(await auditRecipe(recipe, manifest));
  }

  const pass = items.filter((i) => i.status === 'pass').length;
  const fail = items.filter((i) => i.status === 'fail').length;

  const report = {
    at: new Date().toISOString(),
    sampleSize: items.length,
    poolSize: all.length,
    pass,
    fail,
    items,
  };

  await mkdir(dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Photo honesty audit: ${items.length} sampled from ${all.length} mdb-* recipes`);
  console.log(`  pass=${pass} fail=${fail} (missing→art/warn=${items.length - pass - fail})`);
  console.log(`  report → ${REPORT_PATH.replace(ROOT + '/', '')}`);

  if (fail > 0) {
    console.error('\n✗ Confirmed title≠matched mismatches:');
    for (const i of items.filter((x) => x.status === 'fail')) {
      console.error(`  • ${i.id} — ${i.detail}`);
    }
    process.exit(1);
  }

  console.log('\n✓ No confirmed wrong-dish mismatches');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
