'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { PRODUCT_NAME } from '@/lib/edition';
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
          transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={!show}
        >
          <p className="font-serif text-3xl font-semibold italic tracking-tight text-[color:var(--color-ink)]">
            {PRODUCT_NAME}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-ink-faint)]">
            v{APP_VERSION}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
