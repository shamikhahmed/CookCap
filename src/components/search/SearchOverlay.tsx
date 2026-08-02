'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { searchRecipes, type SearchFilters } from '@/lib/search/search';
import { CHAPTER_MAP } from '@/lib/recipes/chapters';
import { RecipeImage } from '@/components/ui/RecipeImage';
import { useBook } from '@/components/book/BookController';
import { useApp } from '@/components/app/AppStore';
import { RECIPE_MAP } from '@/lib/recipes/data';
import { Icon } from '@/components/ui/Icon';
import { useDialogA11y } from '@/lib/a11y/dialog';
import { favoritesLabel } from '@/lib/edition';

const RECENT_KEY = 'jia-recent-search';

/** Raycast / macOS Spotlight–style search. ⌘K from Shell. */
export function SearchOverlay({
  open,
  onClose,
  onShop,
  onPlan,
}: {
  open: boolean;
  onClose: () => void;
  onShop?: () => void;
  onPlan?: () => void;
}) {
  const { goToRecipe, goToChapter } = useBook();
  const { recent, favorites, allRecipes, recipeMap, theme, setTheme, edition } = useApp();
  const reduce = useReducedMotion();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogA11y(open, onClose, panelRef, { initialFocus: 'none' });

  useEffect(() => {
    if (!open) return;
    setQ('');
    setFilters({});
    setCursor(0);
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setRecentSearches(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentSearches([]);
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(
    () => searchRecipes(q, filters, allRecipes).slice(0, 24),
    [q, filters, allRecipes],
  );

  const suggestions = useMemo(() => {
    const fromHearts = Array.from(favorites)
      .map((id) => recipeMap[id] ?? RECIPE_MAP[id])
      .filter(Boolean);
    const fromRecent = recent.map((id) => recipeMap[id] ?? RECIPE_MAP[id]).filter(Boolean);
    const featured = allRecipes.filter((r) => r.chapter === 'favorites').slice(0, 4);
    const seen = new Set<string>();
    const out = [];
    for (const r of [...fromHearts, ...fromRecent, ...featured, ...allRecipes]) {
      if (!r || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
      if (out.length >= 8) break;
    }
    return out;
  }, [favorites, recent, allRecipes, recipeMap]);

  const rows = q.trim() || Object.keys(filters).some((k) => filters[k as keyof SearchFilters])
    ? results
    : suggestions;

  useEffect(() => {
    setCursor(0);
  }, [q, filters.difficulty, filters.maxTime]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const commit = (id: string) => {
    if (q.trim()) {
      const next = [q.trim(), ...recentSearches.filter((r) => r !== q.trim())].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    }
    goToRecipe(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(rows.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && rows[cursor]) {
      e.preventDefault();
      commit(rows[cursor]!.id);
    }
  };

  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const hasFilters = Object.keys(filters).some((k) => filters[k as keyof SearchFilters]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-3 backdrop-blur-md sm:pt-[12vh]"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
            className="flex max-h-[78vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)]/95 shadow-[var(--shadow-lg)] backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Search recipes"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Icon name="search" size={20} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search recipes, ingredients, cuisines…"
                className="flex-1 bg-transparent text-lg text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden rounded-md border border-[color:var(--color-line)] px-1.5 py-0.5 text-[0.65rem] text-[color:var(--color-ink-faint)] sm:inline">
                esc
              </kbd>
            </div>

            <div className="flex flex-wrap gap-1.5 border-y border-[color:var(--color-line)] px-4 py-2">
              <Chip
                active={filters.difficulty === 'easy'}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    difficulty: f.difficulty === 'easy' ? undefined : 'easy',
                  }))
                }
              >
                Easy
              </Chip>
              <Chip
                active={filters.maxTime === 30}
                onClick={() => setFilters((f) => ({ ...f, maxTime: f.maxTime ? undefined : 30 }))}
              >
                ≤ 30 min
              </Chip>
              {!q && recentSearches.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="rounded-md px-2 py-1 text-xs text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
                >
                  {s}
                </button>
              ))}
            </div>

            <p className="px-4 pt-2.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
              {q.trim() || hasFilters
                ? `${rows.length} result${rows.length === 1 ? '' : 's'}`
                : 'Suggested'}
            </p>

            {!q.trim() && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                <Chip
                  active={false}
                  onClick={() => {
                    const pool = allRecipes.filter((r) => r.chapter !== 'tips');
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    if (pick) commit(pick.id);
                  }}
                >
                  Surprise me
                </Chip>
                <Chip
                  active={false}
                  onClick={() => {
                    const next = theme === 'dark' ? 'light' : 'dark';
                    setTheme(next);
                    onClose();
                  }}
                >
                  Toggle theme
                </Chip>
                <Chip
                  active={false}
                  onClick={() => {
                    onClose();
                    onShop?.();
                  }}
                >
                  Shopping
                </Chip>
                <Chip
                  active={false}
                  onClick={() => {
                    onClose();
                    onPlan?.();
                  }}
                >
                  This week
                </Chip>
                <Chip
                  active={false}
                  onClick={() => {
                    goToChapter('pakistani');
                    onClose();
                  }}
                >
                  Pakistani
                </Chip>
              </div>
            )}

            <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
              {rows.length === 0 && (
                <li className="space-y-1 p-10 text-center text-sm text-[color:var(--color-ink-faint)]">
                  <p>
                    {q.trim()
                      ? `No recipes match “${q.trim()}”.`
                      : 'No recipes match these filters.'}
                  </p>
                  <p className="text-xs">
                    {hasFilters
                      ? 'Try clearing Easy / ≤ 30 min, or search a different ingredient.'
                      : 'Try another spelling, a cuisine, or an ingredient name.'}
                  </p>
                </li>
              )}
              {rows.map((r, i) => {
                const c = CHAPTER_MAP[r.chapter];
                const active = i === cursor;
                return (
                  <li key={r.id}>
                    <button
                      data-idx={i}
                      onClick={() => commit(r.id)}
                      onMouseEnter={() => setCursor(i)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors"
                      style={{
                        background: active ? 'var(--color-paper-sunk)' : 'transparent',
                      }}
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                        <RecipeImage
                          recipeId={r.id}
                          seed={r.heroSeed}
                          tab={c.tab}
                          alt=""
                          sizes="44px"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[1.05rem] text-[color:var(--color-ink)]">
                          {r.title}
                        </span>
                        <span className="block truncate text-xs text-[color:var(--color-ink-faint)]">
                          {[
                            r.chapter === 'favorites' ? favoritesLabel(edition) : c.title,
                            `${r.prepMin + r.cookMin} min`,
                            DIFF_LABEL[r.difficulty],
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      {active && (
                        <span className="hidden text-[0.65rem] text-[color:var(--color-ink-faint)] sm:inline">
                          ↵
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-[color:var(--color-line)] px-4 py-2 text-[0.65rem] text-[color:var(--color-ink-faint)]">
              <span>↑↓ navigate · ↵ open</span>
              <span>{isMac ? '⌘K' : 'Ctrl+K'} anytime</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="rounded-md border px-2.5 py-1 text-xs transition-colors"
      style={{
        borderColor: active ? 'var(--color-accent)' : 'var(--color-line)',
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'white' : 'var(--color-ink-soft)',
      }}
    >
      {children}
    </button>
  );
}
