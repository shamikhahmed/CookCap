'use client';

import { useEffect, useState } from 'react';

const HIDE_MS = 4500;

/**
 * Quiet connectivity banner under the header — offline cooking still works.
 * Auto-hides after a few seconds; role=status for screen readers.
 */
export function OfflineChip() {
  const [online, setOnline] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const on = navigator.onLine;
      setOnline(on);
      if (!on) setVisible(true);
    };
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    if (online || !visible) return;
    const t = window.setTimeout(() => setVisible(false), HIDE_MS);
    return () => window.clearTimeout(t);
  }, [online, visible]);

  if (online || !visible) return null;

  return (
    <div
      role="status"
      data-offline-banner=""
      className="relative z-[55] shrink-0 border-b border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)] px-4 py-1.5 text-center text-xs font-medium text-[color:var(--color-ink-soft)]"
    >
      Offline — book still works on this device
    </div>
  );
}
