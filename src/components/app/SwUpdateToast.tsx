'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { fadeTransition } from '@/lib/motion';

/**
 * When a new SW waits, offer reload — skipWaiting then controllerchange → reload.
 */
export function SwUpdateToast() {
  const reduce = useReducedMotion();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const watch = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg || cancelled) return;

        const arm = (sw: ServiceWorker | null) => {
          if (sw && sw.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(sw);
          }
        };
        arm(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              setWaiting(sw);
            }
          });
        });
      } catch {
        /* ignore */
      }
    };

    void watch();
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = () => {
    if (!waiting) return;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    const onChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange, { once: true });
    // Fallback if already controlling
    window.setTimeout(() => window.location.reload(), 800);
  };

  return (
    <AnimatePresence>
      {waiting && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: reduce ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -8 }}
          transition={fadeTransition(reduce, 200)}
          className="fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[95] flex max-w-[min(92vw,22rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 shadow-[var(--shadow-lg)]"
        >
          <p className="min-w-0 flex-1 text-sm text-[color:var(--color-ink)]">
            New kitchen ready — reload for updates.
          </p>
          <button
            type="button"
            onClick={reload}
            className="min-h-11 shrink-0 rounded-full bg-[color:var(--color-accent)] px-3 text-sm font-medium text-white"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => setWaiting(null)}
            className="min-h-11 shrink-0 rounded-full px-2 text-sm text-[color:var(--color-ink-faint)]"
            aria-label="Dismiss"
          >
            Later
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
