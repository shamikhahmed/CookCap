'use client';

import { useEffect } from 'react';

const CHUNK_RE =
  /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module/i;
const FLAG = 'cookcap-chunk-reload';

/**
 * Self-heal stale-SW chunk mismatch via one reload on ChunkLoadError /
 * failed dynamic import. SW controllerchange reload lives in SwUpdateToast
 * (user Reload) so first-install claim does not loop.
 */
export function ChunkRecovery() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reloadOnce = (reason: string) => {
      try {
        if (sessionStorage.getItem(FLAG) === '1') return;
        sessionStorage.setItem(FLAG, '1');
      } catch {
        /* private mode */
      }
      console.warn('[CookCap] recovery reload:', reason);
      window.location.reload();
    };

    const clearTimer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(FLAG);
      } catch {
        /* ignore */
      }
    }, 12_000);

    const onError = (e: ErrorEvent) => {
      const msg = e.message || '';
      if (CHUNK_RE.test(msg)) reloadOnce(msg);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg =
        typeof reason === 'string'
          ? reason
          : reason?.message || String(reason ?? '');
      if (CHUNK_RE.test(msg)) reloadOnce(msg);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
