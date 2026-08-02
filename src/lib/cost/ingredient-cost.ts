import type { Recipe } from '@/lib/recipes/types';

/** Rough retail PKR per unit — estimates for Pakistan grocery heuristics. */
export const INGREDIENT_COST_PKR: Record<string, { per: number; unit: 'g' | 'ml' | 'each' }> = {
  chicken: { per: 0.55, unit: 'g' },
  beef: { per: 0.9, unit: 'g' },
  mutton: { per: 1.4, unit: 'g' },
  fish: { per: 0.8, unit: 'g' },
  egg: { per: 40, unit: 'each' },
  eggs: { per: 40, unit: 'each' },
  milk: { per: 0.25, unit: 'ml' },
  yogurt: { per: 0.3, unit: 'g' },
  'greek yogurt': { per: 0.5, unit: 'g' },
  cream: { per: 0.6, unit: 'ml' },
  'evaporated milk': { per: 0.4, unit: 'ml' },
  butter: { per: 1.2, unit: 'g' },
  ghee: { per: 1.4, unit: 'g' },
  oil: { per: 0.45, unit: 'ml' },
  'olive oil': { per: 1.8, unit: 'ml' },
  flour: { per: 0.15, unit: 'g' },
  'atta': { per: 0.14, unit: 'g' },
  rice: { per: 0.28, unit: 'g' },
  'basmati rice': { per: 0.35, unit: 'g' },
  'brown rice': { per: 0.4, unit: 'g' },
  lentils: { per: 0.35, unit: 'g' },
  daal: { per: 0.35, unit: 'g' },
  dal: { per: 0.35, unit: 'g' },
  chickpeas: { per: 0.4, unit: 'g' },
  chana: { per: 0.4, unit: 'g' },
  paneer: { per: 0.9, unit: 'g' },
  cheese: { per: 1.1, unit: 'g' },
  onion: { per: 0.08, unit: 'g' },
  tomato: { per: 0.12, unit: 'g' },
  garlic: { per: 0.5, unit: 'g' },
  ginger: { per: 0.4, unit: 'g' },
  potato: { per: 0.08, unit: 'g' },
  potatoes: { per: 0.08, unit: 'g' },
  sugar: { per: 0.2, unit: 'g' },
  salt: { per: 0.05, unit: 'g' },
  spices: { per: 2.0, unit: 'g' },
  cumin: { per: 2.5, unit: 'g' },
  turmeric: { per: 1.5, unit: 'g' },
  chilli: { per: 2.0, unit: 'g' },
  chili: { per: 2.0, unit: 'g' },
  coriander: { per: 1.8, unit: 'g' },
  garam: { per: 3.0, unit: 'g' },
  bread: { per: 15, unit: 'each' },
  tortilla: { per: 20, unit: 'each' },
  pasta: { per: 0.35, unit: 'g' },
  noodles: { per: 0.4, unit: 'g' },
  coconut: { per: 0.5, unit: 'g' },
  'coconut milk': { per: 0.35, unit: 'ml' },
  lemon: { per: 20, unit: 'each' },
  lime: { per: 15, unit: 'each' },
  spinach: { per: 0.2, unit: 'g' },
  peas: { per: 0.3, unit: 'g' },
  carrot: { per: 0.1, unit: 'g' },
  capsicum: { per: 0.25, unit: 'g' },
  pepper: { per: 0.25, unit: 'g' },
};

const UNIT_TO_BASE: Record<string, { kind: 'g' | 'ml' | 'each'; mult: number }> = {
  g: { kind: 'g', mult: 1 },
  gram: { kind: 'g', mult: 1 },
  grams: { kind: 'g', mult: 1 },
  kg: { kind: 'g', mult: 1000 },
  ml: { kind: 'ml', mult: 1 },
  l: { kind: 'ml', mult: 1000 },
  litre: { kind: 'ml', mult: 1000 },
  liter: { kind: 'ml', mult: 1000 },
  tsp: { kind: 'ml', mult: 5 },
  tbsp: { kind: 'ml', mult: 15 },
  cup: { kind: 'ml', mult: 240 },
  cups: { kind: 'ml', mult: 240 },
  oz: { kind: 'g', mult: 28 },
  lb: { kind: 'g', mult: 454 },
  piece: { kind: 'each', mult: 1 },
  pieces: { kind: 'each', mult: 1 },
  pc: { kind: 'each', mult: 1 },
  whole: { kind: 'each', mult: 1 },
  clove: { kind: 'each', mult: 1 },
  cloves: { kind: 'each', mult: 1 },
  large: { kind: 'each', mult: 1 },
  medium: { kind: 'each', mult: 1 },
  small: { kind: 'each', mult: 1 },
};

function lookupPrice(item: string): { per: number; unit: 'g' | 'ml' | 'each' } | null {
  const lower = item.toLowerCase();
  if (INGREDIENT_COST_PKR[lower]) return INGREDIENT_COST_PKR[lower]!;
  const keys = Object.keys(INGREDIENT_COST_PKR).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) return INGREDIENT_COST_PKR[key]!;
  }
  return null;
}

function toBaseQty(quantity: number, unit: string): { amount: number; kind: 'g' | 'ml' | 'each' } | null {
  const u = unit.toLowerCase().trim();
  const mapped = UNIT_TO_BASE[u];
  if (mapped) return { amount: quantity * mapped.mult, kind: mapped.kind };
  if (!u || u === 'to taste') return null;
  return { amount: quantity, kind: 'g' };
}

export function estCostPkr(recipe: Recipe): number {
  if (recipe.estCostPerServing != null) {
    return Math.round(recipe.estCostPerServing * recipe.servings);
  }

  let total = 0;
  let matched = 0;
  for (const group of recipe.ingredients) {
    for (const ing of group.items) {
      const price = lookupPrice(ing.item);
      if (!price || ing.quantity == null) continue;
      const base = toBaseQty(ing.quantity, ing.unit);
      if (!base) continue;

      if (price.unit === 'each' || base.kind === 'each') {
        total += price.per * (base.kind === 'each' ? base.amount : Math.max(1, base.amount / 100));
      } else if (price.unit === base.kind) {
        total += price.per * base.amount;
      } else {
        total += price.per * base.amount;
      }
      matched++;
    }
  }

  if (matched === 0) {
    if (recipe.costTier === 'budget') return 120 * recipe.servings;
    if (recipe.costTier === 'splurge') return 400 * recipe.servings;
    return 200 * recipe.servings;
  }

  return Math.round(total);
}

export function formatCost(n: number, currency: 'PKR' | 'USD' | 'GBP' = 'PKR'): string {
  const rates: Record<'PKR' | 'USD' | 'GBP', number> = { PKR: 1, USD: 1 / 278, GBP: 1 / 350 };
  const converted = n * rates[currency];
  if (currency === 'PKR') return `Rs ${Math.round(converted)}`;
  return `${currency === 'USD' ? '$' : '£'}${converted.toFixed(2)}`;
}

export function costPerGramProtein(cost: number, protein: number): number | null {
  if (protein <= 0) return null;
  return Math.round((cost / protein) * 100) / 100;
}
