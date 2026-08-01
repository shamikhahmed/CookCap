import generated from './images.generated.json';

/**
 * Access layer for the build-time image pipeline (see scripts/fetch-images.mjs).
 * A recipe either has a real, optimized local photo (with a blur placeholder)
 * or falls back to procedural art. Swapping in licensed photography later means
 * only replacing files in /public/recipes and regenerating the JSON — no code
 * changes here or at call sites.
 */
export interface RecipeImageMeta {
  src: string;
  smSrc: string;
  blurDataURL: string;
  credit: string;
}

const MAP = generated as Record<
  string,
  { blurDataURL: string; credit: string; matched: string; w: number; h: number }
>;

export function getImage(recipeId: string): RecipeImageMeta | null {
  const entry = MAP[recipeId];
  if (!entry) return null;
  return {
    src: `/recipes/${recipeId}.webp`,
    smSrc: `/recipes/${recipeId}@sm.webp`,
    blurDataURL: entry.blurDataURL,
    credit: entry.credit,
  };
}

export function hasPhoto(recipeId: string): boolean {
  return recipeId in MAP;
}
