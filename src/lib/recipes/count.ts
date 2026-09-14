import { RECIPES } from './data';

/** Single source of truth for catalog size (P-COOK-1). */
export function getCatalogRecipeCount(): number {
  return RECIPES.length;
}

export const CATALOG_RECIPE_COUNT = RECIPES.length;
