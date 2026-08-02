import type { Recipe } from './types';
import { SWAPS } from './healthier-swaps';

/** Attach healthierSwaps (and preserve estCostPerServing) for catalog consumers. */
export function enrichRecipe(r: Recipe): Recipe {
  const swaps = SWAPS[r.id];
  if (!swaps && r.estCostPerServing != null) return r;
  return {
    ...r,
    healthierSwaps: swaps ?? r.healthierSwaps,
    estCostPerServing: r.estCostPerServing,
  };
}
