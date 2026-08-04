'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getMeta, putMeta, addIngredientsToShopping } from '@/lib/db/store';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { serveWithFor } from '@/lib/recipes/serve-with';
import { formatQty } from '@/lib/recipes/scale';
import {
  OCCASION_TEMPLATES,
  buildWeekFromTemplate,
} from '@/lib/occasions/templates';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type Day = (typeof DAYS)[number];
type Plan = Partial<Record<Day, string>>;

function scrubPlanAgainstCatalog(
  plan: Plan,
  recipeMap: Record<string, unknown>,
): { cleaned: Plan; changed: boolean } {
  const cleaned: Plan = {};
  let changed = false;
  for (const day of DAYS) {
    const id = plan[day];
    if (!id) continue;
    if (recipeMap[id]) {
      cleaned[day] = id;
    } else {
      changed = true;
    }
  }
  return { cleaned, changed };
}

/** Simple week meal plan — IndexedDB meta. Generates shopping from assigned days. */
export function MealPlannerDrawer({
  open,
  onClose,
  onShop,
}: {
  open: boolean;
  onClose: () => void;
  onShop: () => void;
}) {
  const { allRecipes, recipeMap, refreshShoppingCount } = useApp();
  const { goToRecipe } = useBook();
  const reduce = useReducedMotion();
  const [plan, setPlan] = useState<Plan>({});
  const [picking, setPicking] = useState<Day | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [includeSides, setIncludeSides] = useState(true);
  const panelRef = useRef<HTMLElement>(null);
  const pickingRef = useRef(picking);
  pickingRef.current = picking;

  useEffect(() => {
    if (!open) {
      setPicking(null);
      setQ('');
      setError('');
      return;
    }
    void getMeta<Plan>('meal-plan')
      .then(async (p) => {
        const raw = p ?? {};
        const { cleaned, changed } = scrubPlanAgainstCatalog(raw, recipeMap);
        if (changed) await putMeta('meal-plan', cleaned);
        setPlan(cleaned);
      })
      .catch(() => setPlan({}));
  }, [open, recipeMap]);

  const closeHandler = useCallback(() => {
    if (pickingRef.current) {
      setPicking(null);
      setQ('');
      return;
    }
    onClose();
  }, [onClose]);

  useDialogA11y(open, closeHandler, panelRef);

  const save = async (next: Plan): Promise<boolean> => {
    setPlan(next);
    try {
      await putMeta('meal-plan', next);
      setError('');
      return true;
    } catch {
      setError('Could not save meal plan on this device.');
      return false;
    }
  };

  const assign = async (day: Day, id: string) => {
    const ok = await save({ ...plan, [day]: id });
    if (ok) {
      setPicking(null);
      setQ('');
    }
  };

  const clearDay = async (day: Day) => {
    const next = { ...plan };
    delete next[day];
    await save(next);
  };

  const applyTemplate = async (id: string) => {
    const tpl = OCCASION_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    try {
      const next = buildWeekFromTemplate(tpl, allRecipes) as Plan;
      await save(next);
      setError('');
    } catch {
      setError('Could not apply template on this device.');
    }
  };

  const shopWeek = async () => {
    try {
      const seenSides = new Set<string>();
      for (const day of DAYS) {
        const id = plan[day];
        if (!id) continue;
        const r = recipeMap[id];
        if (!r) continue;
        const items = r.ingredients.flatMap((g) =>
          g.items.map((it) => ({
            item: it.item,
            qty: [it.quantity, it.unit].filter((x) => x != null && x !== '').join(' '),
          })),
        );
        await addIngredientsToShopping(r.id, items);

        if (includeSides) {
          for (const { recipe: side } of serveWithFor(r, allRecipes, 3)) {
            if (seenSides.has(side.id)) continue;
            seenSides.add(side.id);
            const sideItems = side.ingredients.flatMap((g) =>
              g.items.map((it) => ({
                item: it.item,
                qty: `${formatQty(it.quantity)} ${it.unit}`.trim(),
              })),
            );
            await addIngredientsToShopping(side.id, sideItems);
          }
        }
      }
      refreshShoppingCount();
      setError('');
      onClose();
      onShop();
    } catch {
      setError('Could not add week to shopping list on this device.');
    }
  };

  const assignedCount = DAYS.filter((d) => {
    const id = plan[d];
    return id && recipeMap[id];
  }).length;

  const matches = allRecipes
    .filter((r) => r.chapter !== 'tips')
    .filter((r) => {
      if (!q.trim()) return true;
      const hay = `${r.title} ${r.tagline}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    })
    .slice(0, 12);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeHandler}
        >
          <motion.aside
            ref={panelRef}
            initial={reduce ? false : { y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 16, opacity: 0 }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-planner-title"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div>
                <h2
                  id="meal-planner-title"
                  className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  This week
                </h2>
                <p className="text-xs text-[color:var(--color-ink-faint)]">
                  Assign dishes · stays on this device
                </p>
              </div>
              <button
                type="button"
                onClick={closeHandler}
                aria-label="Close"
                className="grid size-11 place-items-center text-[color:var(--color-ink-faint)]"
              >
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {error && (
                <p className="rounded-lg bg-[color:var(--color-danger)]/10 p-3 text-sm text-[color:var(--color-danger)]" role="alert">
                  {error}
                </p>
              )}

              {assignedCount === 0 && !picking && (
                <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-3 text-sm text-[color:var(--color-ink-faint)]">
                  No days planned yet — tap Pick on a day, or use a week template.
                </p>
              )}

              {!picking && (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                    Week templates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OCCASION_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => void applyTemplate(tpl.id)}
                        className="min-h-11 rounded-full border border-[color:var(--color-line)] px-3 text-xs text-[color:var(--color-ink)]"
                        title={tpl.blurb}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {DAYS.map((day) => {
                const id = plan[day];
                const r = id ? recipeMap[id] : undefined;
                const missing = id && !r;
                return (
                  <div
                    key={day}
                    className="flex items-center gap-3 rounded-xl border border-[color:var(--color-line)] px-3 py-2.5"
                  >
                    <span className="w-10 shrink-0 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      {day}
                    </span>
                    {r ? (
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left font-serif text-[color:var(--color-ink)]"
                        onClick={() => {
                          goToRecipe(r.id);
                          onClose();
                        }}
                      >
                        {r.title}
                      </button>
                    ) : missing ? (
                      <span className="flex-1 text-sm text-[color:var(--color-danger)]">Missing recipe</span>
                    ) : (
                      <span className="flex-1 text-sm text-[color:var(--color-ink-faint)]">—</span>
                    )}
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-sunk)]"
                      onClick={() => setPicking(day)}
                    >
                      {r ? 'Change' : 'Pick'}
                    </button>
                    {(r || missing) && (
                      <button
                        type="button"
                        aria-label={`Clear ${day}`}
                        className="rounded-lg px-2 py-1 text-xs text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
                        onClick={() => void clearDay(day)}
                      >
                        {missing ? 'Clear' : '×'}
                      </button>
                    )}
                  </div>
                );
              })}

              {picking && (
                <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Pick for {picking}
                  </p>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search recipes…"
                    className="mb-2 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-sm"
                    autoFocus
                  />
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {matches.length === 0 ? (
                      <li className="px-2 py-3 text-center text-sm text-[color:var(--color-ink-faint)]">
                        No recipes match
                      </li>
                    ) : (
                      matches.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[color:var(--color-paper-raised)]"
                            onClick={() => void assign(picking, r.id)}
                          >
                            {r.title}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            <footer className="shrink-0 space-y-2 border-t border-[color:var(--color-line)] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[color:var(--color-ink-soft)]">
                <input
                  type="checkbox"
                  checked={includeSides}
                  onChange={(e) => setIncludeSides(e.target.checked)}
                  className="size-4 accent-[color:var(--color-accent)]"
                />
                Include serve-with sides in shopping
              </label>
              <button
                type="button"
                onClick={() => void shopWeek()}
                className="w-full rounded-xl bg-[color:var(--color-leather)] px-4 py-3 text-sm font-medium text-[color:var(--color-paper)]"
              >
                Add week to shopping list
              </button>
            </footer>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
