'use client';

import { motion } from 'motion/react';
import { CHAPTERS } from '@/lib/recipes/chapters';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ideasForToday } from '@/lib/recipes/ideas';

/** Table of contents + today’s kitchen ideas. */
export function ContentsLeaf() {
  const { goToChapter, goToRecipe } = useBook();
  const { allRecipes } = useApp();
  const ideas = ideasForToday(allRecipes);

  return (
    <div className="paper-grain flex h-full w-full flex-col px-[7%] py-[8%]">
      <header className="mb-5 shrink-0">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--color-ink-faint)]">
          Contents
        </p>
        <h2 className="font-serif text-3xl font-semibold text-[color:var(--color-ink)]">
          The Chapters
        </h2>
        <div className="mt-3 h-px w-full bg-[color:var(--color-line)]" />
      </header>

      {/* Tonight / today ideas */}
      <section className="mb-5 shrink-0 rounded-xl border border-[color:var(--color-line)]/80 bg-[color:var(--color-paper-sunk)]/55 p-3 sm:p-4">
        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--color-accent)]">
          Today’s kitchen
        </p>
        <p className="mt-1 font-serif text-lg text-[color:var(--color-ink)]">What shall we cook?</p>
        <ul className="mt-3 space-y-2">
          {ideas.map((idea) => (
            <li key={idea.recipe.id}>
              <button
                type="button"
                onClick={() => goToRecipe(idea.recipe.id)}
                className="group flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[color:var(--color-paper-raised)]"
              >
                <span className="mt-0.5 w-16 shrink-0 text-[0.65rem] font-medium uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                  {idea.eyebrow}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-base text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)]">
                    {idea.recipe.title}
                  </span>
                  <span className="block text-xs text-[color:var(--color-ink-faint)]">{idea.why}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ul
        data-leaf-scroll
        className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-x-8 gap-y-1 overflow-y-auto overscroll-contain sm:grid-cols-2"
      >
        {CHAPTERS.map((c, i) => {
          const count = allRecipes.filter((r) => r.chapter === c.id).length;
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
            >
              <button
                onClick={() => goToChapter(c.id)}
                className="group flex w-full items-center gap-3 rounded-md py-2 text-left transition-colors hover:bg-[color:var(--color-paper-sunk)]"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ background: `${c.tab}22`, color: c.tab }}
                >
                  <Icon name={c.icon as IconName} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg text-[color:var(--color-ink)]">
                    {c.title}
                  </span>
                  <span className="block truncate text-xs text-[color:var(--color-ink-faint)]">
                    {c.subtitle}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-faint)]">
                  {count}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
