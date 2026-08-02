/**
 * Food chapters assignable during import/rebalance (excludes favorites & tips).
 */
import type { ChapterId } from './types';

export const CHAPTER_IDS = [
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
] as const satisfies readonly ChapterId[];

export type MappedChapterId = (typeof CHAPTER_IDS)[number];

const PAK_KEYWORDS =
  /\b(curry|biryani|masala|tikka|karahi|korma|qorma|nihari|dal|daal|chana|pakora|samosa|keema|seekh|tandoori|paneer|pulao|pilaf|saag|bhuna|jalfrezi|vindaloo|rogan|gosht|chaat|raita)\b/i;

const ASIAN_STIR =
  /\b(stir[\s-]?fry|chow mein|chow\s+mein|fried rice|noodle|wok|dim sum|dumpling|wonton|mapo|kung pao|sweet[\s-]?sour|szechuan|sichuan)\b/i;

const EUROPEAN_CUISINE =
  /^(british|french|spanish|polish|turkish|greek|dutch|netherlands|norwegian|norway|irish|portuguese)$/;

const WORLD_CUISINE =
  /^(american|united states|canadian|australian|jamaican|mexican|moroccan|egyptian|tunisian|algerian|international|unknown)$/;

const WORLD_PARTIAL = /argentin|venezuel/;

/** Resolve MealDB-style category from explicit field or themealdb tags tuple. */
function resolveCategory(category: string, tags?: string[]): string {
  const cat = category.trim().toLowerCase();
  if (cat) return cat;
  if (!tags?.length) return '';
  const i = tags.indexOf('themealdb');
  const tagCat = i >= 0 ? tags[i + 1] : undefined;
  if (tagCat) return tagCat.trim().toLowerCase();
  return '';
}

/**
 * Deterministic chapter assignment for imported dishes.
 * Rules are ordered — first match wins.
 */
export function mapImportedChapter(input: {
  category: string;
  cuisine: string;
  title: string;
  tags?: string[];
}): MappedChapterId {
  const category = resolveCategory(input.category, input.tags);
  const cuisine = (input.cuisine || '').trim().toLowerCase();
  const title = input.title || '';

  if (category === 'dessert') return 'desserts';
  if (category === 'breakfast') return 'breakfast';
  if (category === 'side' || category === 'starter') return 'snacks';
  if (category === 'pasta') return 'italian';
  if (category === 'vegetarian' || category === 'vegan') return 'vegetarian';
  if (cuisine === 'chinese' || ASIAN_STIR.test(title)) return 'chinese';
  if (cuisine === 'italian' || (category === 'seafood' && cuisine === 'italian')) return 'italian';
  if (cuisine === 'india' || cuisine === 'indian' || cuisine === 'pakistani' || PAK_KEYWORDS.test(title)) {
    return 'pakistani';
  }
  // SE/East Asia bucket — no dedicated tabs yet; fold into chinese for balance.
  if (/^(thai|vietnamese|japanese|malaysian|filipino)$/.test(cuisine)) return 'chinese';
  if (/bread|naan|roti|focaccia|baguette/i.test(title)) return 'breads';
  if (/cake|cookie|brownie|mousse|tart|pudding|pie/i.test(title) && category !== 'breakfast') {
    return 'desserts';
  }
  if (/coffee|chai|latte|espresso|tea\b/i.test(title)) return 'coffee';
  if (/bake|muffin|scone|biscuit/i.test(title)) return 'baking';
  if (EUROPEAN_CUISINE.test(cuisine)) return 'european';
  if (WORLD_CUISINE.test(cuisine) || WORLD_PARTIAL.test(cuisine)) return 'world';

  return 'meals';
}
