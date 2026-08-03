import type { Recipe } from '@/lib/recipes/types';

/** Short editorial reason for pairing — never LLM. */
export type ServeWithNote = { recipe: Recipe; note: string };

const NOTES: Record<string, string> = {
  'mint-raita': 'Cool yogurt and mint cut through spice.',
  'cucumber-raita': 'Crisp cucumber cools a heavy plate.',
  'boondi-raita': 'Crunchy boondi with mild yogurt.',
  'green-chutney': 'Bright coriander-mint heat on the side.',
  'imli-chutney': 'Tangy-sweet with fried or grilled bites.',
  'kachumber-salad': 'Fresh onion-tomato crunch beside rich curries.',
  naan: 'Soft tear-and-scoop bread for gravy.',
  roti: 'Everyday whole-wheat flatbread.',
  paratha: 'Flaky layered bread for richer plates.',
};

const DEFAULT_BIRYANI = ['mint-raita', 'cucumber-raita', 'green-chutney', 'naan'] as const;
const DEFAULT_KEBAB = ['green-chutney', 'mint-raita', 'imli-chutney'] as const;
const DEFAULT_CURRY = ['mint-raita', 'kachumber-salad', 'naan', 'roti'] as const;
const DEFAULT_BREAD_WITH = ['naan', 'roti', 'paratha'] as const;

function isAccompaniment(r: Recipe): boolean {
  return r.tags.includes('accompaniment') || r.tags.includes('serve-with');
}

function isBread(r: Recipe): boolean {
  return r.chapter === 'breads' || r.tags.includes('bread') || r.tags.includes('flatbread');
}

function pushId(
  id: string | undefined,
  map: Map<string, Recipe>,
  seen: Set<string>,
  out: ServeWithNote[],
  limit: number,
) {
  if (!id || seen.has(id) || out.length >= limit) return;
  const recipe = map.get(id);
  if (!recipe) return;
  seen.add(id);
  out.push({ recipe, note: NOTES[id] ?? 'Goes well on the side.' });
}

/**
 * Optional sides + breads for a main. Explicit `serveWith` first, then tag rules.
 * Never auto-adds to shopping — UI only (opt-in buttons).
 */
export function serveWithFor(
  recipe: Recipe,
  pool: Recipe[],
  limit = 4,
): ServeWithNote[] {
  if (isAccompaniment(recipe) || isBread(recipe)) return [];
  const map = new Map(pool.map((r) => [r.id, r]));
  const out: ServeWithNote[] = [];
  const seen = new Set<string>([recipe.id]);

  for (const id of recipe.serveWith ?? []) {
    pushId(id, map, seen, out, limit);
    if (out.length >= limit) return out;
  }

  const tags = new Set(recipe.tags.map((t) => t.toLowerCase()));
  const title = recipe.title.toLowerCase();
  let rule: readonly string[] = [];
  if (tags.has('biryani') || title.includes('biryani')) rule = DEFAULT_BIRYANI;
  else if (tags.has('kebab') || title.includes('kebab') || title.includes('seekh'))
    rule = DEFAULT_KEBAB;
  else if (
    /karahi|qorma|handi|nihari|stew|curry|salan/.test(title) ||
    tags.has('curry') ||
    (recipe.chapter === 'pakistani' && recipe.spiceLevel && recipe.spiceLevel >= 2)
  )
    rule = DEFAULT_CURRY;
  else if (recipe.chapter === 'pakistani' && (tags.has('savory') || tags.has('festive')))
    rule = DEFAULT_BREAD_WITH;

  for (const id of rule) {
    pushId(id, map, seen, out, limit);
    if (out.length >= limit) return out;
  }

  return out;
}

/** Mains that pair with an accompaniment or bread (reverse of serveWithFor). */
export function goesWithFor(
  accompaniment: Recipe,
  pool: Recipe[],
  limit = 6,
): ServeWithNote[] {
  if (!isAccompaniment(accompaniment) && !isBread(accompaniment)) return [];
  const out: ServeWithNote[] = [];
  const seen = new Set<string>([accompaniment.id]);
  const note = `Nice with ${accompaniment.title}.`;

  for (const main of pool) {
    if (isAccompaniment(main) || isBread(main) || seen.has(main.id)) continue;
    const hits = serveWithFor(main, pool, 5).some((s) => s.recipe.id === accompaniment.id);
    if (!hits) continue;
    seen.add(main.id);
    out.push({ recipe: main, note });
    if (out.length >= limit) break;
  }
  return out;
}
