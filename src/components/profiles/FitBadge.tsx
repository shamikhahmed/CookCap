'use client';

import { useApp } from '@/components/app/AppStore';
import { scoreRecipe } from '@/lib/modes/recommender';
import type { Recipe } from '@/lib/recipes/types';
import { cookingProfiles } from './cookcap-fields';

/** Compact fit pill from mode scoring — hidden in Reader. */
export function FitBadge({ recipe }: { recipe: Recipe }) {
  const { mode, profiles, cookingForIds, activeProfile } = useApp();

  if (mode === 'reader') return null;

  const eaters = cookingProfiles(profiles, cookingForIds, activeProfile);
  const { reasons } = scoreRecipe(recipe, mode, eaters);
  const bits = reasons.slice(0, 2);
  if (bits.length === 0) return null;

  return (
    <span
      className="inline-flex max-w-full items-center truncate rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)] px-2.5 py-0.5 text-[0.7rem] font-medium text-[color:var(--color-ink-soft)]"
      title={bits.join(' · ')}
    >
      {bits.join(' · ')}
    </span>
  );
}
