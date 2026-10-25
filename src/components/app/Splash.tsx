'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { PRODUCT_NAME } from '@/lib/edition';
import { splashTransition } from '@/lib/motion';
import { APP_VERSION } from '@/lib/version';

const MAX_AFTER_READY_MS = 1000;
const MIN_HOLD_MS = 280;
const EXIT_MS = 400;

/**
 * Quiet launch mark — dissolves when the book store is ready.
 * `__APP_READY__` fires when the splash starts to hide (book already rendered behind it).
 * Never lingers more than 1s after the store is ready.
 */
export function Splash() {
  const { ready, editionReady } = useApp();
  const reduce = useReducedMotion();
  const [show, setShow] = useState(true);
  const [started] = useState(() =>
    typeof performance !== 'undefined' ? performance.now() : 0,
  );
  const marked = useRef(false);

  const markReady = useCallback(() => {
    if (marked.current) return;
    marked.current = true;
    try {
      sessionStorage.setItem('cookcap-splash-ms', String(Math.round(performance.now() - started)));
      (window as Window & { __APP_READY__?: boolean }).__APP_READY__ = true;
      document.documentElement.dataset.appReady = 'true';
    } catch {
      /* ignore */
    }
  }, [started]);

  useEffect(() => {
    if (!ready || !editionReady) return;
    const exitMs = reduce ? 80 : EXIT_MS;
    const elapsed = performance.now() - started;
    const holdBudget = Math.max(0, MAX_AFTER_READY_MS - exitMs);
    const hold = reduce ? 0 : Math.max(0, Math.min(MIN_HOLD_MS, holdBudget) - elapsed);

    // The book is rendered behind the splash once the store is ready — signal then, not after the fade
    const hideTimer = window.setTimeout(() => {
      setShow(false);
      markReady();
    }, hold);
    const hardTimer = window.setTimeout(() => {
      setShow(false);
      markReady();
    }, MAX_AFTER_READY_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(hardTimer);
    };
  }, [ready, editionReady, started, reduce, markReady]);

  return (
    <AnimatePresence onExitComplete={markReady}>
      {show && (
        <motion.div
          data-splash=""
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
