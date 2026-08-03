#!/usr/bin/env node
/**
 * Recipe data integrity gate.
 *
 *   node scripts/assert-recipe-linkage.mjs
 *   npm run gate:recipes
 *
 * Exit 0 = pass. Exit 1 = linkage / chapter / hero issues.
 */
import { readFile, access, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RECIPES_DIR = join(ROOT, 'src/lib/recipes');
const HERO_DIR = join(ROOT, 'public/recipes');

const VALID_CHAPTERS = new Set([
  'pakistani',
  'chinese',
  'italian',
  'desserts',
  'coffee',
  'breads',
  'baking',
  'snacks',
  'meals',
  'favorites',
  'tips',
]);

const CHAPTER_ORDER = [...VALID_CHAPTERS];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function discoverDataFiles() {
  const files = ['data.ts'];
  const entries = await readdir(RECIPES_DIR);
  for (const name of entries) {
    if (name.startsWith('data-') && name.endsWith('.ts')) files.push(name);
  }
  return [...new Set(files)].map((f) => join(RECIPES_DIR, f));
}

function parseRecipesFromFile(text, fileLabel) {
  const recipes = [];
  const idRe = /\bid:\s*'([^']+)'/g;
  let m;
  while ((m = idRe.exec(text))) {
    const id = m[1];
    if (id.includes(' ') || id.length < 2) continue;
    const slice = text.slice(m.index, m.index + 2500);
    const chapter = slice.match(/chapter:\s*'([^']+)'/)?.[1];
    const title = slice.match(/title:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'");
    const heroSeed = slice.match(/heroSeed:\s*(\d+)/)?.[1];
    const seed = slice.match(/\bseed:\s*(\d+)/)?.[1];
    const relatedBlock = slice.match(/related:\s*\[([^\]]*)\]/);
    const related = relatedBlock
      ? [...relatedBlock[1].matchAll(/'([^']+)'/g)].map((r) => r[1])
      : [];
    const serveBlock = slice.match(/serveWith:\s*\[([^\]]*)\]/);
    const serveWith = serveBlock
      ? [...serveBlock[1].matchAll(/'([^']+)'/g)].map((r) => r[1])
      : [];
    recipes.push({
      id,
      chapter,
      title,
      heroSeed: heroSeed ? Number(heroSeed) : seed ? Number(seed) : null,
      related,
      serveWith,
      file: fileLabel,
    });
  }
  return recipes;
}

function fail(errors) {
  console.error('\n✗ Recipe linkage gate FAILED\n');
  for (const e of errors) console.error(`  • ${e}`);
  console.error(`\n${errors.length} issue(s).\n`);
  process.exit(1);
}

async function main() {
  const files = await discoverDataFiles();
  const all = [];
  const errors = [];

  for (const path of files) {
    const text = await readFile(path, 'utf8');
    all.push(...parseRecipesFromFile(text, path.replace(ROOT + '/', '')));
  }

  const idMap = new Map();
  for (const r of all) {
    if (idMap.has(r.id)) {
      errors.push(`Duplicate id "${r.id}" in ${r.file} and ${idMap.get(r.id).file}`);
    } else {
      idMap.set(r.id, r);
    }
  }

  const idSet = new Set(all.map((r) => r.id));
  const chapterCounts = Object.fromEntries([...VALID_CHAPTERS].map((c) => [c, 0]));

  for (const r of all) {
    if (!r.chapter) {
      errors.push(`Recipe "${r.id}" (${r.file}) missing chapter`);
    } else if (!VALID_CHAPTERS.has(r.chapter)) {
      errors.push(`Recipe "${r.id}" (${r.file}) invalid chapter "${r.chapter}"`);
    } else {
      chapterCounts[r.chapter]++;
    }

    for (const rel of r.related) {
      if (!idSet.has(rel)) {
        errors.push(`Recipe "${r.id}" (${r.file}) related id missing: "${rel}"`);
      }
    }

    for (const sw of r.serveWith || []) {
      if (!idSet.has(sw)) {
        errors.push(`Recipe "${r.id}" (${r.file}) serveWith id missing: "${sw}"`);
      }
    }

    const heroPath = join(HERO_DIR, `${r.id}.webp`);
    const hasHero = await exists(heroPath);
    if (!hasHero && (r.heroSeed === null || r.heroSeed === undefined)) {
      errors.push(`Recipe "${r.id}" (${r.file}) has no hero file and no heroSeed`);
    }
  }

  for (const chapter of CHAPTER_ORDER) {
    if (chapterCounts[chapter] === 0) {
      errors.push(`Chapter "${chapter}" has 0 recipes`);
    }
  }

  const chaptersTs = await readFile(join(RECIPES_DIR, 'chapters.ts'), 'utf8');
  for (const chapter of CHAPTER_ORDER) {
    if (!chaptersTs.includes(`id: '${chapter}'`)) {
      errors.push(`Chapter "${chapter}" missing from chapters.ts`);
    }
  }

  if (errors.length) fail(errors);

  console.log('✓ Recipe linkage gate passed');
  console.log(`  ${all.length} recipes across ${files.length} data files`);
  console.log(
    '  chapters:',
    CHAPTER_ORDER.map((c) => `${c}=${chapterCounts[c]}`).join(', '),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
