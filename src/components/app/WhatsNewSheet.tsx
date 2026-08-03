'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { APP_VERSION } from '@/lib/version';
import { fadeTransition } from '@/lib/motion';

const KEY = 'cookcap-whats-new';

const NOTES: Record<string, string[]> = {
  '3.0.0': [
    'Occasions + week templates',
    'Smart search (“30 min yogurt”) + swap ideas',
    'Print · guest PIN · merge backup · pickles',
  ],
  '2.7.0': ['Cook ritual (mise + glove)', 'Backup restore'],
};

/** One-shot “what’s new” after SW bump / version change. */
export function WhatsNewSheet() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const bullets = NOTES[APP_VERSION] ?? [`CookCap ${APP_VERSION} is ready.`];

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === APP_VERSION) return;
      setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-labelledby="whats-new-title"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition(reduce, 200)}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[94] w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-4 shadow-[var(--shadow-lg)]"
        >
          <h2 id="whats-new-title" className="font-serif text-lg text-[color:var(--color-ink)]">
            What’s new · v{APP_VERSION}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--color-ink-soft)]">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 min-h-11 w-full rounded-full bg-[color:var(--color-accent)] text-sm font-medium text-white"
          >
            Got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
