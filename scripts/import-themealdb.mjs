#!/usr/bin/env node
/**
 * Import real dishes from TheMealDB into data-themealdb.ts + hero images.
 *
 *   node scripts/import-themealdb.mjs
 *   node scripts/import-themealdb.mjs --dry --limit 10
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_TS = join(ROOT, 'src/lib/recipes/data-themealdb.ts');
const OUT_IMAGES_DIR = join(ROOT, 'public/recipes');
const MANIFEST_PATH = join(ROOT, 'src/lib/recipes/images.generated.json');

const API = 'https://www.themealdb.com/api/json/v1/1';
const SOURCE_FILES = [
  'src/lib/recipes/data.ts',
  'src/lib/recipes/data-extra.ts',
  'src/lib/recipes/data-fill.ts',
  'src/lib/recipes/data-foodfusion.ts',
  'src/lib/recipes/data-goal.ts',
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

/** Inline copy of src/lib/recipes/chapterMap.ts — keep in sync manually. */
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

function mapChapter(meal) {
  const category = (meal.strCategory || '').trim().toLowerCase();
  const area = (meal.strArea || '').trim().toLowerCase();
  const title = meal.strMeal || '';
  return mapImportedChapter({ category, cuisine: area, title });
}

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fuzzyMatchTitle(title, existingNorms) {
  const n = normalizeTitle(title);
  if (!n) return false;
  if (existingNorms.has(n)) return true;
  // Fast substring only — skip Levenshtein (too slow for bulk import)
  for (const e of existingNorms) {
    if (!e || e.length < 6 || n.length < 6) continue;
    if (n.includes(e) || e.includes(n)) return true;
  }
  return false;
}

function hashSeed(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 9000) + 1000;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function loadExistingTitles() {
  const norms = new Set();
  for (const rel of SOURCE_FILES) {
    let text;
    try {
      text = await readFile(join(ROOT, rel), 'utf8');
    } catch {
      continue;
    }
    for (const m of text.matchAll(/title:\s*'((?:\\'|[^'])*)'/g)) {
      norms.add(normalizeTitle(m[1].replace(/\\'/g, "'")));
    }
  }
  return norms;
}

function parseQuantity(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^to taste$/i.test(s)) return null;
  let total = 0;
  let matched = false;
  for (const part of s.split(/\s+/)) {
    if (part.includes('/')) {
      const [a, b] = part.split('/').map(Number);
      if (b) {
        total += a / b;
        matched = true;
      }
    } else {
      const n = Number(part);
      if (!Number.isNaN(n)) {
        total += n;
        matched = true;
      }
    }
  }
  return matched ? Math.round(total * 100) / 100 : null;
}

function parseIngredient(measure, item) {
  const ing = (item || '').trim();
  if (!ing) return null;
  const m = (measure || '').trim();
  if (!m) return [null, '', ing];
  const match = m.match(/^([\d./\s-]+)\s*(.*)$/);
  if (match && parseQuantity(match[1]) !== null) {
    return [parseQuantity(match[1]), match[2].trim(), ing];
  }
  return [null, m, ing];
}

function parseIngredients(meal) {
  const rows = [];
  for (let i = 1; i <= 20; i++) {
    const item = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    const row = parseIngredient(measure, item);
    if (row) rows.push(row);
  }
  return rows;
}

function parseSteps(instructions) {
  return String(instructions || '')
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*\d+[\.)]\s*/, '').trim())
    .filter((s) => s.length > 3);
}

function estimateDifficulty(steps, ingCount) {
  const score = steps.length + ingCount * 0.4;
  if (score <= 8) return 'easy';
  if (score <= 14) return 'medium';
  return 'hard';
}

function estimateSpice(title, area) {
  const t = `${title} ${area}`.toLowerCase();
  if (/\b(fiery|hot|chili|chilli|jalfrezi|vindaloo|sichuan|szechuan|mapo)\b/.test(t)) return 4;
  if (/\b(curry|masala|tikka|karahi|korma|thai|cajun|pepper)\b/.test(t)) return 3;
  if (/\b(mild|sweet|vanilla|dessert|cake)\b/.test(t)) return 0;
  return 1;
}

function estimateNutrition(ingCount, category) {
  const base = category === 'dessert' ? 380 : 320;
  const cal = base + ingCount * 22;
  return {
    cal,
    protein: Math.max(4, Math.round(ingCount * 2.2)),
    carbs: Math.max(8, Math.round(ingCount * 3.8)),
    fat: Math.max(4, Math.round(ingCount * 1.8)),
  };
}

function detectAllergens(ingredients) {
  const hay = ingredients.map((r) => r[2].toLowerCase()).join(' ');
  const out = [];
  if (/\b(milk|cream|cheese|butter|yogurt|yoghurt|mascarpone|mozzarella|parmesan|egg)\b/.test(hay))
    out.push('dairy');
  if (/\b(egg|eggs)\b/.test(hay)) out.push('egg');
  if (/\b(flour|bread|pasta|spaghetti|noodle|breadcrumbs|pastry|tortilla)\b/.test(hay)) out.push('gluten');
  if (/\b(almond|walnut|peanut|cashew|pecan|hazelnut|nut)\b/.test(hay)) out.push('nuts');
  if (/\b(fish|salmon|tuna|cod|prawn|shrimp|seafood|anchov)\b/.test(hay)) out.push('fish');
  if (/\b(soy|tofu|soya)\b/.test(hay)) out.push('soy');
  return [...new Set(out)];
}

function buildEditorial(meal, ingCount) {
  const title = meal.strMeal;
  const area = meal.strArea || 'International';
  const category = meal.strCategory || 'Main';
  return {
    tagline: `${area} ${category.toLowerCase()} — adapted from TheMealDB.`,
    story: `${title} from TheMealDB (${area}). Nutrition figures below are rough estimates from ingredient count — not lab-tested.`,
    tasteLike: `Classic ${area} ${category.toLowerCase()} flavours.`,
    texture: ingCount >= 10 ? 'Layered and satisfying.' : 'Straightforward home-cooking texture.',
  };
}

function fmtIng(ing) {
  return ing
    .map((row) => {
      const [q, u, item, note] = row;
      const qv = q === null || q === undefined ? 'null' : q;
      const uu = String(u).replace(/'/g, '');
      const it = String(item).replace(/'/g, '');
      if (note) return `[${qv}, '${esc(uu)}', '${esc(it)}', '${esc(note)}']`;
      return `[${qv}, '${esc(uu)}', '${esc(it)}']`;
    })
    .join(',\n        ');
}

function fmtSteps(steps) {
  return steps.map((s) => `'${esc(s)}'`).join(',\n      ');
}

function mealToMini(meal) {
  const id = `mdb-${meal.idMeal}`;
  const chapter = mapChapter(meal);
  if (chapter === 'tips' || chapter === 'favorites') return null;

  const ingredients = parseIngredients(meal);
  if (ingredients.length === 0) return null;

  const steps = parseSteps(meal.strInstructions);
  if (steps.length === 0) return null;

  const category = (meal.strCategory || '').toLowerCase();
  const nutrition = estimateNutrition(ingredients.length, category);
  const editorial = buildEditorial(meal, ingredients.length);
  const area = meal.strArea || 'International';

  return {
    id,
    chapter,
    title: meal.strMeal,
    tagline: editorial.tagline,
    story: editorial.story,
    tasteLike: editorial.tasteLike,
    texture: editorial.texture,
    cuisine: area,
    difficulty: estimateDifficulty(steps, ingredients.length),
    spice: estimateSpice(meal.strMeal, area),
    allergens: detectAllergens(ingredients),
    prep: Math.min(45, Math.max(10, Math.round(ingredients.length * 1.5))),
    cook: Math.min(120, Math.max(10, steps.length * 8)),
    servings: 4,
    ...nutrition,
    tags: ['themealdb', category, area.toLowerCase()].filter(Boolean),
    ing: ingredients,
    steps,
    tips: ['Source: TheMealDB — taste and adjust salt and spice to your pan.'],
    seed: hashSeed(id),
    thumb: meal.strMealThumb,
    idMeal: meal.idMeal,
  };
}

function renderTs(recipes) {
  let out = `import type { ChapterId, Difficulty, Recipe } from './types';

/** Real dishes imported from TheMealDB (scripts/import-themealdb.mjs). */

type Tup = [number | null, string, string, string?];
type St = string | [string, number];

interface Mini {
  id: string;
  chapter: ChapterId;
  title: string;
  tagline: string;
  story: string;
  tasteLike: string;
  texture: string;
  cuisine: string;
  difficulty: Difficulty;
  spice?: number;
  allergens?: string[];
  prep: number;
  cook: number;
  servings: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ing: Tup[];
  steps: St[];
  tips?: string[];
  related?: string[];
  seed: number;
}

function r(x: Mini): Recipe {
  return {
    id: x.id,
    chapter: x.chapter,
    title: x.title,
    tagline: x.tagline,
    story: x.story,
    tasteLike: x.tasteLike,
    texture: x.texture,
    cuisine: x.cuisine,
    difficulty: x.difficulty,
    spiceLevel: x.spice ?? 0,
    allergens: x.allergens ?? [],
    prepMin: x.prep,
    cookMin: x.cook,
    servings: x.servings,
    nutrition: {
      calories: x.cal,
      protein: x.protein,
      carbs: x.carbs,
      fat: x.fat,
      fiber: 2,
      sugar: 4,
    },
    tags: x.tags,
    macrosVerified: false,
    ingredients: [{ items: x.ing.map(([q, u, it, n]) => ({ quantity: q, unit: u, item: it, note: n })) }],
    steps: x.steps.map((s) => (Array.isArray(s) ? { instruction: s[0], durationSec: s[1] } : { instruction: s })),
    tips: x.tips,
    related: x.related,
    heroSeed: x.seed,
  };
}

export const MEALDB_RECIPES: Recipe[] = [
`;

  const byChapter = new Map();
  for (const x of recipes) {
    if (!byChapter.has(x.chapter)) byChapter.set(x.chapter, []);
    byChapter.get(x.chapter).push(x);
  }

  for (const [chapter, list] of [...byChapter.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    out += `\n  /* ── ${chapter} ── */\n`;
    for (const x of list) {
      out += `  r({
    id: '${esc(x.id)}',
    chapter: '${x.chapter}',
    title: '${esc(x.title)}',
    tagline: '${esc(x.tagline)}',
    story: '${esc(x.story)}',
    tasteLike: '${esc(x.tasteLike)}',
    texture: '${esc(x.texture)}',
    cuisine: '${esc(x.cuisine)}',
    difficulty: '${x.difficulty}',
    prep: ${x.prep},
    cook: ${x.cook},
    servings: ${x.servings},
    cal: ${x.cal},
    protein: ${x.protein},
    carbs: ${x.carbs},
    fat: ${x.fat},
    tags: [${x.tags.map((t) => `'${esc(t)}'`).join(', ')}],
    spice: ${x.spice},
    allergens: [${x.allergens.map((t) => `'${esc(t)}'`).join(', ')}],
    ing: [
        ${fmtIng(x.ing)}
    ],
    steps: [
      ${fmtSteps(x.steps)}
    ],
    tips: [${x.tips.map((t) => `'${esc(t)}'`).join(', ')}],
    seed: ${x.seed},
  }),\n`;
    }
  }

  out += `];\n`;
  return out;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(meal, manifest) {
  const id = `mdb-${meal.idMeal}`;
  const dest = join(OUT_IMAGES_DIR, `${id}.webp`);
  const destSm = join(OUT_IMAGES_DIR, `${id}@sm.webp`);
  const url = meal.strMealThumb;
  if (!url) return false;

  if (await exists(dest) && manifest[id]) return true;

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  await sharp(buf)
    .rotate()
    .resize(1600, 1600, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(dest);

  await sharp(buf)
    .rotate()
    .resize(800, 800, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toFile(destSm);

  const tiny = await sharp(buf)
    .rotate()
    .resize(20, 20, { fit: 'cover' })
    .webp({ quality: 40 })
    .toBuffer();

  manifest[id] = {
    blurDataURL: `data:image/webp;base64,${tiny.toString('base64')}`,
    credit: 'TheMealDB',
    matched: meal.strMeal,
    w: 1600,
    h: 1600,
  };
  return true;
}

async function collectMealIds() {
  const ids = new Set();

  // Categories alone cover the full MealDB catalog (~300). Areas only duplicate.
  const catData = await fetchJson(`${API}/list.php?c=list`);
  const categories = catData.meals || [];
  console.log(`Fetching ${categories.length} categories…`);
  for (const row of categories) {
    const cat = row.strCategory;
    await sleep(40);
    const filtered = await fetchJson(`${API}/filter.php?c=${encodeURIComponent(cat)}`);
    for (const m of filtered.meals || []) ids.add(m.idMeal);
  }

  return [...ids];
}

async function lookupMeal(idMeal) {
  const data = await fetchJson(`${API}/lookup.php?i=${idMeal}`);
  return data.meals?.[0] ?? null;
}

async function main() {
  console.log(`TheMealDB import${DRY ? ' (dry — no images)' : ''}${Number.isFinite(LIMIT) ? ` limit=${LIMIT}` : ''}`);

  const existingNorms = await loadExistingTitles();
  console.log(`Loaded ${existingNorms.size} existing title fingerprints`);

  const mealIds = await collectMealIds();
  console.log(`Discovered ${mealIds.length} unique meals`);

  let skippedDup = 0;
  let skippedInvalid = 0;
  const accepted = [];

  await mkdir(OUT_IMAGES_DIR, { recursive: true });
  let manifest = {};
  if (!DRY) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    } catch {
      /* fresh */
    }
  }

  let imagesOk = 0;
  let imagesFail = 0;
  const CONCURRENCY = 6;
  let cursor = 0;

  async function worker() {
    while (true) {
      if (accepted.length >= LIMIT) return;
      const i = cursor++;
      if (i >= mealIds.length) return;
      const idMeal = mealIds[i];

      if (i % 40 === 0) {
        console.log(`  …lookup ${i}/${mealIds.length} (added ${accepted.length}, skip-dup ${skippedDup})`);
      }

      let meal;
      try {
        meal = await lookupMeal(idMeal);
      } catch (err) {
        console.warn(`  lookup fail ${idMeal}: ${err.message}`);
        skippedInvalid++;
        continue;
      }
      if (!meal?.strMeal) {
        skippedInvalid++;
        continue;
      }

      if (fuzzyMatchTitle(meal.strMeal, existingNorms)) {
        skippedDup++;
        continue;
      }

      const mini = mealToMini(meal);
      if (!mini) {
        skippedInvalid++;
        continue;
      }

      if (accepted.length >= LIMIT) return;
      accepted.push(mini);
      existingNorms.add(normalizeTitle(meal.strMeal));

      if (!DRY) {
        try {
          const ok = await downloadImage(
            { idMeal: mini.idMeal, strMeal: mini.title, strMealThumb: mini.thumb },
            manifest,
          );
          if (ok) imagesOk++;
          else imagesFail++;
        } catch (e) {
          imagesFail++;
          console.warn(`✗ image ${mini.id}: ${e.message}`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Stable order by chapter then title
  accepted.sort((a, b) => a.chapter.localeCompare(b.chapter) || a.title.localeCompare(b.title));

  if (!DRY) {
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  }

  const ts = renderTs(accepted);
  await writeFile(OUT_TS, ts);

  console.log('\n── Summary ──');
  console.log(`Added:   ${accepted.length} recipes → ${OUT_TS}`);
  console.log(`Skipped: ${skippedDup} duplicate titles`);
  console.log(`Skipped: ${skippedInvalid} invalid / empty meals`);
  if (!DRY) console.log(`Images:  ${imagesOk} ok, ${imagesFail} failed`);
  else console.log('Images:  skipped (--dry)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
