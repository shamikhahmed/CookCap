'use client';

import { motion } from 'motion/react';
import { FRIENDS } from '@/lib/friends';
import { CharacterArt } from '@/components/art/CharacterArt';

/**
 * "Meet the Kitchen Friends" — the charming introduction spread. Each friend
 * gets their portrait, name, job, and a one-line personality. They appear
 * again through the book (loading states, empty states) so this page teaches
 * the cast you'll keep bumping into.
 */
export function FriendsLeaf() {
  return (
    <div
      data-leaf-scroll
      className="paper-grain flex min-h-full h-full w-full flex-col overflow-y-auto overscroll-contain px-[7%] py-[8%]"
    >
      <header className="relative z-[1] mb-5 shrink-0 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--color-ink-faint)]">
          Before we begin
        </p>
        <h2 className="mt-1 font-serif text-3xl font-bold text-[color:var(--color-ink)]">
          Meet the Kitchen Friends
        </h2>
        <p className="mx-auto mt-2 max-w-sm font-serif italic text-[color:var(--color-ink-soft)]">
          They live in this kitchen and lend a hand on every page.
        </p>
      </header>

      <ul className="relative z-[1] grid grid-cols-2 gap-x-4 gap-y-5 pb-2">
        {FRIENDS.map((f, i) => (
          <motion.li
            key={f.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              whileHover={{ y: -4, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="grid place-items-center rounded-3xl p-2"
              style={{ background: `${f.color}18` }}
            >
              <CharacterArt id={f.id} color={f.color} size={76} />
            </motion.div>
            <h3 className="mt-2 font-serif text-lg font-semibold leading-tight text-[color:var(--color-ink)]">
              {f.name}
            </h3>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: f.color }}>
              {f.role}
            </p>
            <p className="mt-0.5 text-xs italic text-[color:var(--color-ink-faint)] text-balance">
              {f.personality}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
