import type { Nutrition } from '@/lib/recipes/types';
import type { Profile, Targets } from './types';

export const NUTRITION_DISCLAIMER = 'Estimates only — not medical advice.';

export function bmrMifflin(args: {
  sex?: 'f' | 'm' | 'na';
  age: number;
  heightCm: number;
  weightKg: number;
}): number {
  const base = 10 * args.weightKg + 6.25 * args.heightCm - 5 * args.age;
  if (args.sex === 'm') return base + 5;
  if (args.sex === 'f') return base - 161;
  return base - 78;
}

export function calcTargets(profile: Profile): Targets {
  if (profile.targetsManual) return { ...profile.targets };

  const { sex, age, heightCm, weightKg, activity = 1.375, goal } = profile;
  const hasBiometrics =
    age != null && heightCm != null && weightKg != null && age > 0 && heightCm > 0 && weightKg > 0;

  let kcal: number;
  if (hasBiometrics) {
    const bmr = bmrMifflin({ sex, age: age!, heightCm: heightCm!, weightKg: weightKg! });
    kcal = Math.round(bmr * activity);
  } else {
    kcal = 2000;
  }

  if (goal === 'cut') {
    kcal = Math.round(kcal * 0.85);
    const floor = sex === 'm' ? 1500 : 1200;
    kcal = Math.max(kcal, floor);
  } else if (goal === 'bulk') {
    kcal = Math.round(kcal * 1.1);
  }

  const protein =
    weightKg != null && weightKg > 0 ? Math.round(weightKg * 1.8) : 120;

  const proteinKcal = protein * 4;
  const remaining = Math.max(kcal - proteinKcal, 0);
  const fat = Math.round((remaining * 0.35) / 9);
  const carbs = Math.round((remaining - fat * 9) / 4);

  return {
    kcal,
    protein,
    carbs: Math.max(carbs, 0),
    fat: Math.max(fat, 0),
  };
}

export function scaleMacros(
  nutrition: Pick<Nutrition, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar'>,
  servings: number,
  baseServings: number,
): Nutrition {
  const factor = baseServings > 0 ? servings / baseServings : 1;
  const scale = (n: number) => Math.round(n * factor * 10) / 10;
  return {
    calories: Math.round(nutrition.calories * factor),
    protein: scale(nutrition.protein),
    carbs: scale(nutrition.carbs),
    fat: scale(nutrition.fat),
    fiber: scale(nutrition.fiber),
    sugar: scale(nutrition.sugar),
  };
}

export interface GenericSwap {
  from: string;
  to: string;
  deltaKcal: number;
  deltaProtein: number;
}

export const GENERIC_SWAPS: GenericSwap[] = [
  { from: 'butter', to: 'greek yogurt', deltaKcal: -50, deltaProtein: 4 },
  { from: 'cream', to: 'evaporated milk', deltaKcal: -40, deltaProtein: 2 },
  { from: 'sugar', to: 'less sugar', deltaKcal: -30, deltaProtein: 0 },
  { from: 'white rice', to: 'brown rice', deltaKcal: -10, deltaProtein: 1 },
  { from: 'deep fry', to: 'air fry', deltaKcal: -80, deltaProtein: 0 },
  { from: 'full-fat dairy', to: 'low-fat dairy', deltaKcal: -35, deltaProtein: 1 },
  { from: 'oil', to: 'less oil', deltaKcal: -45, deltaProtein: 0 },
  { from: 'portion', to: 'smaller portion', deltaKcal: -60, deltaProtein: -2 },
];

type MacroSlice = Pick<Nutrition, 'calories' | 'protein' | 'carbs' | 'fat'>;

function applyDeltas(nutrition: MacroSlice, deltaKcal: number, deltaProtein: number): MacroSlice {
  return {
    calories: Math.max(0, Math.round(nutrition.calories + deltaKcal)),
    protein: Math.max(0, Math.round((nutrition.protein + deltaProtein) * 10) / 10),
    carbs: nutrition.carbs,
    fat: nutrition.fat,
  };
}

export function applySwaps(
  nutrition: MacroSlice,
  swapCount: number,
  swaps: GenericSwap[] = GENERIC_SWAPS,
): MacroSlice {
  if (swapCount <= 0 || swaps.length === 0) return { ...nutrition };
  const avgKcal = swaps.reduce((s, w) => s + w.deltaKcal, 0) / swaps.length;
  const avgProtein = swaps.reduce((s, w) => s + w.deltaProtein, 0) / swaps.length;
  return applyDeltas(nutrition, avgKcal * swapCount, avgProtein * swapCount);
}

export function applyHealthier(nutrition: MacroSlice): MacroSlice {
  const deltaKcal = GENERIC_SWAPS.reduce((s, w) => s + w.deltaKcal, 0);
  const deltaProtein = GENERIC_SWAPS.reduce((s, w) => s + w.deltaProtein, 0);
  return applyDeltas(nutrition, deltaKcal, deltaProtein);
}
