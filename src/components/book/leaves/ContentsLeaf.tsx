'use client';

import { motion } from 'motion/react';
import { CHAPTERS } from '@/lib/recipes/chapters';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ideasForToday } from '@/lib/recipes/ideas';
import { favoritesLabel } from '@/lib/edition';
import { OCCASION_TEMPLATES, occasionRail } from '@/lib/occasions/templates';

/** Table of contents + today’s kitchen ideas — one scroll, no stuck hero. */
export function ContentsLeaf() {
  const { goToChapter, goToRecipe } = useBook();
  const { allRecipes, edition } = useApp();
  const ideas = ideasForToday(allRecipes);

  return (
    <div
      data-leaf-scroll
      className="paper-grain flex min-h-full h-full w-full flex-col overflow-y-auto overscroll-contain px-[7%] py-[6%]"
    >
      <header className="mb-4 shrink-0">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--color-ink-faint)]">
          Contents
        </p>
        <h2 className="font-serif text-3xl font-semibold text-[color:var(--color-ink)]">
          The Chapters
        </h2>
        <div className="mt-3 h-px w-full bg-[color:var(--color-line)]" />
      </header>

      {/* Tonight / today ideas — compact; scrolls away with chapters */}
      <section className="mb-4 shrink-0 rounded-xl border border-[color:var(--color-line)]/80 bg-[color:var(--color-paper-sunk)]/55 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-accent)]">
            Today’s kitchen
          </p>
          <p className="hidden font-serif text-sm text-[color:var(--color-ink-faint)] sm:block">
            What shall we cook?
          </p>
        </div>
        <ul className="mt-2 divide-y divide-[color:var(--color-line)]/60">
          {ideas.map((idea) => (
            <li key={idea.recipe.id}>
              <button
                type="button"
                onClick={() => goToRecipe(idea.recipe.id)}
                className="group flex w-full items-center gap-2.5 py-2 text-left transition-colors first:pt-1.5 last:pb-1 hover:bg-[color:var(--color-paper-raised)]/80"
              >
                <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-faint)] sm:w-16">
                  {idea.eyebrow}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[0.95rem] text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] sm:text-base">
                    {idea.recipe.title}
                  </span>
                  <span className="mt-0.5 hidden truncate text-xs text-[color:var(--color-ink-faint)] sm:block">
                    {idea.why}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-4 shrink-0">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
          Occasions
        </p>
        <ul className="space-y-2">
          {OCCASION_TEMPLATES.map((tpl) => {
            const rail = occasionRail(tpl, allRecipes, 3);
            if (rail.length === 0) return null;
            return (
              <li
                key={tpl.id}
                className="rounded-xl border border-[color:var(--color-line)]/80 bg-[color:var(--color-paper-raised)]/70 px-3 py-2"
              >
                <p className="font-serif text-[color:var(--color-ink)]">{tpl.label}</p>
                <p className="text-xs text-[color:var(--color-ink-faint)]">{tpl.blurb}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {rail.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => goToRecipe(r.id)}
                      className="min-h-11 rounded-full border border-[color:var(--color-line)] px-2.5 text-xs text-[color:var(--color-ink)]"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="grid auto-rows-min grid-cols-1 gap-x-8 gap-y-0.5 pb-4 sm:grid-cols-2">
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
                type="button"
                onClick={() => goToChapter(c.id)}
                className="group flex w-full items-center gap-3 rounded-md py-2.5 text-left transition-colors hover:bg-[color:var(--color-paper-sunk)] sm:py-2"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ background: `${c.tab}22`, color: c.tab }}
                >
                  <Icon name={c.icon as IconName} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg text-[color:var(--color-ink)]">
                    {c.id === 'favorites' ? favoritesLabel(edition) : c.title}
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
