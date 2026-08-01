import type { Ingredient } from './types';

/** Scale a quantity by the servings factor; `null` ("to taste") is preserved. */
export function scaleIngredient(ing: Ingredient, factor: number): number | null {
  if (ing.quantity == null) return null;
  return ing.quantity * factor;
}

/**
 * Render a scaled quantity the way a cook reads it: whole numbers stay whole,
 * common fractions collapse to ¼/⅓/½/⅔/¾, otherwise one decimal. `null`
 * becomes an em dash so the row still aligns.
 */
const VULGAR: Record<string, string> = {
  '0.25': '¼',
  '0.33': '⅓',
  '0.5': '½',
  '0.66': '⅔',
  '0.67': '⅔',
  '0.75': '¾',
};

export function formatQty(value: number | null): string {
  if (value == null) return '—';
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = Math.round((rounded - whole) * 100) / 100;
  const fracKey = frac.toFixed(2).replace(/0$/, '');

  const vulgar = VULGAR[frac.toString()] ?? VULGAR[fracKey];
  if (vulgar) return whole > 0 ? `${whole}${vulgar}` : vulgar;
  if (frac === 0) return String(whole);
  // Fall back to a tidy decimal, trimming trailing zeros.
  return rounded.toFixed(1).replace(/\.0$/, '');
}
