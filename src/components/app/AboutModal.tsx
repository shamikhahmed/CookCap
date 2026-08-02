'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useDialogA11y, motionReduce } from '@/lib/a11y/dialog';
import { PRODUCT_NAME } from '@/lib/edition';
import { APP_VERSION, PRODUCT_TAGLINE } from '@/lib/version';
import * as store from '@/lib/db/store';

/**
 * About / version / privacy / export / delete — ··· menu bottom.
 */
export function AboutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  useDialogA11y(open, onClose, panelRef);

  const exportData = useCallback(async () => {
    setBusy(true);
    setMsg('');
    try {
      const idb = await store.exportUserSnapshot();
      const payload = {
        exportedAt: new Date().toISOString(),
        app: PRODUCT_NAME,
        version: APP_VERSION,
        localStorage: Object.fromEntries(
          Object.keys(localStorage)
            .filter((k) => k.startsWith('cookcap-') || k.startsWith('jia-') || k.startsWith('grimoire-'))
            .map((k) => [k, localStorage.getItem(k)]),
        ),
        ...idb,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookcap-export-${APP_VERSION}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Export downloaded.');
    } catch {
      setMsg('Export failed on this device.');
    } finally {
      setBusy(false);
    }
  }, []);

  const wipeData = useCallback(async () => {
    setBusy(true);
    setMsg('');
    try {
      const keys = Object.keys(localStorage).filter(
        (k) => k.startsWith('cookcap-') || k.startsWith('jia-') || k.startsWith('grimoire-'),
      );
      for (const k of keys) localStorage.removeItem(k);
      await store.clearAllUserData();
      setMsg('All local data cleared. Reloading…');
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setMsg('Could not clear everything. Try clearing site data in the browser.');
      setBusy(false);
    }
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
        >
          <button
            type="button"
            aria-label="Close about"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={motionReduce(reduce)}
            className="relative z-10 max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-6 shadow-[var(--shadow-lg)] sm:rounded-2xl"
          >
            <h2
              id="about-title"
              className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
            >
              About {PRODUCT_NAME}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{PRODUCT_TAGLINE}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
              Version {APP_VERSION}
            </p>

            <section className="mt-5 space-y-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              <h3 className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                Privacy
              </h3>
              <p>
                Everything stays on your device — favorites, notes, profiles, diary, pantry,
                shopping. No accounts. No analytics. No network required after the first load.
              </p>
            </section>

            <section className="mt-5 space-y-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              <h3 className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                Licenses
              </h3>
              <p>
                App © Cap family. Recipe photos are stock or generated art — not certified food
                photography. Fonts: Fraunces, Inter, Caveat (open licenses).
              </p>
            </section>

            <section className="mt-6 border-t border-[color:var(--color-line)] pt-5">
              <h3 className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                Privacy &amp; data
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={exportData}
                  className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-2.5 text-left text-sm text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] disabled:opacity-40"
                >
                  Export my data (JSON)
                </button>
                {!confirmWipe ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmWipe(true)}
                    className="rounded-xl border border-[color:var(--color-danger)]/40 px-4 py-2.5 text-left text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10 disabled:opacity-40"
                  >
                    Delete all local data…
                  </button>
                ) : (
                  <div className="rounded-xl border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/5 p-3">
                    <p className="text-sm text-[color:var(--color-ink)]">
                      This permanently erases favorites, notes, profiles, diary, pantry, and
                      settings on this device. Cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={wipeData}
                        className="rounded-lg bg-[color:var(--color-danger)] px-3 py-2 text-sm text-white disabled:opacity-40"
                      >
                        Yes, delete everything
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmWipe(false)}
                        className="rounded-lg px-3 py-2 text-sm text-[color:var(--color-ink-soft)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {msg && (
                <p className="mt-2 text-xs text-[color:var(--color-ink-faint)]" role="status">
                  {msg}
                </p>
              )}
            </section>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-[color:var(--color-paper-sunk)] py-2.5 text-sm font-medium text-[color:var(--color-ink)]"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
