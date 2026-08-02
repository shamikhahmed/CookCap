'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PRODUCT_NAME } from '@/lib/edition';
import { PRODUCT_TAGLINE } from '@/lib/version';
import { useDialogA11y } from '@/lib/a11y/dialog';
import { QUICK_MODES, useOnboardingSteps } from './onboarding/useOnboardingSteps';

/**
 * Reduced-motion / simple first-run — full-bleed calm steps, same logic as dresser.
 */
export function OnboardingFlow({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: (name: string) => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const api = useOnboardingSteps(onComplete);
  const {
    step,
    ownerName,
    setOwnerName,
    profileName,
    setProfileName,
    error,
    profileError,
    busy,
    progressLabel,
    previewName,
    goBack,
    submitWelcome,
    submitName,
    createProfile,
    skipProfile,
    pickMode,
    skipMode,
    setupLater,
    completeReveal,
  } = api;

  useDialogA11y(open, setupLater, panelRef, { initialFocus: 'none' });

  useEffect(() => {
    if (step === 'reveal') {
      const t = window.setTimeout(() => completeReveal(), reduce ? 200 : 400);
      return () => window.clearTimeout(t);
    }
  }, [step, completeReveal, reduce]);

  if (!open || typeof document === 'undefined') return null;

  const titleId = `onboard-${step}-title`;
  const showBack = step === 'name' || step === 'profile' || step === 'mode';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-overlay
          className="fixed inset-0 z-[100] flex flex-col bg-[color:var(--desk,#ebe4d4)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.35 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 50% 20%, color-mix(in srgb, var(--color-paper-raised) 80%, transparent), transparent 70%)',
            }}
            aria-hidden
          />

          <header className="relative z-10 flex items-center justify-between gap-3 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="font-serif text-sm font-semibold italic text-[color:var(--color-ink)]">
              {PRODUCT_NAME}
            </p>
            <p className="text-[0.65rem] tabular-nums text-[color:var(--color-ink-faint)]" aria-live="polite">
              {progressLabel}
            </p>
          </header>

          <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {step === 'welcome' && (
              <div>
                <h1
                  id={titleId}
                  className="font-serif text-3xl font-semibold leading-tight text-[color:var(--color-ink)] text-balance sm:text-4xl"
                >
                  A living family cookbook
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
                  {PRODUCT_TAGLINE}
                </p>
                <button
                  type="button"
                  onClick={submitWelcome}
                  className="mt-8 min-h-11 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-white"
                >
                  Begin
                </button>
                <button
                  type="button"
                  onClick={setupLater}
                  className="mt-2 min-h-11 w-full rounded-xl px-4 py-2 text-sm text-[color:var(--color-ink-faint)]"
                >
                  Set up later
                </button>
              </div>
            )}

            {step === 'name' && (
              <div>
                <h2 id={titleId} className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]">
                  Whose cookbook is this?
                </h2>
                <p
                  className="mt-4 font-serif text-3xl italic text-[color:var(--color-ink)]"
                  aria-live="polite"
                >
                  {previewName || 'Your name'}{' '}
                  <span className="text-[color:var(--color-ink-faint)]">Cooks</span>
                </p>
                <label className="mt-6 block text-sm text-[color:var(--color-ink-soft)]" htmlFor="onboard-name">
                  Your name
                </label>
                <input
                  id="onboard-name"
                  type="text"
                  autoComplete="given-name"
                  autoFocus
                  maxLength={40}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitName();
                    }
                  }}
                  placeholder="e.g. Ayesha"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3.5 py-2.5 text-[color:var(--color-ink)]"
                />
                {error && (
                  <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => submitName()}
                  className="mt-6 min-h-11 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-white"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 'profile' && (
              <div>
                <h2 id={titleId} className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]">
                  Who eats from this book?
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
                  Optional — household eater for plate goals and allergen flags.
                </p>
                <label className="mt-5 block text-sm text-[color:var(--color-ink-soft)]" htmlFor="onboard-profile">
                  Name
                </label>
                <input
                  id="onboard-profile"
                  type="text"
                  maxLength={40}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void createProfile();
                    }
                  }}
                  placeholder="e.g. Ayesha"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3.5 py-2.5"
                />
                {profileError && (
                  <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                    {profileError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createProfile()}
                  className="mt-6 min-h-11 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  Create profile
                </button>
                <button type="button" onClick={skipProfile} className="mt-2 min-h-11 w-full text-sm text-[color:var(--color-ink-faint)]">
                  Skip
                </button>
              </div>
            )}

            {step === 'mode' && (
              <div>
                <h2 id={titleId} className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]">
                  How do you like to cook?
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">Change anytime from the top bar.</p>
                <div className="mt-4 space-y-2">
                  {QUICK_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => pickMode(m.id)}
                      className="flex min-h-11 w-full flex-col rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-4 py-3 text-left hover:border-[color:var(--color-accent)]"
                    >
                      <span className="font-medium text-[color:var(--color-ink)]">{m.label}</span>
                      <span className="text-xs text-[color:var(--color-ink-faint)]">{m.blurb}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={skipMode} className="mt-3 min-h-11 w-full text-sm text-[color:var(--color-ink-faint)]">
                  Skip — open my book
                </button>
              </div>
            )}

            {step === 'reveal' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <p id={titleId} className="font-serif text-3xl font-semibold italic text-[color:var(--color-ink)]">
                  {previewName || 'Our Family'} Cooks
                </p>
                <p className="mt-2 text-sm text-[color:var(--color-ink-faint)]">Opening your book…</p>
              </motion.div>
            )}

            {showBack && (
              <button
                type="button"
                onClick={goBack}
                className="mt-4 min-h-11 self-start text-sm text-[color:var(--color-ink-faint)]"
              >
                ← Back
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
