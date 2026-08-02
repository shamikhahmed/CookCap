'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { rankRecipes } from '@/lib/modes/recommender';
import { newId, type PantryItem } from '@/lib/profiles/types';
import type { Recipe } from '@/lib/recipes/types';
import { cookingProfiles } from './cookcap-fields';
import { BudgetPanel } from './BudgetPanel';

function ingredientNames(recipe: Recipe): string[] {
  return recipe.ingredients.flatMap((g) => g.items.map((it) => it.item.toLowerCase()));
}

function pantryMatchScore(recipe: Recipe, pantryNames: string[]): number {
  if (pantryNames.length === 0) return 0;
  const ings = ingredientNames(recipe);
  if (ings.length === 0) return 0;
  let hits = 0;
  for (const ing of ings) {
    if (pantryNames.some((p) => ing.includes(p) || p.includes(ing))) hits += 1;
  }
  return hits / ings.length;
}

/** Pantry inventory + cook-now suggestions + budget. */
export function PantryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    pantry,
    upsertPantry,
    removePantry,
    allRecipes,
    mode,
    profiles,
    cookingForIds,
    activeProfile,
  } = useApp();
  const { goToRecipe } = useBook();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');

  useDialogA11y(open, onClose, panelRef);

  const pantryNames = useMemo(
    () => pantry.map((p) => p.name.trim().toLowerCase()).filter(Boolean),
    [pantry],
  );

  const cookNow = useMemo(() => {
    if (pantryNames.length === 0) return [] as Recipe[];
    const scored = allRecipes
      .filter((r) => r.chapter !== 'tips')
      .map((r) => ({ r, m: pantryMatchScore(r, pantryNames) }))
      .filter((x) => x.m >= 0.5)
      .sort((a, b) => b.m - a.m)
      .map((x) => x.r);

    if (mode === 'reader') return scored.slice(0, 8);

    const eaters = cookingProfiles(profiles, cookingForIds, activeProfile);
    const ranked = rankRecipes(scored, mode, eaters, 8);
    return ranked.length ? ranked : scored.slice(0, 8);
  }, [allRecipes, pantryNames, mode, profiles, cookingForIds, activeProfile]);

  const addItem = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item: PantryItem = {
      id: newId('pantry'),
      name: trimmed,
      qty: qty.trim() || undefined,
      updatedAt: Date.now(),
    };
    await upsertPantry(item);
    setName('');
    setQty('');
  }, [name, qty, upsertPantry]);

  const jump = (id: string) => {
    goToRecipe(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pantry-drawer-title"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div>
                <h2
                  id="pantry-drawer-title"
                  className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Pantry
                </h2>
                <p className="text-xs text-[color:var(--color-ink-faint)]">
                  What you have · cook from it
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

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <BudgetPanel />

              <section>
                <h3 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                  Add item
                </h3>
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingredient"
                    className="min-w-0 flex-1 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void addItem();
                    }}
                  />
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="Qty"
                    className="w-20 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-2 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void addItem();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void addItem()}
                    disabled={!name.trim()}
                    className="rounded-lg bg-[color:var(--color-accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                  On hand
                </h3>
                {pantry.length === 0 ? (
                  <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-4 text-sm text-[color:var(--color-ink-faint)]">
                    Empty pantry — add staples to see what you can cook now.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {pantry.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-[color:var(--color-paper-sunk)]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif text-[color:var(--color-ink)]">
                            {item.name}
                          </span>
                          {item.qty && (
                            <span className="block text-xs text-[color:var(--color-ink-faint)]">
                              {item.qty}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => void removePantry(item.id)}
                          className="text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-danger)]"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                  You can cook now
                </h3>
                {cookNow.length === 0 ? (
                  <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-4 text-sm text-[color:var(--color-ink-faint)]">
                    {pantryNames.length === 0
                      ? 'Add pantry items to match recipes.'
                      : 'No strong matches yet — try broader staple names.'}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {cookNow.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => jump(r.id)}
                          className="w-full rounded-xl px-2 py-2 text-left hover:bg-[color:var(--color-paper-sunk)]"
                        >
                          <span className="block font-serif text-[color:var(--color-ink)]">
                            {r.title}
                          </span>
                          <span className="block truncate text-xs text-[color:var(--color-ink-faint)]">
                            {r.tagline}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
