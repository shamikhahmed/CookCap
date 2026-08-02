'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PRODUCT_NAME } from '@/lib/edition';
import { sanitizeOwnerName } from '@/lib/edition';
import { PRODUCT_TAGLINE } from '@/lib/version';
import { useDialogA11y } from '@/lib/a11y/dialog';
import { playBookStamp, playDrawerClose, playDrawerOpen } from '@/lib/sound/dresser';
import { QUICK_MODES, useOnboardingSteps, type OnboardStep } from './onboarding/useOnboardingSteps';

type DrawerId = 'name' | 'profile' | 'mode' | 'reveal';

const DRAWER_FOR_STEP: Partial<Record<OnboardStep, DrawerId>> = {
  name: 'name',
  profile: 'profile',
  mode: 'mode',
  reveal: 'reveal',
};

/**
 * 3D dresser first-run ceremony. Portal z-100. One drawer at a time.
 */
export function DresserOnboarding({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: (name: string) => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const api = useOnboardingSteps(onComplete);
  const muted = !api.soundOn;

  const [drawerOpen, setDrawerOpen] = useState<DrawerId | null>(null);
  const [animating, setAnimating] = useState(false);
  const [bookPhase, setBookPhase] = useState<'hidden' | 'rise' | 'turn' | 'settle' | 'done'>('hidden');

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

  useDialogA11y(open, () => setupLater(), panelRef, {
    initialFocus: step === 'name' || step === 'profile' ? 'first' : 'none',
  });

  /** Sync drawer open state to step with timed open SFX */
  useEffect(() => {
    if (!open) return;
    if (step === 'welcome') {
      setDrawerOpen(null);
      setBookPhase('hidden');
      return;
    }
    const id = DRAWER_FOR_STEP[step];
    if (!id) return;
    setAnimating(true);
    const openT = window.setTimeout(() => {
      setDrawerOpen(id);
      playDrawerOpen(muted);
      setAnimating(false);
    }, 80);
    return () => window.clearTimeout(openT);
  }, [step, open, muted]);

  /** Reveal timeline */
  useEffect(() => {
    if (step !== 'reveal' || !open) return;
    setBookPhase('rise');
    const t1 = window.setTimeout(() => setBookPhase('turn'), 700);
    const t2 = window.setTimeout(() => {
      setBookPhase('settle');
      playBookStamp(muted);
    }, 1400);
    const t3 = window.setTimeout(() => {
      setBookPhase('done');
      completeReveal();
    }, 2360);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [step, open, muted, completeReveal]);

  const closeThen = useCallback(
    (next: () => void) => {
      if (animating) return;
      setAnimating(true);
      playDrawerClose(muted);
      setDrawerOpen(null);
      window.setTimeout(() => {
        next();
        setAnimating(false);
      }, 380 + 80);
    },
    [animating, muted],
  );

  if (!open || typeof document === 'undefined') return null;

  const titleId = `dresser-${step}-title`;
  const showBack = step === 'name' || step === 'profile' || step === 'mode';
  const bookTitle = previewName ? `${previewName} Cooks` : 'Our Family Cookbook';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-overlay
          className="dresser-scene fixed inset-0 z-[100] flex flex-col overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.4 }}
        >
          <div className="dresser-scrim" aria-hidden />

          <header className="relative z-20 flex items-center justify-between gap-3 px-5 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <p className="font-serif text-sm font-semibold italic text-[color:var(--color-ink)]">
              {PRODUCT_NAME}
            </p>
            <p className="text-[0.65rem] tabular-nums text-[color:var(--color-ink-faint)]" aria-live="polite">
              {progressLabel}
            </p>
            <button
              type="button"
              onClick={setupLater}
              className="min-h-11 rounded-lg px-2 text-xs text-[color:var(--color-ink-faint)]"
            >
              Set up later
            </button>
          </header>

          {/* Visually hidden live region for a11y; dresser is aria-hidden */}
          <div className="sr-only" aria-live="polite">
            {step === 'welcome' && 'Welcome to CookCap'}
            {step === 'name' && 'What should we call this cookbook?'}
            {step === 'profile' && 'Who eats from this book?'}
            {step === 'mode' && 'How do you like to cook?'}
            {step === 'reveal' && `Opening ${bookTitle}`}
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-center">
            <div className="dresser-stage" aria-hidden={step !== 'welcome'}>
              {/* Lamp */}
              <div className="dresser-lamp" />

              {/* Welcome plate on top */}
              {step === 'welcome' && (
                <motion.div
                  className="dresser-plate"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
                    {PRODUCT_NAME} · a living family cookbook
                  </p>
                  <h1
                    id={titleId}
                    className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-ink)] sm:text-3xl"
                  >
                    A living family cookbook
                  </h1>
                  <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">{PRODUCT_TAGLINE}</p>
                  <button
                    type="button"
                    onClick={submitWelcome}
                    className="mt-5 min-h-11 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-white"
                  >
                    Begin
                  </button>
                </motion.div>
              )}

              {/* Dresser body */}
              <div
                className={`dresser-body ${step === 'reveal' && bookPhase !== 'hidden' ? 'dresser-body--recede' : ''}`}
                aria-hidden
              >
                {(['name', 'profile', 'mode', 'reveal'] as DrawerId[]).map((id, i) => {
                  const isOpen = drawerOpen === id;
                  const isReveal = id === 'reveal';
                  return (
                    <div
                      key={id}
                      className={`dresser-drawer ${isOpen ? 'is-open' : ''} ${isReveal ? 'dresser-drawer--deep' : ''}`}
                      style={{ '--drawer-i': i } as CSSProperties}
                    >
                      <div className="dresser-drawer__face">
                        <span className="dresser-handle" />
                      </div>
                      <div className="dresser-drawer__cavity">
                        <div className="dresser-velvet" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Question card (a11y focusable — not aria-hidden) */}
              <AnimatePresence mode="wait">
                {drawerOpen === 'name' && step === 'name' && (
                  <VelvetCard key="name" titleId={titleId} title="What should we call this cookbook?">
                    <p className="font-serif text-2xl italic text-[color:var(--color-ink)]" aria-live="polite">
                      {previewName || 'Your name'}{' '}
                      <span className="text-[color:var(--color-ink-faint)]">Cooks</span>
                    </p>
                    <label className="mt-4 block text-sm text-[color:var(--color-ink-soft)]" htmlFor="dresser-name">
                      Your name
                    </label>
                    <input
                      id="dresser-name"
                      type="text"
                      autoFocus
                      maxLength={40}
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!sanitizeOwnerName(ownerName)) {
                            api.setError('Enter a first name (or nickname).');
                            return;
                          }
                          closeThen(() => {
                            submitName();
                          });
                        }
                      }}
                      placeholder="e.g. Ayesha"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3.5 py-2.5"
                    />
                    {error && (
                      <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={animating}
                      onClick={() => {
                        if (!sanitizeOwnerName(ownerName)) {
                          api.setError('Enter a first name (or nickname).');
                          return;
                        }
                        closeThen(() => {
                          submitName();
                        });
                      }}
                      className="mt-4 min-h-11 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-white"
                    >
                      Continue
                    </button>
                  </VelvetCard>
                )}

                {drawerOpen === 'profile' && step === 'profile' && (
                  <VelvetCard key="profile" titleId={titleId} title="Who eats from this book?">
                    <p className="text-sm text-[color:var(--color-ink-soft)]">
                      Optional — plate goals and allergen flags.
                    </p>
                    <label className="mt-4 block text-sm" htmlFor="dresser-profile">
                      Name
                    </label>
                    <input
                      id="dresser-profile"
                      type="text"
                      maxLength={40}
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Ayesha"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3.5 py-2.5"
                    />
                    {profileError && (
                      <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                        {profileError}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={busy || animating}
                      onClick={() =>
                        closeThen(() => {
                          void createProfile();
                        })
                      }
                      className="mt-4 min-h-11 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-white"
                    >
                      Create profile
                    </button>
                    <button
                      type="button"
                      disabled={animating}
                      onClick={() => closeThen(skipProfile)}
                      className="mt-2 min-h-11 w-full text-sm text-[color:var(--color-ink-faint)]"
                    >
                      Skip
                    </button>
                  </VelvetCard>
                )}

                {drawerOpen === 'mode' && step === 'mode' && (
                  <VelvetCard key="mode" titleId={titleId} title="How do you like to cook?">
                    <div className="space-y-2">
                      {QUICK_MODES.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          disabled={animating}
                          onClick={() => closeThen(() => pickMode(m.id))}
                          className="flex min-h-11 w-full flex-col rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2.5 text-left"
                        >
                          <span className="font-medium text-[color:var(--color-ink)]">{m.label}</span>
                          <span className="text-xs text-[color:var(--color-ink-faint)]">{m.blurb}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={animating}
                      onClick={() => closeThen(skipMode)}
                      className="mt-3 min-h-11 w-full text-sm text-[color:var(--color-ink-faint)]"
                    >
                      Skip — open my book
                    </button>
                  </VelvetCard>
                )}
              </AnimatePresence>

              {/* Rising cookbook */}
              {step === 'reveal' && bookPhase !== 'hidden' && (
                <div className={`dresser-book dresser-book--${bookPhase}`}>
                  <div className="dresser-book__cover">
                    <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/70">A Family Cookbook</p>
                    <p className="foil-sweep-inline mt-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
                      {bookTitle}
                    </p>
                    <p className="mt-2 text-xs text-white/60">Made & Kept with Love</p>
                  </div>
                </div>
              )}
            </div>

            {showBack && (
              <button
                type="button"
                disabled={animating}
                onClick={() => closeThen(goBack)}
                className="relative z-20 mt-3 min-h-11 text-sm text-[color:var(--color-ink-faint)]"
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

function VelvetCard({
  titleId,
  title,
  children,
}: {
  titleId: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="dresser-card"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 id={titleId} className="font-serif text-xl font-semibold text-[color:var(--color-ink)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </motion.div>
  );
}
