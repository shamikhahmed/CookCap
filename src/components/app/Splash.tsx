'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { PRODUCT_NAME } from '@/lib/edition';
import { splashTransition } from '@/lib/motion';
import { APP_VERSION } from '@/lib/version';

/**
 * Quiet launch mark — dissolves when the book store is ready.
 * Duration = real load only (not a fake timer floor beyond a short min for polish).
 */
export function Splash() {
  const { ready, editionReady } = useApp();
  const reduce = useReducedMotion();
  const [show, setShow] = useState(true);
  const [started] = useState(() =>
    typeof performance !== 'undefined' ? performance.now() : 0,
  );

  useEffect(() => {
    if (!ready || !editionReady) return;
    const elapsed = performance.now() - started;
    // Min ~280ms so mark can read; max wait already = ready.
    const wait = reduce ? 0 : Math.max(0, 280 - elapsed);
    const t = window.setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem('cookcap-splash-ms', String(Math.round(performance.now() - started)));
      } catch {
        /* ignore */
      }
    }, wait);
    return () => window.clearTimeout(t);
  }, [ready, editionReady, started, reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[color:var(--desk,var(--color-paper-sunk))]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={splashTransition(reduce)}
          aria-hidden={!show}
        >
          <motion.p
            className="font-serif text-3xl font-semibold italic tracking-tight text-[color:var(--color-ink)]"
            initial={reduce ? false : { opacity: 0.92, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={splashTransition(reduce)}
          >
            {PRODUCT_NAME}
          </motion.p>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[color:var(--color-ink-faint)]">
            v{APP_VERSION}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
