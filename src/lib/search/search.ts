import { RECIPES } from '@/lib/recipes/data';
import { CHAPTER_MAP } from '@/lib/recipes/chapters';
import type { Recipe } from '@/lib/recipes/types';

export interface SearchFilters {
  difficulty?: Recipe['difficulty'];
  maxTime?: number;
  maxCalories?: number;
  cuisine?: string;
  /** Exact user rating 1–5 (device-local IndexedDB stars). */
  stars?: 1 | 2 | 3 | 4 | 5;
}

/** Precomputed fields so each query skips string joins over 900+ recipes. */
type IndexedRecipe = {
  recipe: Recipe;
  title: string;
  haystack: string;
  ingredients: string;
};

let BUNDLED_INDEX: IndexedRecipe[] | null = null;
let EXTRA_INDEX: IndexedRecipe[] | null = null;
let EXTRA_POOL: Recipe[] | null = null;

function buildIndex(pool: Recipe[]): IndexedRecipe[] {
  return pool.map((recipe) => ({
    recipe,
    title: recipe.title.toLowerCase(),
    haystack: [recipe.title, recipe.cuisine, CHAPTER_MAP[recipe.chapter]?.title, ...recipe.tags]
      .join(' ')
      .toLowerCase(),
    ingredients: recipe.ingredients
      .flatMap((g) => g.items.map((i) => i.item))
      .join(' ')
      .toLowerCase(),
  }));
}

function getIndex(pool: Recipe[]): IndexedRecipe[] {
  if (pool === RECIPES) {
    if (!BUNDLED_INDEX) BUNDLED_INDEX = buildIndex(RECIPES);
    return BUNDLED_INDEX;
  }
  if (pool === EXTRA_POOL && EXTRA_INDEX) return EXTRA_INDEX;
  EXTRA_POOL = pool;
  EXTRA_INDEX = buildIndex(pool);
  return EXTRA_INDEX;
}

function scoreIndexed(entry: IndexedRecipe, q: string): number {
  const { title, haystack, ingredients } = entry;
  let s = 0;
  if (title === q) s += 100;
  if (title.startsWith(q)) s += 40;
  if (title.includes(q)) s += 30;
  if (haystack.includes(q)) s += 15;
  if (ingredients.includes(q)) s += 12;
  if (s === 0 && subseq(q, title)) s += 8;
  if (s === 0 && subseq(q, haystack)) s += 4;
  return s;
}

function subseq(q: string, text: string): boolean {
  let i = 0;
  for (let j = 0; j < text.length && i < q.length; j++) {
    if (text[j] === q[i]) i++;
  }
  return i === q.length;
}

export function searchRecipes(
  query: string,
  filters: SearchFilters = {},
  pool: Recipe[] = RECIPES,
  ratings: Record<string, number> = {},
): Recipe[] {
  const q = query.trim().toLowerCase();
  const index = getIndex(pool);

  const pass = (r: Recipe) =>
    (!filters.difficulty || r.difficulty === filters.difficulty) &&
    (!filters.maxTime || r.prepMin + r.cookMin <= filters.maxTime) &&
    (!filters.maxCalories || r.nutrition.calories <= filters.maxCalories) &&
    (!filters.cuisine || r.cuisine === filters.cuisine) &&
    (!filters.stars || ratings[r.id] === filters.stars);

  if (!q) {
    const hit = pool.filter(pass);
    if (filters.stars) {
      return hit.sort((a, b) => a.title.localeCompare(b.title));
    }
    return hit;
  }

  return index
    .map((entry) => ({ recipe: entry.recipe, s: scoreIndexed(entry, q) }))
    .filter(({ recipe, s }) => s > 0 && pass(recipe))
    .sort((a, b) => b.s - a.s)
    .map(({ recipe }) => recipe);
}

export const ALL_CUISINES = Array.from(new Set(RECIPES.map((r) => r.cuisine))).sort();
