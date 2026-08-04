'use client';

import { useEffect, useState } from 'react';

/** Quiet connectivity chip — offline cooking still works from cache. */
export function OfflineChip() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[90] -translate-x-1/2 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-ink-soft)] shadow-[var(--shadow-md)]"
    >
      Offline — book still works on this device
    </div>
  );
}
