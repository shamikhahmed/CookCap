'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  getShopping,
  putShopping,
  clearCheckedShopping,
  clearAllShopping,
} from '@/lib/db/store';
import { useApp } from '@/components/app/AppStore';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';

type Row = {
  key: string;
  item: string;
  qty: string;
  checked: boolean;
  recipeId?: string;
};

const CAT_ORDER = ['Produce', 'Proteins', 'Dairy', 'Pantry', 'Other'] as const;

function categoryFor(item: string): (typeof CAT_ORDER)[number] {
  const t = item.toLowerCase();
  if (/green bean|runner bean|french bean|string bean|haricot vert/.test(t)) return 'Produce';
  if (/chicken|beef|mutton|lamb|meat|fish|prawn|shrimp|egg|keema|tikka|\bbeans?\b/.test(t))
    return 'Proteins';
  if (/milk|cream|butter|cheese|yogurt|yoghurt|ghee|paneer|khoya/.test(t)) return 'Dairy';
  if (
    /onion|tomato|garlic|ginger|chili|chilli|pepper|herb|cilantro|coriander|mint|potato|carrot|spinach|leaf|lemon|lime|cucumber|cabbage|peas|fruit|berry/.test(
      t,
    )
  )
    return 'Produce';
  if (
    /flour|rice|pasta|bread|sugar|salt|spice|cumin|turmeric|oil|vinegar|sauce|stock|broth|powder|yeast|baking|noodle|atta|maida/.test(
      t,
    )
  )
    return 'Pantry';
  return 'Other';
}

/** Slide-over shopping checklist — offline via IndexedDB. */
export function ShoppingDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refreshShoppingCount } = useApp();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Row[]>([]);
  const panelRef = useRef<HTMLElement>(null);

  const reload = useCallback(async () => {
    try {
      const all = await getShopping();
      setRows(all);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  useDialogA11y(open, onClose, panelRef);

  const afterChange = async () => {
    await reload();
    refreshShoppingCount();
  };

  const toggle = async (row: Row) => {
    await putShopping({ ...row, checked: !row.checked });
    await afterChange();
  };

  const clearChecked = async () => {
    await clearCheckedShopping();
    await afterChange();
  };

  const clearAll = async () => {
    await clearAllShopping();
    await afterChange();
  };

  const unchecked = rows.filter((r) => !r.checked).length;
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const cat of CAT_ORDER) map.set(cat, []);
    for (const row of rows) {
      const cat = categoryFor(row.item);
      map.get(cat)!.push(row);
    }
    return CAT_ORDER.map((cat) => ({ cat, rows: map.get(cat)! })).filter((g) => g.rows.length > 0);
  }, [rows]);

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
            aria-labelledby="shopping-drawer-title"
          >
            <div className="sheet-grabber md:hidden" aria-hidden />
            <div className="sheet-bar border-b border-[color:var(--color-line)]">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-full px-3 text-[length:var(--t-body)] text-[color:var(--tint-text,var(--color-accent))]"
              >
                Cancel
              </button>
              <div className="text-center">
                <h2
                  id="shopping-drawer-title"
                  className="sheet-bar__title font-serif"
                >
                  Shopping
                </h2>
                {rows.length > 0 && (
                  <p className="text-[length:var(--t-caption)] text-[color:var(--color-ink-faint)]">
                    {unchecked} left · {rows.length} total
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-full px-3 text-[length:var(--t-body)] font-semibold text-[color:var(--tint-text,var(--color-accent))]"
              >
                Done
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {rows.length === 0 ? (
                <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-5 text-center text-sm text-[color:var(--color-ink-soft)]">
                  Your list is empty. Open a recipe → Add to shopping — items wait here offline. Duplicates merge automatically.
                </p>
              ) : (
                <div className="space-y-5">
                  {grouped.map(({ cat, rows: catRows }) => (
                    <section key={cat} aria-label={cat}>
                      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                        {cat}
                      </h3>
                      <ul className="space-y-1">
                        {catRows.map((row) => (
                          <li key={row.key}>
                            <label
                              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[color:var(--color-paper-sunk)] ${
                                row.checked ? 'opacity-55' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={row.checked}
                                onChange={() => void toggle(row)}
                                className="size-4 shrink-0 accent-[color:var(--color-accent)]"
                              />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block font-serif text-[color:var(--color-ink)] ${
                                    row.checked ? 'line-through' : ''
                                  }`}
                                >
                                  {row.item}
                                </span>
                                {row.qty && (
                                  <span className="block text-xs text-[color:var(--color-ink-faint)]">
                                    {row.qty}
                                  </span>
                                )}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <footer className="flex gap-2 border-t border-[color:var(--color-line)] px-5 py-3">
                <button
                  type="button"
                  onClick={() => void clearChecked()}
                  className="flex-1 rounded-lg bg-[color:var(--color-paper-sunk)] px-3 py-2.5 text-sm text-[color:var(--color-ink-soft)] transition-colors hover:bg-[color:var(--color-line)]"
                >
                  Clear checked
                </button>
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-paper-sunk)]"
                >
                  Clear all
                </button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
