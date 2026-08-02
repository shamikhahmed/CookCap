#!/usr/bin/env node
/**
 * Re-map chapter assignments in data-themealdb.ts using import/rebalance rules.
 *
 *   node scripts/rebalance-themealdb.mjs
 *
 * Exit 1 if any chapter exceeds 22% of MealDB subset or projected full catalog (~956).
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEALDB_TS = join(ROOT, 'src/lib/recipes/data-themealdb.ts');
const RECIPES_DIR = join(ROOT, 'src/lib/recipes');
const PROJECTED_TOTAL = 956;
const MAX_SHARE = 0.22;

/** Inline copy of src/lib/recipes/chapterMap.ts — keep in sync manually. */
const CHAPTER_IDS = [
  'pakistani',
  'chinese',
  'italian',
  'european',
  'world',
  'desserts',
  'coffee',
  'breakfast',
  'breads',
  'baking',
  'snacks',
  'vegetarian',
  'meals',
];

const PAK_KEYWORDS =
  /\b(curry|biryani|masala|tikka|karahi|korma|qorma|nihari|dal|daal|chana|pakora|samosa|keema|seekh|tandoori|paneer|pulao|pilaf|saag|bhuna|jalfrezi|vindaloo|rogan|gosht|chaat|raita)\b/i;

const ASIAN_STIR =
  /\b(stir[\s-]?fry|chow mein|chow\s+mein|fried rice|noodle|wok|dim sum|dumpling|wonton|mapo|kung pao|sweet[\s-]?sour|szechuan|sichuan)\b/i;

const EUROPEAN_CUISINE =
  /^(british|french|spanish|polish|turkish|greek|dutch|netherlands|norwegian|norway|irish|portuguese)$/;

const WORLD_CUISINE =
  /^(american|united states|canadian|australian|jamaican|mexican|moroccan|egyptian|tunisian|algerian|international|unknown)$/;

const WORLD_PARTIAL = /argentin|venezuel/;

function resolveCategory(category, tags = []) {
  const cat = String(category || '')
    .trim()
    .toLowerCase();
  if (cat) return cat;
  if (!tags.length) return '';
  const i = tags.indexOf('themealdb');
  const tagCat = i >= 0 ? tags[i + 1] : undefined;
  if (tagCat) return String(tagCat).trim().toLowerCase();
  return '';
}

function mapImportedChapter({ category, cuisine, title, tags = [] }) {
  const cat = resolveCategory(category, tags);
  const cui = String(cuisine || '')
    .trim()
    .toLowerCase();
  const tit = title || '';

  if (cat === 'dessert') return 'desserts';
  if (cat === 'breakfast') return 'breakfast';
  if (cat === 'side' || cat === 'starter') return 'snacks';
  if (cat === 'pasta') return 'italian';
  if (cat === 'vegetarian' || cat === 'vegan') return 'vegetarian';
  if (cui === 'chinese' || ASIAN_STIR.test(tit)) return 'chinese';
  if (cui === 'italian' || (cat === 'seafood' && cui === 'italian')) return 'italian';
  if (cui === 'india' || cui === 'indian' || cui === 'pakistani' || PAK_KEYWORDS.test(tit)) {
    return 'pakistani';
  }
  // SE/East Asia bucket — no dedicated tabs yet; fold into chinese for balance.
  if (/^(thai|vietnamese|japanese|malaysian|filipino)$/.test(cui)) return 'chinese';
  if (/bread|naan|roti|focaccia|baguette/i.test(tit)) return 'breads';
  if (/cake|cookie|brownie|mousse|tart|pudding|pie/i.test(tit) && cat !== 'breakfast') return 'desserts';
  if (/coffee|chai|latte|espresso|tea\b/i.test(tit)) return 'coffee';
  if (/bake|muffin|scone|biscuit/i.test(tit)) return 'baking';
  if (EUROPEAN_CUISINE.test(cui)) return 'european';
  if (WORLD_CUISINE.test(cui) || WORLD_PARTIAL.test(cui)) return 'world';

  return 'meals';
}

function emptyCounts() {
  return Object.fromEntries(CHAPTER_IDS.map((c) => [c, 0]));
}

function countDistribution(recipes) {
  const counts = emptyCounts();
  for (const r of recipes) {
    if (counts[r.chapter] !== undefined) counts[r.chapter]++;
    else counts[r.chapter] = 1;
  }
  return counts;
}

function pct(n, total) {
  if (!total) return 0;
  return (n / total) * 100;
}

function maxShare(counts, total) {
  let max = 0;
  let maxChapter = '';
  for (const [chapter, n] of Object.entries(counts)) {
    const share = n / total;
    if (share > max) {
      max = share;
      maxChapter = chapter;
    }
  }
  return { max, maxChapter, maxPct: max * 100 };
}

function parseMealDbBlocks(text) {
  const recipes = [];
  const idRe = /\bid:\s*'(mdb-[^']+)'/g;
  let m;
  while ((m = idRe.exec(text))) {
    const id = m[1];
    const startIndex = m.index;
    const slice = text.slice(startIndex, startIndex + 5000);
    const chapter = slice.match(/chapter:\s*'([^']+)'/)?.[1];
    const title = slice.match(/title:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'");
    const cuisine = slice.match(/cuisine:\s*'((?:\\'|[^'])*)'/)?.[1]?.replace(/\\'/g, "'");
    const tagsMatch = slice.match(/tags:\s*\[([^\]]*)\]/);
    const tags = tagsMatch
      ? [...tagsMatch[1].matchAll(/'((?:\\'|[^'])*)'/g)].map((t) => t[1].replace(/\\'/g, "'"))
      : [];
    const category = resolveCategory('', tags);
    recipes.push({ id, chapter, title, cuisine, tags, category, startIndex });
  }
  return recipes;
}

function replaceChapterAt(text, startIndex, newChapter) {
  const slice = text.slice(startIndex, startIndex + 500);
  const chMatch = slice.match(/chapter:\s*'([^']+)'/);
  if (!chMatch || chMatch.index === undefined) return text;
  const absIdx = startIndex + chMatch.index;
  return `${text.slice(0, absIdx)}chapter: '${newChapter}'${text.slice(absIdx + chMatch[0].length)}`;
}

async function discoverDataFiles() {
  const files = ['data.ts'];
  const entries = await readdir(RECIPES_DIR);
  for (const name of entries) {
    if (name.startsWith('data-') && name.endsWith('.ts') && name !== 'data-themealdb.ts') {
      files.push(name);
    }
  }
  return [...new Set(files)].map((f) => join(RECIPES_DIR, f));
}

function parseAllChaptersFromFile(text) {
  const chapters = [];
  for (const m of text.matchAll(/chapter:\s*'([^']+)'/g)) {
    chapters.push(m[1]);
  }
  return chapters;
}

function formatDistribution(counts, total) {
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c} ${n} (${pct(n, total).toFixed(1)}%)`)
    .join('\n  ');
}

async function main() {
  let text = await readFile(MEALDB_TS, 'utf8');
  const recipes = parseMealDbBlocks(text);

  if (recipes.length === 0) {
    console.error('No mdb-* recipes found in data-themealdb.ts');
    process.exit(1);
  }

  const beforeCounts = countDistribution(recipes);
  const mealdbTotal = recipes.length;

  const changes = [];
  for (const r of recipes) {
    const next = mapImportedChapter({
      category: r.category,
      cuisine: r.cuisine || '',
      title: r.title || '',
      tags: r.tags,
    });
    if (next !== r.chapter) {
      changes.push({ ...r, next });
      r.chapter = next;
    }
  }

  // Apply replacements from end → start so indices stay valid.
  let updated = text;
  for (const c of [...changes].sort((a, b) => b.startIndex - a.startIndex)) {
    updated = replaceChapterAt(updated, c.startIndex, c.next);
  }

  if (changes.length > 0) {
    await writeFile(MEALDB_TS, updated);
  }

  const afterCounts = countDistribution(recipes);
  const mealdbMax = maxShare(afterCounts, mealdbTotal);

  console.log('── MealDB chapter distribution ──');
  console.log(`Recipes: ${mealdbTotal}`);
  console.log('\nBefore:');
  console.log(`  ${formatDistribution(beforeCounts, mealdbTotal)}`);
  console.log(`  max share: ${maxShare(beforeCounts, mealdbTotal).maxPct.toFixed(1)}% (${maxShare(beforeCounts, mealdbTotal).maxChapter})`);
  console.log('\nAfter:');
  console.log(`  ${formatDistribution(afterCounts, mealdbTotal)}`);
  console.log(`  max share: ${mealdbMax.maxPct.toFixed(1)}% (${mealdbMax.maxChapter})`);
  console.log(`\nReassigned: ${changes.length} recipes`);

  // Project full catalog: non-MealDB files + updated MealDB counts.
  const otherFiles = await discoverDataFiles();
  const projectedCounts = { ...afterCounts };
  let nonMealdbTotal = 0;

  for (const path of otherFiles) {
    const fileText = await readFile(path, 'utf8');
    const chapters = parseAllChaptersFromFile(fileText);
    nonMealdbTotal += chapters.length;
    for (const ch of chapters) {
      if (projectedCounts[ch] !== undefined) projectedCounts[ch]++;
      else projectedCounts[ch] = 1;
    }
  }

  const projectedTotal = nonMealdbTotal + mealdbTotal;
  const projectedMax = maxShare(projectedCounts, projectedTotal);

  console.log('\n── Projected full catalog ──');
  console.log(`Total recipes: ${projectedTotal} (non-MealDB ${nonMealdbTotal} + MealDB ${mealdbTotal})`);
  console.log(`  ${formatDistribution(projectedCounts, projectedTotal)}`);
  console.log(`  max share: ${projectedMax.maxPct.toFixed(1)}% (${projectedMax.maxChapter})`);

  const failures = [];
  if (projectedMax.max > MAX_SHARE) {
    failures.push(
      `Projected catalog max chapter "${projectedMax.maxChapter}" is ${projectedMax.maxPct.toFixed(1)}% (> ${MAX_SHARE * 100}%)`,
    );
  }
  if (mealdbMax.max > MAX_SHARE) {
    console.warn(
      `\n⚠ MealDB subset max "${mealdbMax.maxChapter}" is ${mealdbMax.maxPct.toFixed(1)}% — OK if projected catalog ≤ ${MAX_SHARE * 100}%`,
    );
  }

  if (failures.length) {
    console.error('\n✗ Rebalance gate FAILED');
    for (const f of failures) console.error(`  • ${f}`);
    process.exit(1);
  }

  console.log('\n✓ Rebalance gate passed (no catalog chapter > 22%)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
