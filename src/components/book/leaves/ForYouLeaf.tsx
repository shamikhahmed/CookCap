'use client';

import { motion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { CHAPTER_MAP } from '@/lib/recipes/chapters';
import { getMode } from '@/lib/modes/registry';
import { rankRecipes, scoreRecipe } from '@/lib/modes/recommender';
import { NUTRITION_DISCLAIMER } from '@/lib/profiles/nutrition';
import { cookingProfiles } from '@/components/profiles/cookcap-fields';

/** Goal-fit shelf — only mounted when mode ≠ reader. */
export function ForYouLeaf() {
  const { allRecipes, mode, profiles, cookingForIds, activeProfile } =
    useApp();
  const { goToRecipe } = useBook();

  if (mode === 'reader') return null;

  const eaters = cookingProfiles(profiles, cookingForIds, activeProfile);
  const ranked = rankRecipes(
    allRecipes.filter((r) => r.chapter !== 'tips'),
    mode,
    eaters,
    12,
  );
  const modeDef = getMode(mode);

  return (
    <div className="paper-grain flex min-h-full h-full w-full flex-col px-[7%] py-[8%]">
      <header className="mb-5 shrink-0">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--color-ink-faint)]">
          For you
        </p>
        <h2 className="font-serif text-3xl font-semibold text-[color:var(--color-ink)]">
          {modeDef.label}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-ink-faint)]">{modeDef.blurb}</p>
        <div className="mt-3 h-px w-full bg-[color:var(--color-line)]" />
      </header>

      <ul
        data-leaf-scroll
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain"
      >
        {ranked.length === 0 ? (
          <li className="rounded-xl bg-[color:var(--color-paper-sunk)]/55 p-4 text-sm text-[color:var(--color-ink-faint)]">
            No picks yet — add a profile or try another mode.
          </li>
        ) : (
          ranked.map((r, i) => {
            const chapter = CHAPTER_MAP[r.chapter];
            const { reasons } = scoreRecipe(r, mode, eaters);
            const why = reasons.slice(0, 2).join(' · ');
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.35 }}
              >
                <button
                  type="button"
                  onClick={() => goToRecipe(r.id)}
                  className="group flex w-full items-start gap-3 rounded-md py-2 text-left transition-colors hover:bg-[color:var(--color-paper-sunk)]"
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ background: chapter?.tab ?? 'var(--color-accent)' }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-lg text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)]">
                      {r.title}
                    </span>
                    <span className="block truncate text-xs text-[color:var(--color-ink-faint)]">
                      {why || r.tagline}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-faint)]">
                    {r.prepMin + r.cookMin}m
                  </span>
                </button>
              </motion.li>
            );
          })
        )}
      </ul>

      <p className="mt-4 shrink-0 text-center text-[0.7rem] text-[color:var(--color-ink-faint)]">
        {NUTRITION_DISCLAIMER}
      </p>
    </div>
  );
}
