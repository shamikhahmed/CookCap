'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { useDialogA11y } from '@/lib/a11y/dialog';
import { PRODUCT_NAME, sanitizeOwnerName } from '@/lib/edition';
import { PRODUCT_TAGLINE } from '@/lib/version';
import { makeProfile } from '@/lib/profiles/types';
import type { ModeId } from '@/lib/profiles/types';

type Step = 'welcome' | 'name' | 'profile' | 'mode';

const QUICK_MODES: { id: ModeId; label: string; blurb: string }[] = [
  { id: 'reader', label: 'Reader', blurb: 'Pure book — no scoring.' },
  { id: 'plate', label: 'My Plate', blurb: 'Macros & goal-fit picks.' },
  { id: 'mother', label: 'Mother', blurb: 'Cook for others safely.' },
];

const STEPS_FIRST: Step[] = ['welcome', 'name', 'profile', 'mode'];

/**
 * First-run gate: value → name → optional profile → optional mode.
 * Rename skips welcome/profile/mode. Book paints first; gate is warm card over desk.
 */
export function NameGate({
  open,
  onSubmit,
  dismissible = false,
  onDismiss,
}: {
  open: boolean;
  onSubmit: (name: string) => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const { upsertProfile, setMode, setActiveProfileId } = useApp();
  const [step, setStep] = useState<Step>(dismissible ? 'name' : 'welcome');
  const [value, setValue] = useState('');
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');

  const handleClose = useCallback(() => {
    if (dismissible) onDismiss?.();
  }, [dismissible, onDismiss]);

  useDialogA11y(open, handleClose, panelRef, { initialFocus: 'none' });

  useEffect(() => {
    if (!open) return;
    setValue('');
    setProfileName('');
    setError('');
    setProfileError('');
    setStep(dismissible ? 'name' : 'welcome');
  }, [open, dismissible]);

  if (!open) return null;

  const submitName = () => {
    const name = sanitizeOwnerName(value);
    if (!name) {
      setError('Enter a first name (or nickname).');
      return;
    }
    if (dismissible) {
      onSubmit(name);
      return;
    }
    setProfileName(name);
    setStep('profile');
  };

  const createProfile = async () => {
    const name = profileName.trim();
    if (!name) {
      setProfileError('Enter a name for this eater.');
      return;
    }
    const profile = makeProfile({ name });
    await upsertProfile(profile);
    setActiveProfileId(profile.id);
    setStep('mode');
  };

  const completeGate = (modeId?: ModeId) => {
    const bookName = sanitizeOwnerName(value);
    if (!bookName) return;
    if (modeId) setMode(modeId);
    onSubmit(bookName);
  };

  const pickMode = (id: ModeId) => completeGate(id);
  const skipToMode = () => setStep('mode');
  const skipAll = () => completeGate();

  const titleId =
    step === 'welcome'
      ? 'name-gate-welcome-title'
      : step === 'name'
        ? 'name-gate-title'
        : step === 'profile'
          ? 'name-gate-profile-title'
          : 'name-gate-mode-title';

  const progressIdx = dismissible ? 0 : STEPS_FIRST.indexOf(step);
  const progressTotal = dismissible ? 1 : STEPS_FIRST.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[color:var(--desk)]/55 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.35 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-6 shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
                {PRODUCT_NAME}
              </p>
              {!dismissible && (
                <p
                  className="text-[10px] tabular-nums text-[color:var(--color-ink-faint)]"
                  aria-label={`Step ${progressIdx + 1} of ${progressTotal}`}
                >
                  {progressIdx + 1}/{progressTotal}
                </p>
              )}
            </div>

            {step === 'welcome' && (
              <>
                <h2
                  id="name-gate-welcome-title"
                  className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-ink)] text-balance"
                >
                  A living family cookbook
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
                  {PRODUCT_TAGLINE} Flip pages, keep favorites, cook offline — recipes stay on this
                  device.
                </p>
                <button
                  type="button"
                  onClick={() => setStep('name')}
                  className="mt-6 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-2.5 font-medium text-white transition-transform active:scale-[0.98]"
                >
                  Begin
                </button>
              </>
            )}

            {step === 'name' && (
              <>
                <h2
                  id="name-gate-title"
                  className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Whose cookbook is this?
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
                  Cover title becomes{' '}
                  <span className="font-serif italic">YourName Cooks</span>. Change later from the
                  ··· menu.
                </p>
                <label
                  className="mt-5 block text-sm text-[color:var(--color-ink-soft)]"
                  htmlFor="cookcap-owner"
                >
                  Your name
                </label>
                <input
                  id="cookcap-owner"
                  type="text"
                  autoComplete="given-name"
                  autoFocus={!dismissible}
                  maxLength={40}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitName();
                    }
                  }}
                  placeholder="e.g. Ayesha"
                  className="mt-1.5 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3.5 py-2.5 text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                />
                {error && (
                  <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={submitName}
                  className="mt-5 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-2.5 font-medium text-white transition-transform active:scale-[0.98]"
                >
                  {dismissible ? 'Save name' : 'Continue'}
                </button>
                {dismissible && (
                  <button
                    type="button"
                    onClick={() => onDismiss?.()}
                    className="mt-2 w-full rounded-xl px-4 py-2 text-sm text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink-soft)]"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            {step === 'profile' && (
              <>
                <h2
                  id="name-gate-profile-title"
                  className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Who eats from this book?
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
                  Optional — add a household eater for plate goals and allergen flags. Skip anytime.
                </p>
                <label
                  className="mt-5 block text-sm text-[color:var(--color-ink-soft)]"
                  htmlFor="cookcap-profile"
                >
                  Name
                </label>
                <input
                  id="cookcap-profile"
                  type="text"
                  maxLength={40}
                  value={profileName}
                  onChange={(e) => {
                    setProfileName(e.target.value);
                    setProfileError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void createProfile();
                    }
                  }}
                  placeholder="e.g. Ayesha"
                  className="mt-1.5 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3.5 py-2.5 text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                />
                {profileError && (
                  <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                    {profileError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void createProfile()}
                  className="mt-5 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-2.5 font-medium text-white transition-transform active:scale-[0.98]"
                >
                  Create profile
                </button>
                <button
                  type="button"
                  onClick={skipToMode}
                  className="mt-2 w-full rounded-xl px-4 py-2 text-sm text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink-soft)]"
                >
                  Skip
                </button>
              </>
            )}

            {step === 'mode' && (
              <>
                <h2
                  id="name-gate-mode-title"
                  className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Pick a mode
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
                  Change anytime from the top bar. Reader keeps the pure book.
                </p>
                <div className="mt-4 space-y-2">
                  {QUICK_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => pickMode(m.id)}
                      className="flex w-full flex-col rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3.5 py-3 text-left transition-colors hover:border-[color:var(--color-accent)]"
                    >
                      <span className="font-medium text-[color:var(--color-ink)]">{m.label}</span>
                      <span className="text-xs text-[color:var(--color-ink-faint)]">{m.blurb}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={skipAll}
                  className="mt-3 w-full rounded-xl px-4 py-2 text-sm text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink-soft)]"
                >
                  Skip — open my book
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
