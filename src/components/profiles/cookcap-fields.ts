/**
 * Shared CookCap helpers for profile / mode UI.
 * Field shapes live on AppStore; this file keeps cookingProfiles + type alias.
 */
import type { useApp } from '@/components/app/AppStore';
import type {
  DiaryEntry,
  ModeId,
  PantryItem,
  Profile,
} from '@/lib/profiles/types';
import type { MealSlot } from '@/lib/profiles/types';

/** @deprecated Prefer ReturnType<typeof useApp> — fields are native on AppStore. */
export type CookCapFields = {
  mode: ModeId;
  setMode: (m: ModeId) => void;
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfileId: (id: string | null) => void;
  cookingForIds: string[];
  setCookingForIds: (ids: string[]) => void;
  upsertProfile: (p: Profile) => Promise<void> | void;
  removeProfile: (id: string) => Promise<void> | void;
  diary: DiaryEntry[];
  logMeal: (entry: {
    recipeId: string;
    profileId: string;
    servings: number;
    meal: MealSlot;
    date: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    healthier?: boolean;
  }) => Promise<void> | void;
  removeDiaryEntry: (id: string) => Promise<void> | void;
  pantry: PantryItem[];
  upsertPantry: (item: PantryItem) => Promise<void> | void;
  removePantry: (id: string) => Promise<void> | void;
  weeklyBudgetPkr: number;
  setWeeklyBudgetPkr: (n: number) => void;
  currency: 'PKR' | 'USD' | 'GBP';
  healthierOn: boolean;
  setHealthierOn: (v: boolean) => void;
};

/** @deprecated Prefer ReturnType<typeof useApp>. */
export type CookCapApp = ReturnType<typeof useApp>;

export function cookingProfiles(
  profiles: Profile[],
  cookingForIds: string[],
  activeProfile: Profile | null,
): Profile[] {
  if (cookingForIds.length) {
    return profiles.filter((p) => cookingForIds.includes(p.id));
  }
  return activeProfile ? [activeProfile] : [];
}
