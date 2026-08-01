'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  getShopping,
  putShopping,
  clearCheckedShopping,
  clearAllShopping,
} from '@/lib/db/store';
import { useApp } from '@/components/app/AppStore';
import { Icon } from '@/components/ui/Icon';

type Row = {
  key: string;
  item: string;
  qty: string;
  checked: boolean;
  recipeId?: string;
};

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const CAT_ORDER = ['Produce', 'Proteins', 'Dairy', 'Pantry', 'Other'] as const;

function categoryFor(item: string): (typeof CAT_ORDER)[number] {
  const t = item.toLowerCase();
  if (/chicken|beef|mutton|lamb|meat|fish|prawn|shrimp|egg|keema|tikka/.test(t))
    return 'Proteins';
  if (/milk|cream|butter|cheese|yogurt|yoghurt|ghee|paneer|khoya/.test(t)) return 'Dairy';
  if (
    /onion|tomato|garlic|ginger|chili|chilli|pepper|herb|cilantro|coriander|mint|potato|carrot|spinach|leaf|lemon|lime|cucumber|cabbage|peas|beans|fruit|berry/.test(
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

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping list"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]">
                  Shopping
                </h2>
                {rows.length > 0 && (
                  <p className="text-xs text-[color:var(--color-ink-faint)]">
                    {unchecked} left · {rows.length} total · grouped by aisle
                  </p>
                )}
              </div>
              <button onClick={onClose} aria-label="Close" className="text-[color:var(--color-ink-faint)]">
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {rows.length === 0 ? (
                <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-5 text-center text-sm text-[color:var(--color-ink-faint)]">
                  Your list is empty. Add ingredients from any recipe — they&apos;ll wait here
                  offline until you tick them off. Duplicates merge automatically.
                </p>
              ) : (
                <div className="space-y-5">
                  {grouped.map(({ cat, rows: catRows }) => (
                    <section key={cat} aria-label={cat}>
                      <h3 className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                        {cat}
                      </h3>
                      <ul className="space-y-1">
                        {catRows.map((row) => (
                          <li key={row.key}>
                            <label
                              className={`flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[color:var(--color-paper-sunk)] ${
                                row.checked ? 'opacity-55' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={row.checked}
                                onChange={() => void toggle(row)}
                                className="mt-1 size-4 accent-[color:var(--color-accent)]"
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
