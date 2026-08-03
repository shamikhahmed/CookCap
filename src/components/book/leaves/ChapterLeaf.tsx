'use client';

import { motion } from 'motion/react';
import { CHAPTER_MAP, chapterNumeral } from '@/lib/recipes/chapters';
import { useBook } from '@/components/book/BookController';
import { useApp } from '@/components/app/AppStore';
import { favoritesLabel } from '@/lib/edition';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { ChapterId } from '@/lib/recipes/types';

/** A chapter divider page: big title, blurb, and the recipes it holds. */
export function ChapterLeaf({ chapter }: { chapter: ChapterId }) {
  const c = CHAPTER_MAP[chapter];
  const { allRecipes, recipeMap, favorites, edition } = useApp();
  const displayTitle = chapter === 'favorites' ? favoritesLabel(edition) : c.title;
  const recipes = allRecipes.filter((r) => r.chapter === chapter);
  const { goToRecipe } = useBook();

  const hearted =
    chapter === 'favorites'
      ? Array.from(favorites)
          .map((id) => recipeMap[id])
          .filter((r): r is NonNullable<typeof r> => Boolean(r))
          .filter((r) => r.chapter !== 'favorites')
      : [];

  return (
    <div className="paper-grain relative flex min-h-full h-full w-full flex-col justify-center px-[9%] py-[8%]">
      <div
        className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.06]"
        style={{ color: c.tab }}
      >
        <Icon name={c.icon as IconName} size={260} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 min-h-0 overflow-y-auto overscroll-contain"
        data-leaf-scroll
      >
        <span
          className="text-xs font-medium uppercase tracking-[0.45em]"
          style={{ color: c.tab }}
        >
          Chapter {chapterNumeral(c.id)} · {c.subtitle}
        </span>
        <h2 className="mt-2 font-serif text-[clamp(2.4rem,6vw,3.4rem)] font-black leading-none text-[color:var(--color-ink)]">
          {displayTitle}
        </h2>
        <p className="mt-4 max-w-sm font-serif text-lg italic text-[color:var(--color-ink-soft)]">
          {c.blurb}
        </p>
        <p className="mt-3 max-w-sm font-serif text-base text-[color:var(--color-ink-faint)]">
          {c.quote}
        </p>

        <div className="mt-8 h-px w-16" style={{ background: c.tab }} />

        {chapter === 'favorites' && (
          <p className="mt-4 max-w-md text-sm text-[color:var(--color-ink-soft)]">
            Below are forever picks for this kitchen. Tap the heart on any recipe and it joins
            your personal list here too.
          </p>
        )}

        <ul className="mt-6 space-y-1">
          {recipes.slice(0, 24).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => goToRecipe(r.id)}
                className="group flex w-full items-baseline gap-3 py-1.5 text-left"
              >
                <span className="font-serif text-lg text-[color:var(--color-ink)] transition-colors group-hover:text-[color:var(--color-accent)]">
                  {r.title}
                </span>
                <span className="h-px flex-1 translate-y-[-3px] border-b border-dotted border-[color:var(--color-line)]" />
                <span className="text-xs text-[color:var(--color-ink-faint)]">
                  {r.prepMin + r.cookMin} min
                </span>
              </button>
            </li>
          ))}
        </ul>
        {recipes.length > 24 && (
          <p className="mt-4 text-sm text-[color:var(--color-ink-faint)]">
            …and {recipes.length - 24} more in the pages ahead — keep flipping, or use Search /
            Tabs.
          </p>
        )}

        {hearted.length > 0 && (
          <>
            <p className="mt-8 text-xs font-medium uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
              Your hearts
            </p>
            <ul className="mt-3 space-y-1">
              {hearted.map((r) => (
                <li key={`heart-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => goToRecipe(r.id)}
                    className="group flex w-full items-baseline gap-3 py-1.5 text-left"
                  >
                    <Icon
                      name="heart-filled"
                      size={14}
                      className="translate-y-0.5 text-[color:var(--color-accent)]"
                    />
                    <span className="font-serif text-lg text-[color:var(--color-ink)] transition-colors group-hover:text-[color:var(--color-accent)]">
                      {r.title}
                    </span>
                    <span className="h-px flex-1 translate-y-[-3px] border-b border-dotted border-[color:var(--color-line)]" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {recipes.length === 0 && hearted.length === 0 && (
          <p className="mt-6 text-sm text-[color:var(--color-ink-faint)]">
            Nothing here yet — keep turning pages.
          </p>
        )}
      </motion.div>
    </div>
  );
}
