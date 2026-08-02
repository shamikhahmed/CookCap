'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PRODUCT_NAME } from '@/lib/edition';
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
  const [bookPhase, setBookPhase] = useState<'hidden' | 'rise' | 'turn' | 'settle' | 'handoff' | 'done'>(
    'hidden',
  );
  const [recede, setRecede] = useState(false);
  const [handoffStyle, setHandoffStyle] = useState<CSSProperties | undefined>();
  const prevStep = useRef<OnboardStep | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);

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

  useDialogA11y(open, setupLater, panelRef, {
    initialFocus: 'none',
  });

  /** Step owns drawers: close prior → open next (SFX when sound on). */
  useEffect(() => {
    if (!open) return;
    if (step === 'welcome') {
      setDrawerOpen(null);
      setBookPhase('hidden');
      setRecede(false);
      prevStep.current = step;
      return;
    }
    const id = DRAWER_FOR_STEP[step];
    if (!id) return;

    const switching = prevStep.current !== null && prevStep.current !== step;
    prevStep.current = step;
    setAnimating(true);

    let openT = 0;
    const closeMs = switching ? 380 + 120 : 0;
    if (switching) {
      playDrawerClose(muted);
      setDrawerOpen(null);
    }
    openT = window.setTimeout(() => {
      setDrawerOpen(id);
      playDrawerOpen(muted);
      setAnimating(false);
    }, closeMs + (switching ? 0 : 80));

    return () => window.clearTimeout(openT);
  }, [step, open, muted]);

  /** Reveal → table timeline (plan-dresser-world Part 2 §A). t=0 at reveal step. */
  useEffect(() => {
    if (step !== 'reveal' || !open) return;
    if (reduce) {
      const t = window.setTimeout(() => completeReveal(), 200);
      return () => window.clearTimeout(t);
    }

    // t=0–140: reveal drawer already opening via step effect (--dr-z)
    setBookPhase('hidden');
    setRecede(false);
    setHandoffStyle(undefined);

    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    // t=140: book rises from drawer mouth
    later(140, () => setBookPhase('rise'));
    // t=1040: turn to face
    later(1040, () => setBookPhase('turn'));
    // t=1400: dresser sinks into table + wood stamp
    later(1400, () => {
      setRecede(true);
      playBookStamp(muted);
    });
    // t=1740: descend onto table (settle + contact shadow)
    later(1740, () => setBookPhase('settle'));
    // t=2100: FLIP onto .book-frame
    later(2100, () => {
      const frame = document.querySelector('.book-frame');
      const rising = bookRef.current;
      if (frame instanceof HTMLElement && rising) {
        const b = frame.getBoundingClientRect();
        setBookPhase('handoff');
        setHandoffStyle({
          left: `${b.left}px`,
          top: `${b.top}px`,
          width: `${b.width}px`,
          height: `${b.height}px`,
          opacity: 1,
        });
      } else {
        setBookPhase('done');
      }
    });
    // t=2360: crossfade out + signal paper-tab peel
    later(2360, () => {
      setBookPhase('done');
      setHandoffStyle((s) => (s ? { ...s, opacity: 0 } : s));
      try {
        sessionStorage.setItem('cookcap-tabs-peel', '1');
      } catch {
        /* private */
      }
      window.dispatchEvent(new Event('cookcap-tabs-peel'));
    });
    // t=2760: reading world live
    later(2760, () => completeReveal());

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [step, open, muted, completeReveal, reduce]);

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
            <div className="dresser-stage">
              {/* Lamp + drawers = decoration only */}
              <div className="dresser-lamp" aria-hidden />

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

              {/* Dresser body — true 3D pull-out drawers */}
              <div
                className={`dresser-body ${recede ? 'dresser-body--recede' : ''}`}
                aria-hidden={step === 'welcome'}
              >
                {(['name', 'profile', 'mode', 'reveal'] as DrawerId[]).map((id) => {
                  const isOpen = drawerOpen === id;
                  const isReveal = id === 'reveal';
                  return (
                    <div
                      key={id}
                      className={`dresser-drawer ${isOpen ? 'is-open' : ''} ${isReveal ? 'dresser-drawer--deep' : ''}`}
                    >
                      {/* Decorative 3D box faces */}
                      <div className="dresser-drawer__box" aria-hidden>
                        <span className="dresser-drawer__wall dresser-drawer__wall--left" />
                        <span className="dresser-drawer__wall dresser-drawer__wall--right" />
                        <span className="dresser-drawer__wall dresser-drawer__wall--back" />
                        <span className="dresser-drawer__floor" />
                      </div>

                      {/* Interactive content — counter-rotated to face reader */}
                      <div className={`dresser-drawer__content ${isOpen ? 'is-visible' : ''}`}>
                        {isOpen && id === 'name' && step === 'name' && (
                          <>
                            <h2 id={titleId} className="dresser-carve">
                              What should we call this cookbook?
                            </h2>
                            <p className="dresser-carve-preview" aria-live="polite">
                              {previewName || 'Your name'}{' '}
                              <span>Cooks</span>
                            </p>
                            <label className="dresser-slot-label" htmlFor="dresser-name">
                              Your name
                            </label>
                            <div className="dresser-slot">
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
                                    submitName();
                                  }
                                }}
                                placeholder="e.g. Ayesha"
                              />
                            </div>
                            {error && (
                              <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                                {error}
                              </p>
                            )}
                            <button
                              type="button"
                              disabled={animating}
                              onClick={() => submitName()}
                              className="dresser-wood-btn mt-4"
                            >
                              Continue
                            </button>
                          </>
                        )}

                        {isOpen && id === 'profile' && step === 'profile' && (
                          <>
                            <h2 id={titleId} className="dresser-carve">
                              Who eats from this book?
                            </h2>
                            <p className="dresser-carve-sub">Optional — plate goals and allergen flags.</p>
                            <label className="dresser-slot-label" htmlFor="dresser-profile">
                              Name
                            </label>
                            <div className="dresser-slot">
                              <input
                                id="dresser-profile"
                                type="text"
                                autoFocus
                                maxLength={40}
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="e.g. Ayesha"
                              />
                            </div>
                            {profileError && (
                              <p className="mt-2 text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                                {profileError}
                              </p>
                            )}
                            <button
                              type="button"
                              disabled={busy || animating}
                              onClick={() => void createProfile()}
                              className="dresser-wood-btn mt-4"
                            >
                              Create profile
                            </button>
                            <button
                              type="button"
                              disabled={animating}
                              onClick={skipProfile}
                              className="dresser-skip mt-2"
                            >
                              Skip
                            </button>
                          </>
                        )}

                        {isOpen && id === 'mode' && step === 'mode' && (
                          <>
                            <h2 id={titleId} className="dresser-carve">
                              How do you like to cook?
                            </h2>
                            <div className="mt-3 space-y-2">
                              {QUICK_MODES.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  disabled={animating}
                                  onClick={() => pickMode(m.id)}
                                  className="dresser-tag"
                                >
                                  <span className="dresser-tag__label">{m.label}</span>
                                  <span className="dresser-tag__blurb">{m.blurb}</span>
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              disabled={animating}
                              onClick={skipMode}
                              className="dresser-skip mt-3"
                            >
                              Skip — open my book
                            </button>
                          </>
                        )}
                      </div>

                      <div className="dresser-drawer__front" aria-hidden>
                        <span className="dresser-handle" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rising cookbook — skin-matched leather/linen cover */}
              {step === 'reveal' && bookPhase !== 'hidden' && (
                <div
                  ref={bookRef}
                  className={`dresser-book dresser-book--${bookPhase}`}
                  style={handoffStyle}
                >
                  <div className="dresser-book__shadow" aria-hidden />
                  <div className="dresser-book__cover leather flex flex-col items-center justify-center text-center">
                    <p className="gold-foil text-[0.55rem] uppercase tracking-[0.3em] opacity-80">
                      A Family Cookbook
                    </p>
                    <p className="foil-sweep-inline gold-foil mt-2 font-serif text-2xl font-semibold sm:text-3xl">
                      {bookTitle}
                    </p>
                    <p className="gold-foil mt-2 text-xs opacity-70">Made & Kept with Love</p>
                  </div>
                </div>
              )}
            </div>

            {showBack && (
              <button
                type="button"
                disabled={animating}
                onClick={goBack}
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
