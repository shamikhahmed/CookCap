import generated from './images.generated.json';
import { withBase } from '@/lib/base-path';

/**
 * Access layer for the build-time image pipeline (see scripts/fetch-images.mjs).
 * Paths are basePath-aware for GitHub Pages (`/CookCap/...`).
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
    src: withBase(`/recipes/${recipeId}.webp`),
    smSrc: withBase(`/recipes/${recipeId}@sm.webp`),
    blurDataURL: entry.blurDataURL,
    credit: entry.credit,
  };
}

export function hasPhoto(recipeId: string): boolean {
  return recipeId in MAP;
}
