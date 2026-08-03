/**
 * Domain model for the cookbook. Kept intentionally rich so recipe pages can
 * render every editorial section (notes, tips, warnings, storage…) without
 * schema changes. All user-generated state (favorites, notes, history) lives
 * separately in IndexedDB keyed by `Recipe.id`.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Chapters in physical bookmark / page order. */
export type ChapterId =
  | 'pakistani'
  | 'chinese'
  | 'italian'
  | 'european'
  | 'world'
  | 'desserts'
  | 'coffee'
  | 'breakfast'
  | 'breads'
  | 'baking'
  | 'snacks'
  | 'vegetarian'
  | 'meals'
  | 'favorites'
  | 'tips';

export interface Chapter {
  id: ChapterId;
  /** Roman-numeral chapter no. is derived from array order; this is the name. */
  title: string;
  subtitle: string;
  /** Short editorial blurb shown on the chapter divider page. */
  blurb: string;
  /** A little line from Jia, printed under the divider art. */
  quote: string;
  /** Warm hue used for the laminated bookmark tab + divider accents. */
  tab: string;
  icon: string;
}

export interface Ingredient {
  /** Quantity in the recipe's base servings. `null` = "to taste". */
  quantity: number | null;
  unit: string;
  item: string;
  note?: string;
}

export interface IngredientGroup {
  heading?: string;
  items: Ingredient[];
}

export interface Step {
  instruction: string;
  /** Optional inline timer in seconds, surfaced as a tappable chip. */
  durationSec?: number;
  tip?: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface Recipe {
  id: string;
  chapter: ChapterId;
  title: string;
  /** One-line editorial description under the title. */
  tagline: string;
  /** Jia's personal story — why this recipe matters to her. Warm, first-person. */
  story?: string;
  /** "How it tastes" — a sensory sentence. */
  tasteLike?: string;
  /** "Texture" — mouthfeel in a few words. */
  texture?: string;
  cuisine: string;
  difficulty: Difficulty;
  /** 0 (none) – 5 (fiery). Rendered as chili pips. */
  spiceLevel?: number;
  /** Common allergens present, e.g. ['dairy','gluten','nuts']. */
  allergens?: string[];
  prepMin: number;
  cookMin: number;
  servings: number;
  nutrition: Nutrition;
  tags: string[];
  ingredients: IngredientGroup[];
  steps: Step[];
  chefNotes?: string[];
  tips?: string[];
  warnings?: string[];
  /** "Common mistakes" — what goes wrong, so cooks can avoid it. */
  commonMistakes?: string[];
  substitutions?: { from: string; to: string }[];
  equipment?: string[];
  storage?: string;
  reheating?: string;
  related?: string[];
  /** Optional accompaniment recipe ids (raita, chutney). Distinct from `related` (cook-next). */
  serveWith?: string[];
  /** Deterministic art seed → generated SVG hero (offline fallback if no photo). */
  heroSeed: number;
  /** True when macros were hand-checked; UI should hint "estimated" when false/absent. */
  macrosVerified?: boolean;
  dietTags?: (
    | 'vegetarian'
    | 'vegan'
    | 'high-protein'
    | 'low-cal'
    | 'gluten-free'
    | 'low-carb'
    | 'breakfast'
    | 'budget'
  )[];
  healthierSwaps?: {
    from: string;
    to: string;
    deltaKcal?: number;
    deltaProtein?: number;
    note?: string;
  }[];
  /** Estimated cost per serving in PKR. */
  estCostPerServing?: number;
  costTier?: 'budget' | 'mid' | 'splurge';
  pantryStaple?: boolean;
  servesCrowd?: boolean;
}
