import type { ModeDef } from '@/lib/modes/types';
import { getMode } from '@/lib/modes/registry';
import type { ModeId, Profile } from '@/lib/profiles/types';
import type { Recipe } from '@/lib/recipes/types';

export interface ScoreResult {
  score: number;
  reasons: string[];
}

function ingredientCount(recipe: Recipe): number {
  return recipe.ingredients.reduce((n, g) => n + g.items.length, 0);
}

function proteinDensity(recipe: Recipe): number {
  const kcal = recipe.nutrition.calories || 1;
  return recipe.nutrition.protein / kcal;
}

function costSignal(recipe: Recipe): number | null {
  if (recipe.estCostPerServing != null) return recipe.estCostPerServing;
  if (recipe.costTier === 'budget') return 80;
  if (recipe.costTier === 'mid') return 180;
  if (recipe.costTier === 'splurge') return 350;
  return null;
}

function activeEaters(profiles: Profile[]): Profile[] {
  return profiles.length ? profiles : [];
}

export function scoreRecipe(
  recipe: Recipe,
  mode: ModeDef | ModeId,
  profiles: Profile[],
): ScoreResult {
  const def = typeof mode === 'string' ? getMode(mode) : mode;
  const reasons: string[] = [];
  let score = 0;

  if (def.id === 'reader' || !def.boost) {
    return { score: 0, reasons: [] };
  }

  const boost = def.boost;
  const minutes = recipe.prepMin + recipe.cookMin;
  const dens = proteinDensity(recipe);
  const tags = new Set(recipe.dietTags ?? []);
  const eaters = activeEaters(profiles);

  if (boost.highProtein) {
    const p = dens * 100;
    const add = Math.min(p, 8) * boost.highProtein;
    if (add > 0.5) {
      score += add;
      if (recipe.nutrition.protein >= 25) reasons.push(`+${Math.round(recipe.nutrition.protein)} g protein`);
    }
  }

  if (boost.lowCal) {
    const perServing = recipe.nutrition.calories;
    const add = Math.max(0, (500 - perServing) / 100) * boost.lowCal;
    if (add > 0.3) {
      score += add;
      if (perServing <= 350) reasons.push('lighter kcal');
    }
  }

  if (boost.highCal) {
    const add = Math.max(0, (recipe.nutrition.calories - 400) / 150) * boost.highCal;
    if (add > 0) score += add;
  }

  if (boost.quick) {
    const add = Math.max(0, (30 - minutes) / 10) * boost.quick;
    if (add > 0) {
      score += add;
      if (minutes <= 20) reasons.push(`${minutes} min`);
    }
  }

  if (boost.fewIngredients) {
    const n = ingredientCount(recipe);
    const add = Math.max(0, (12 - n) / 4) * boost.fewIngredients;
    if (add > 0) {
      score += add;
      if (n <= 8) reasons.push('few ingredients');
    }
  }

  if (boost.lowCost) {
    const cost = costSignal(recipe);
    if (cost != null) {
      const add = Math.max(0, (250 - cost) / 80) * boost.lowCost;
      if (add > 0) {
        score += add;
        if (cost <= 120) reasons.push('budget-friendly');
      }
    }
    if (recipe.pantryStaple) {
      score += 1.2 * (boost.lowCost ?? 1);
      reasons.push('pantry staple');
    }
    if (recipe.costTier === 'budget') score += 0.8 * (boost.lowCost ?? 1);
  }

  if (boost.lowSugar) {
    const sugar = recipe.nutrition.sugar;
    const add = Math.max(0, (15 - sugar) / 5) * boost.lowSugar;
    if (add > 0) {
      score += add;
      if (sugar <= 8) reasons.push('lower sugar');
    }
  }

  if (boost.highFiber) {
    const fiber = recipe.nutrition.fiber;
    const add = Math.min(fiber / 4, 3) * boost.highFiber;
    if (add > 0.4) {
      score += add;
      if (fiber >= 6) reasons.push(`+${Math.round(fiber)} g fiber`);
    }
  }

  if (boost.makeAhead && (tags.has('breakfast') || recipe.storage)) {
    score += boost.makeAhead;
    reasons.push('make-ahead friendly');
  }

  if (boost.batch && (recipe.servesCrowd || recipe.servings >= 6)) {
    score += boost.batch;
    reasons.push('scales for a crowd');
  }

  if (boost.softTexture && (recipe.spiceLevel == null || recipe.spiceLevel <= 1)) {
    score += boost.softTexture;
    reasons.push('gentle spice');
  }

  if (boost.hydrating && (tags.has('breakfast') || recipe.chapter === 'meals')) {
    score += boost.hydrating * 0.6;
  }

  if (boost.smallBatch && recipe.servings <= 3) {
    score += boost.smallBatch;
    reasons.push('small batch');
  }

  if (boost.lowSodium) {
    score += boost.lowSodium * 0.3;
  }

  if (def.maxMinutes != null && minutes > def.maxMinutes) {
    score -= (minutes - def.maxMinutes) / 5;
    reasons.push('over time budget');
  }

  if (def.maxCostPerServing != null) {
    const cost = costSignal(recipe);
    if (cost != null && cost > def.maxCostPerServing) {
      score -= (cost - def.maxCostPerServing) / 50;
    }
  }

  if (def.equipmentExclude?.length && recipe.equipment?.length) {
    const banned = def.equipmentExclude.map((e) => e.toLowerCase());
    const hit = recipe.equipment.some((e) => banned.some((b) => e.toLowerCase().includes(b)));
    if (hit) score -= 3;
  }

  for (const eater of eaters) {
    if (eater.avoid.length && recipe.allergens?.length) {
      const hits = recipe.allergens.filter((a) =>
        eater.avoid.some((av) => a.toLowerCase() === av.toLowerCase()),
      );
      if (hits.length) {
        score -= hits.length * 5;
        reasons.push(`contains ${hits.join(', ')}`);
      }
    }

    if (eater.vegan && !tags.has('vegan') && recipe.allergens?.some((a) =>
      ['dairy', 'egg', 'meat', 'fish', 'shellfish'].includes(a.toLowerCase()),
    )) {
      score -= 2;
    } else if (eater.vegetarian && recipe.allergens?.some((a) =>
      ['meat', 'fish', 'shellfish'].includes(a.toLowerCase()),
    )) {
      score -= 2;
    } else if (eater.vegetarian && tags.has('vegetarian')) {
      score += 0.8;
    } else if (eater.vegan && tags.has('vegan')) {
      score += 1;
    }

    if (eater.spiceMax != null && recipe.spiceLevel != null && recipe.spiceLevel > eater.spiceMax) {
      score -= (recipe.spiceLevel - eater.spiceMax) * 1.5;
      reasons.push('too spicy');
    }
  }

  if (tags.has('high-protein') && boost.highProtein) reasons.push('high-protein tag');
  if (tags.has('budget') && boost.lowCost) reasons.push('budget tag');

  return { score: Math.round(score * 100) / 100, reasons: [...new Set(reasons)].slice(0, 4) };
}

export function rankRecipes(
  recipes: Recipe[],
  mode: ModeDef | ModeId,
  profiles: Profile[],
  limit = 12,
): Recipe[] {
  const def = typeof mode === 'string' ? getMode(mode) : mode;
  if (def.id === 'reader') return recipes.slice(0, limit);

  return [...recipes]
    .map((r) => ({ r, s: scoreRecipe(r, def, profiles).score }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.r);
}
