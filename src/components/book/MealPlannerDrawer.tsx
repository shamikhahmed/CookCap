'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getMeta, putMeta, addIngredientsToShopping } from '@/lib/db/store';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon } from '@/components/ui/Icon';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type Day = (typeof DAYS)[number];
type Plan = Partial<Record<Day, string>>;

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const [plan, setPlan] = useState<Plan>({});
  const [picking, setPicking] = useState<Day | null>(null);
  const [q, setQ] = useState('');
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    void getMeta<Plan>('meal-plan').then((p) => setPlan(p ?? {}));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (picking) setPicking(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, picking]);

  const save = async (next: Plan) => {
    setPlan(next);
    await putMeta('meal-plan', next);
  };

  const assign = async (day: Day, id: string) => {
    await save({ ...plan, [day]: id });
    setPicking(null);
    setQ('');
  };

  const clearDay = async (day: Day) => {
    const next = { ...plan };
    delete next[day];
    await save(next);
  };

  const shopWeek = async () => {
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
    }
    refreshShoppingCount();
    onClose();
    onShop();
  };

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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Meal planner"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]">
                  This week
                </h2>
                <p className="text-xs text-[color:var(--color-ink-faint)]">
                  Assign dishes · stays on this device
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-[color:var(--color-ink-faint)]">
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {DAYS.map((day) => {
                const id = plan[day];
                const r = id ? recipeMap[id] : undefined;
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
                    {r && (
                      <button
                        type="button"
                        aria-label={`Clear ${day}`}
                        className="text-[color:var(--color-ink-faint)]"
                        onClick={() => void clearDay(day)}
                      >
                        ×
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
                    {matches.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[color:var(--color-paper-raised)]"
                          onClick={() => void assign(picking, r.id)}
                        >
                          {r.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <footer className="border-t border-[color:var(--color-line)] px-5 py-3">
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
