'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { APP_VERSION } from '@/lib/version';
import { fadeTransition } from '@/lib/motion';

const KEY = 'cookcap-whats-new';

const NOTES: Record<string, string[]> = {
  '3.4.1': [
    'Micro moments — heart glow, star sweep, step strike, fly-to-cart',
    'Servings roll · quick-facts settle in · buttons press soft',
  ],
  '3.4.0': [
    'Bigger type · easier taps (44px targets)',
    'Clearer recipe heroes · paper tabs no longer clip',
    'Cover hinge + page flip polish',
  ],
  '3.3.2': [
    'Cover opens like a real book — leather hinge, inside paper, page fan at the edge',
  ],
  '3.3.1': [
    'Dresser feels alive — lamp breathe, dust motes, soft tilt toward the cursor',
    'Drawers pull like wood — break-free glide out, firm thunk close',
  ],
  '3.3.0': [
    'Safer updates — no more blank “client exception” after a deploy',
    'Designed error + missing-page screens',
    'Deeper book shadow · motion tokens from the animation bible',
  ],
  '3.2.1': [
    'Even paper wash — dark skins no more grey/black page split',
    'Warm walnut paper matches wooden desk',
  ],
  '3.2.0': [
    'Wooden reading table — book sits on real wood, not cream desk',
    'Paper tabs stuck to wood · phone wood frame',
    'World table restored — ~790 recipes across family + world chapters',
  ],
  '3.1.0': [
    'Page nav — home, ±5 jump, scrub slider, go-to page #',
  ],
  '3.0.1': ['Honest heroes — guacamole shows guacamole'],
  '3.0.0': [
    'Occasions + week templates',
    'Smart search (“30 min yogurt”) + swap ideas',
    'Print · guest PIN · merge backup · pickles',
  ],
  '2.7.0': ['Cook ritual (mise + glove)', 'Backup restore'],
};

/**
 * One-shot “what’s new” after version change.
 * Compact corner toast — never covers recipe hero/title.
 * Gated on localStorage last-seen version; dismiss persists.
 */
export function WhatsNewSheet() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const bullets = NOTES[APP_VERSION] ?? [`CookCap ${APP_VERSION} is ready.`];

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === APP_VERSION) return;
      /* Defer so first paint shows the book, not the toast. */
      const t = window.setTimeout(() => setOpen(true), reduce ? 80 : 700);
      return () => window.clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, [reduce]);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
          <motion.div
            role="dialog"
            aria-labelledby="whats-new-title"
            initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={fadeTransition(reduce, 200)}
            className="fixed top-[max(4.75rem,calc(env(safe-area-inset-top)+3.75rem))] right-[max(0.75rem,env(safe-area-inset-right))] z-[94] w-[min(17.5rem,calc(100vw-1.5rem))] rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-3 shadow-[var(--shadow-lg)]"
          >
            <h2
              id="whats-new-title"
              className="font-serif text-base text-[color:var(--color-ink)]"
            >
              What’s new · v{APP_VERSION}
            </h2>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-snug text-[color:var(--color-ink-soft)]">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={dismiss}
              className="mt-2.5 min-h-11 w-full rounded-full bg-[color:var(--color-accent)] text-sm font-medium text-white"
            >
              Got it
            </button>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
