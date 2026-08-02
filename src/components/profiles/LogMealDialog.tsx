'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { Icon } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import {
  applyHealthier,
  NUTRITION_DISCLAIMER,
  scaleMacros,
} from '@/lib/profiles/nutrition';
import type { MealSlot } from '@/lib/profiles/types';

const MEALS: { id: MealSlot; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Log a cooked recipe into the diary. */
export function LogMealDialog({
  open,
  onClose,
  recipeId,
}: {
  open: boolean;
  onClose: () => void;
  recipeId: string;
}) {
  const {
    recipeMap,
    profiles,
    activeProfile,
    logMeal,
    healthierOn,
  } = useApp();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

  const recipe = recipeMap[recipeId];
  const [meal, setMeal] = useState<MealSlot>('dinner');
  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [profileId, setProfileId] = useState(activeProfile?.id ?? '');
  const [date, setDate] = useState(todayIso);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMeal('dinner');
    setServings(recipe?.servings ?? 2);
    setProfileId(activeProfile?.id ?? profiles[0]?.id ?? '');
    setDate(todayIso());
    setSaving(false);
  }, [open, recipe?.servings, activeProfile?.id, profiles]);

  useDialogA11y(open, onClose, panelRef);

  const preview = useMemo(() => {
    if (!recipe) return null;
    const scaled = scaleMacros(recipe.nutrition, servings, recipe.servings);
    if (!healthierOn) return scaled;
    const h = applyHealthier(scaled);
    return {
      ...scaled,
      calories: h.calories,
      protein: h.protein,
      carbs: h.carbs,
      fat: h.fat,
    };
  }, [recipe, servings, healthierOn]);

  const save = useCallback(async () => {
    if (!recipe || !profileId || !preview) return;
    setSaving(true);
    try {
      await logMeal({
        recipeId: recipe.id,
        profileId,
        servings,
        meal,
        date,
        kcal: preview.calories,
        protein: preview.protein,
        carbs: preview.carbs,
        fat: preview.fat,
        healthier: healthierOn || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [recipe, profileId, preview, logMeal, servings, meal, date, healthierOn, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={reduce ? false : { y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 16, opacity: 0 }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(88dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-meal-title"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="log-meal-title"
                  className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Log this
                </h2>
                <p className="truncate text-xs text-[color:var(--color-ink-faint)]">
                  {recipe?.title ?? 'Recipe'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-[color:var(--color-ink-faint)]"
              >
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {!recipe ? (
                <p className="text-sm text-[color:var(--color-ink-faint)]">Recipe not found.</p>
              ) : (
                <>
                  <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Meal
                    <select
                      value={meal}
                      onChange={(e) => setMeal(e.target.value as MealSlot)}
                      className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
                    >
                      {MEALS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      Servings
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Fewer servings"
                        onClick={() => setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))}
                        className="grid size-9 place-items-center rounded-lg bg-[color:var(--color-paper-sunk)] text-[color:var(--color-ink)]"
                      >
                        −
                      </button>
                      <span className="min-w-[3rem] text-center font-serif text-xl tabular-nums text-[color:var(--color-ink)]">
                        {servings}
                      </span>
                      <button
                        type="button"
                        aria-label="More servings"
                        onClick={() => setServings((s) => Math.round((s + 0.5) * 10) / 10)}
                        className="grid size-9 place-items-center rounded-lg bg-[color:var(--color-paper-sunk)] text-[color:var(--color-ink)]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Profile
                    <select
                      value={profileId}
                      onChange={(e) => setProfileId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
                    >
                      {profiles.length === 0 && <option value="">No profiles</option>}
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Date
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
                    />
                  </label>

                  {preview && (
                    <div className="rounded-xl bg-[color:var(--color-paper-sunk)] p-3 text-sm text-[color:var(--color-ink-soft)]">
                      <p className="mb-1 text-[0.65rem] uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                        Preview {healthierOn ? '(healthier estimate)' : ''}
                      </p>
                      <p className="tabular-nums">
                        {preview.calories} kcal · {preview.protein} g protein · {preview.carbs} g
                        carbs · {preview.fat} g fat
                      </p>
                    </div>
                  )}

                  <p className="text-[0.7rem] text-[color:var(--color-ink-faint)]">
                    {NUTRITION_DISCLAIMER}
                  </p>
                </>
              )}
            </div>

            <footer className="shrink-0 border-t border-[color:var(--color-line)] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                disabled={saving || !recipe || !profileId}
                onClick={() => void save()}
                className="w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save to diary'}
              </button>
            </footer>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
