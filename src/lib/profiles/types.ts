export type Goal = 'maintain' | 'cut' | 'bulk' | 'none';

export type ModeId =
  | 'reader'
  | 'plate'
  | 'mother'
  | 'budget'
  | 'quick'
  | 'beginner'
  | 'dawat'
  | 'ramadan'
  | 'toddler'
  | 'diabetic'
  | 'heart'
  | 'fiber'
  | 'couple';

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  sex?: 'f' | 'm' | 'na';
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activity?: 1.2 | 1.375 | 1.55 | 1.725;
  goal: Goal;
  vegetarian?: boolean;
  vegan?: boolean;
  avoid: string[];
  spiceMax?: number;
  targets: Targets;
  targetsManual?: boolean;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DiaryEntry {
  id: string;
  date: string;
  profileId: string;
  recipeId: string;
  servings: number;
  meal: MealSlot;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  healthier?: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  qty?: string;
  expires?: string;
  updatedAt: number;
}

export interface HouseholdState {
  profiles: Profile[];
  activeProfileId: string | null;
  cookingForIds: string[];
  mode: ModeId;
  weeklyBudgetPkr: number;
  currency: 'PKR' | 'USD' | 'GBP';
}

const PROFILE_COLORS = [
  '#5a8a6a',
  '#d98a4e',
  '#c7913f',
  '#b58a5c',
  '#c96b8f',
  '#a3552a',
  '#6b8cae',
  '#8a6b9e',
];

export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

export function defaultTargets(): Targets {
  return { kcal: 2000, protein: 120, carbs: 200, fat: 65 };
}

export function makeProfile(
  partial: Partial<Profile> & Pick<Profile, 'name'>,
): Profile {
  const id = partial.id ?? newId('p');
  const colorIdx =
    Math.abs(
      [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
    ) % PROFILE_COLORS.length;
  return {
    id,
    name: partial.name,
    color: partial.color ?? PROFILE_COLORS[colorIdx]!,
    avatar: partial.avatar ?? 'mr-pots',
    sex: partial.sex,
    age: partial.age,
    heightCm: partial.heightCm,
    weightKg: partial.weightKg,
    activity: partial.activity ?? 1.375,
    goal: partial.goal ?? 'maintain',
    vegetarian: partial.vegetarian,
    vegan: partial.vegan,
    avoid: partial.avoid ?? [],
    spiceMax: partial.spiceMax,
    targets: partial.targets ?? defaultTargets(),
    targetsManual: partial.targetsManual,
  };
}
