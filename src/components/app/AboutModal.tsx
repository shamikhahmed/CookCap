'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useDialogA11y, motionReduce } from '@/lib/a11y/dialog';
import { PRODUCT_NAME } from '@/lib/edition';
import { APP_VERSION, PRODUCT_TAGLINE, SW_CACHE } from '@/lib/version';
import * as store from '@/lib/db/store';
import { useGuest } from '@/components/app/GuestMode';

/**
 * About / version / privacy / export / import / wipe / local stats.
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [stats, setStats] = useState<Awaited<ReturnType<typeof store.getLocalStats>> | null>(null);
  const { hasPin, setPin, clearPin, enterGuest, exitGuest, guestActive } = useGuest();

  useDialogA11y(open, onClose, panelRef);

  useEffect(() => {
    if (!open) return;
    setMsg('');
    setConfirmWipe(false);
    void store.getLocalStats().then(setStats).catch(() => setStats(null));
  }, [open]);

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
      a.download = `cookcap-backup-${APP_VERSION}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Backup downloaded (JSON — includes photos as base64).');
    } catch {
      setMsg('Export failed on this device.');
    } finally {
      setBusy(false);
    }
  }, []);

  const importData = useCallback(async (file: File) => {
    setBusy(true);
    setMsg('');
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as store.UserSnapshot;
      if (!payload || typeof payload !== 'object') throw new Error('bad');
      await store.importUserSnapshot(payload, mergeMode ? 'merge' : 'replace');
      setMsg(mergeMode ? 'Backup merged. Reloading…' : 'Backup restored. Reloading…');
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setMsg('Could not restore that file. Use a CookCap export JSON.');
      setBusy(false);
    }
  }, [mergeMode]);

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
              Version {APP_VERSION} · cache {SW_CACHE}
            </p>

            <section className="mt-5 space-y-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                Privacy
              </h3>
              <p>
                Everything stays on your device — favorites, notes, profiles, diary, pantry,
                shopping, photos. No accounts. No analytics. No network required after the first
                load.
              </p>
            </section>

            {stats && (
              <section className="mt-5 space-y-2 text-sm text-[color:var(--color-ink-soft)]">
                <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                  On this device
                </h3>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <li>Favorites · {stats.favorites}</li>
                  <li>Imports · {stats.customs}</li>
                  <li>Notes · {stats.notes}</li>
                  <li>Ratings · {stats.ratings}</li>
                  <li>Collections · {stats.collections}</li>
                  <li>Diary · {stats.diary}</li>
                  <li>Pantry · {stats.pantry}</li>
                  <li>Shopping · {stats.shopping}</li>
                  <li>Photos · {stats.heroes}</li>
                  <li>Cover · {stats.hasCover ? 'yes' : 'no'}</li>
                </ul>
                <p className="text-xs text-[color:var(--color-ink-faint)]">
                  Storage · {stats.dbName}
                </p>
              </section>
            )}

            <section className="mt-5 space-y-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                Licenses
              </h3>
              <p>
                App © Cap family. Recipe photos are stock or generated art — not certified food
                photography. Fonts: Fraunces, Inter, Caveat (open licenses).
              </p>
            </section>

            <section className="mt-6 border-t border-[color:var(--color-line)] pt-5">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                Backup &amp; data
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={exportData}
                  className="min-h-11 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-2.5 text-left text-sm text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] disabled:opacity-40"
                >
                  Download backup (JSON)
                </button>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[color:var(--color-ink-soft)]">
                  <input
                    type="checkbox"
                    checked={mergeMode}
                    onChange={(e) => setMergeMode(e.target.checked)}
                    className="size-4 accent-[color:var(--color-accent)]"
                  />
                  Merge on restore (keep existing rows)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importData(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={busy || guestActive}
                  onClick={() => fileRef.current?.click()}
                  className="min-h-11 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-2.5 text-left text-sm text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] disabled:opacity-40"
                >
                  Restore backup…
                </button>

                <div className="rounded-xl border border-[color:var(--color-line)] p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                    Guest PIN
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
                    Hand the device to a guest — browsing only. Not strong security.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="4+ digits"
                      value={pinDraft}
                      onChange={(e) => setPinDraft(e.target.value)}
                      className="min-h-11 flex-1 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 text-sm"
                    />
                    {!hasPin ? (
                      <button
                        type="button"
                        className="min-h-11 rounded-full border border-[color:var(--color-line)] px-3 text-sm"
                        onClick={() => {
                          setPin(pinDraft);
                          setPinDraft('');
                          setMsg('Guest PIN saved on this device.');
                        }}
                      >
                        Set PIN
                      </button>
                    ) : guestActive ? (
                      <button
                        type="button"
                        className="min-h-11 rounded-full border border-[color:var(--color-line)] px-3 text-sm"
                        onClick={() => {
                          exitGuest();
                          setMsg('Guest view off.');
                        }}
                      >
                        Exit guest
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="min-h-11 rounded-full border border-[color:var(--color-line)] px-3 text-sm"
                          onClick={() => {
                            if (enterGuest(pinDraft)) {
                              setPinDraft('');
                              setMsg('Guest view on.');
                            } else setMsg('PIN did not match.');
                          }}
                        >
                          Enter guest
                        </button>
                        <button
                          type="button"
                          className="min-h-11 rounded-full px-2 text-xs text-[color:var(--color-ink-faint)]"
                          onClick={() => {
                            clearPin();
                            setMsg('Guest PIN cleared.');
                          }}
                        >
                          Clear PIN
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!confirmWipe ? (
                  <button
                    type="button"
                    disabled={busy || guestActive}
                    onClick={() => setConfirmWipe(true)}
                    className="min-h-11 rounded-xl border border-[color:var(--color-danger)]/40 px-4 py-2.5 text-left text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10 disabled:opacity-40"
                  >
                    Delete all local data…
                  </button>
                ) : (
                  <div className="rounded-xl border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/5 p-3">
                    <p className="text-sm text-[color:var(--color-ink)]">
                      This permanently erases favorites, notes, ratings, meal plan, shopping list,
                      imported recipes, profiles, diary, pantry, photos, and settings on this
                      device. Cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={wipeData}
                        className="min-h-11 rounded-lg bg-[color:var(--color-danger)] px-3 py-2 text-sm text-white disabled:opacity-40"
                      >
                        Yes, delete everything
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmWipe(false)}
                        className="min-h-11 rounded-lg px-3 py-2 text-sm text-[color:var(--color-ink-soft)]"
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
              className="mt-6 min-h-11 w-full rounded-xl bg-[color:var(--color-paper-sunk)] py-2.5 text-sm font-medium text-[color:var(--color-ink)]"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
