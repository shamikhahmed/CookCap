'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Icon } from '@/components/ui/Icon';
import { useBook } from '@/components/book/BookController';
import { useApp } from '@/components/app/AppStore';
import { LogMealDialog } from '@/components/profiles/LogMealDialog';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { formatQty, scaleIngredient } from '@/lib/recipes/scale';
import * as store from '@/lib/db/store';
import type { Recipe } from '@/lib/recipes/types';

type Phase = 'mise' | 'cook' | 'done';

type ActiveTimer = {
  stepIndex: number;
  label: string;
  total: number;
  left: number;
  running: boolean;
  rung?: boolean;
};

function timerLabel(instruction: string, stepIndex: number): string {
  const clean = instruction.replace(/\s+/g, ' ').trim();
  const short = clean.length > 36 ? `${clean.slice(0, 34)}…` : clean;
  return short || `Step ${stepIndex + 1}`;
}

/**
 * Fullscreen cook ritual: mise en place → steps + named timers → done (rate/log).
 * Wake Lock. Glove mode = bigger targets. Landscape-friendly layout.
 */
export function CookingMode({
  recipe,
  open,
  onClose,
}: {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}) {
  const { setLocked } = useBook();
  const { mode, reportStorageError } = useApp();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('mise');
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [miseChecked, setMiseChecked] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [glove, setGlove] = useState(false);
  const [rating, setRating] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevLeft = useRef<Record<number, number>>({});

  const tap = glove ? 'min-h-14 min-w-14 text-base' : 'min-h-11';
  const stepBtn = glove ? 'size-16 text-2xl' : 'size-14 text-xl';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setLocked(open);
    return () => setLocked(false);
  }, [open, setLocked]);

  useEffect(() => {
    if (!open) return;
    setPhase('mise');
    setStep(0);
    setDone(new Set());
    setMiseChecked(new Set());
    setTimers([]);
    setRating(0);
    setLogOpen(false);
    store.getRating(recipe.id).then(setRating).catch(() => void 0);
  }, [open, recipe.id]);

  const exit = useCallback(() => {
    setLogOpen(false);
    onClose();
  }, [onClose]);

  useDialogA11y(open && !logOpen, exit, panelRef);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        /* ok */
      }
    };
    void request();
    const onVis = () => {
      if (document.visibilityState === 'visible' && open && !cancelled) void request();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void wakeRef.current?.release();
      wakeRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setTimers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (!t.running || t.left <= 0) return t;
          changed = true;
          const left = Math.max(0, t.left - 1);
          return { ...t, left, rung: left === 0 ? true : t.rung };
        });
        if (!changed) return prev;

        for (const t of next) {
          const was = prevLeft.current[t.stepIndex];
          if (t.left === 0 && was !== 0 && t.rung) {
            try {
              navigator.vibrate?.(200);
            } catch {
              /* ignore */
            }
          }
          prevLeft.current[t.stepIndex] = t.left;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  const finishCook = useCallback(() => {
    setDone((d) => new Set(d).add(step));
    setPhase('done');
  }, [step]);

  const goNext = useCallback(() => {
    setDone((d) => new Set(d).add(step));
    if (step >= recipe.steps.length - 1) {
      setPhase('done');
      return;
    }
    setStep((s) => Math.min(recipe.steps.length - 1, s + 1));
  }, [step, recipe.steps.length]);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    if (!open || phase !== 'cook') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (step < recipe.steps.length - 1) goNext();
        else finishCook();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, phase, finishCook, goNext, goPrev, step, recipe.steps.length]);

  const toggleDone = (i: number) =>
    setDone((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const toggleMise = (i: number) =>
    setMiseChecked((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const flatIngs = recipe.ingredients.flatMap((g) => g.items);
  const current = recipe.steps[step];
  const progress =
    phase === 'done'
      ? 100
      : phase === 'mise'
        ? (miseChecked.size / Math.max(1, flatIngs.length)) * 20
        : recipe.steps.length
          ? 20 + ((step + (done.has(step) ? 1 : 0)) / recipe.steps.length) * 80
          : 0;
  const atLast = step >= recipe.steps.length - 1;
  const stepHasTimer = current?.durationSec != null;
  const existingForStep = timers.find((t) => t.stepIndex === step);

  const startStepTimer = () => {
    if (current?.durationSec == null) return;
    const label = timerLabel(current.instruction, step);
    setTimers((prev) => {
      if (prev.some((t) => t.stepIndex === step)) {
        return prev.map((t) =>
          t.stepIndex === step ? { ...t, running: true, left: t.left || t.total } : t,
        );
      }
      return [
        ...prev,
        {
          stepIndex: step,
          label,
          total: current.durationSec!,
          left: current.durationSec!,
          running: true,
        },
      ];
    });
  };

  const setStars = (stars: number) => {
    setRating(stars);
    store.setRating(recipe.id, stars).catch(() => {
      reportStorageError('Could not save rating on this device.');
    });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className={`cook-mode fixed inset-0 z-[80] flex flex-col bg-[color:var(--color-paper)] text-[color:var(--color-ink)] ${glove ? 'cook-mode--glove' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cook-mode-title"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[0.25em] text-[color:var(--color-ink-faint)]">
                {phase === 'mise' && 'Mise en place'}
                {phase === 'cook' && `Cooking · step ${step + 1}/${recipe.steps.length}`}
                {phase === 'done' && 'Finished'}
              </p>
              <h2 id="cook-mode-title" className="truncate font-serif text-xl font-semibold">
                {recipe.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setGlove((g) => !g)}
                aria-pressed={glove}
                className={`rounded-full bg-[color:var(--color-paper-sunk)] px-3 ${tap} text-xs font-medium`}
                title="Bigger buttons for messy hands"
              >
                {glove ? 'Glove on' : 'Glove'}
              </button>
              <button
                type="button"
                onClick={exit}
                aria-label="Exit cooking mode"
                className={`grid place-items-center rounded-full bg-[color:var(--color-paper-sunk)] ${glove ? 'size-14' : 'size-11'}`}
              >
                <Icon name="close" size={22} />
              </button>
            </div>
          </header>

          <div className="mx-4 h-1 overflow-hidden rounded-full bg-[color:var(--color-line)] sm:mx-6">
            <motion.div
              className="h-full rounded-full bg-[color:var(--color-accent)]"
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={reduce ? { duration: 0 } : { type: 'tween', duration: 0.28 }}
            />
          </div>

          {phase === 'mise' && (
            <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-8">
              <p className="mb-3 text-center text-sm text-[color:var(--color-ink-soft)]">
                Gather what you need — then start. Skip anytime.
              </p>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {flatIngs.map((ing, i) => {
                  const scaled = scaleIngredient(ing, 1);
                  const on = miseChecked.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => toggleMise(i)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 text-left ${tap} ${
                          on
                            ? 'border-[color:var(--color-success)] bg-[color:var(--color-success)]/10'
                            : 'border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)]'
                        }`}
                      >
                        <span
                          className={`grid shrink-0 place-items-center rounded-full text-sm font-bold text-white ${glove ? 'size-10' : 'size-8'}`}
                          style={{ background: on ? 'var(--color-success)' : 'var(--color-accent)' }}
                        >
                          {on ? '✓' : i + 1}
                        </span>
                        <span className={on ? 'line-through opacity-60' : ''}>
                          <span className="font-medium tabular-nums text-[color:var(--color-accent)]">
                            {formatQty(scaled)} {ing.unit}
                          </span>{' '}
                          {ing.item}
                          {ing.note ? (
                            <span className="text-[color:var(--color-ink-faint)]"> — {ing.note}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setPhase('cook')}
                  className={`rounded-full border border-[color:var(--color-line)] px-5 ${tap}`}
                >
                  Skip mise
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('cook')}
                  className={`rounded-full bg-[color:var(--color-accent)] px-6 font-medium text-white ${tap}`}
                >
                  Start cooking
                </button>
              </div>
            </div>
          )}

          {phase === 'cook' && current && (
            <>
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-6 text-center landscape:py-3 sm:px-12">
                <button
                  type="button"
                  onClick={() => toggleDone(step)}
                  aria-pressed={done.has(step)}
                  className={`mb-6 grid place-items-center rounded-full font-bold text-white transition-transform active:scale-90 ${stepBtn}`}
                  style={{
                    background: done.has(step) ? 'var(--color-success)' : 'var(--color-accent)',
                  }}
                >
                  {done.has(step) ? '✓' : step + 1}
                </button>

                <p
                  className={`max-w-2xl font-serif leading-snug text-balance ${
                    glove ? 'text-[clamp(1.75rem,5vw,2.6rem)]' : 'text-[clamp(1.5rem,4.5vw,2.4rem)]'
                  } ${done.has(step) ? 'line-through opacity-50' : ''}`}
                >
                  {current.instruction}
                </p>

                {current.tip && (
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--color-ink-soft)]">
                    <span className="italic">{current.tip}</span>
                  </p>
                )}

                {stepHasTimer && !existingForStep && (
                  <button
                    type="button"
                    onClick={startStepTimer}
                    className={`mt-8 rounded-full bg-[color:var(--color-paper-sunk)] px-5 font-medium ${tap}`}
                  >
                    Start {Math.round((current.durationSec ?? 0) / 60)} min — {timerLabel(current.instruction, step)}
                  </button>
                )}
              </div>

              {timers.length > 0 && (
                <div className="border-t border-[color:var(--color-line)] px-4 py-3 sm:px-6">
                  <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
                    Timers
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {timers.map((t) => {
                      const m = Math.floor(t.left / 60);
                      const s = t.left % 60;
                      return (
                        <li
                          key={t.stepIndex}
                          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                            t.left === 0
                              ? 'bg-[color:var(--color-success)]/20'
                              : 'bg-[color:var(--color-paper-sunk)]'
                          }`}
                        >
                          <span className="max-w-[10rem] truncate text-[color:var(--color-ink-faint)]">
                            {t.label}
                          </span>
                          <span className="font-serif text-lg tabular-nums">
                            {m}:{s.toString().padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            className={`font-medium ${tap} px-2`}
                            onClick={() =>
                              setTimers((prev) =>
                                prev.map((x) =>
                                  x.stepIndex === t.stepIndex ? { ...x, running: !x.running } : x,
                                ),
                              )
                            }
                          >
                            {t.left === 0 ? 'Done' : t.running ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Dismiss ${t.label} timer`}
                            className="text-[color:var(--color-ink-faint)]"
                            onClick={() =>
                              setTimers((prev) => prev.filter((x) => x.stepIndex !== t.stepIndex))
                            }
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <footer className="flex items-center justify-between gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 0}
                  className={`flex items-center gap-2 rounded-full px-4 text-[color:var(--color-ink-soft)] disabled:opacity-30 ${tap}`}
                >
                  <Icon name="arrow-left" size={20} />
                  Back
                </button>

                <div className="flex gap-1.5">
                  {recipe.steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to step ${i + 1}`}
                      aria-current={i === step ? 'step' : undefined}
                      onClick={() => setStep(i)}
                      className={glove ? 'size-4 rounded-full' : 'size-2.5 rounded-full'}
                      style={{
                        background:
                          i === step
                            ? 'var(--color-accent)'
                            : done.has(i)
                              ? 'var(--color-success)'
                              : 'var(--color-line)',
                      }}
                    />
                  ))}
                </div>

                {atLast ? (
                  <button
                    type="button"
                    onClick={finishCook}
                    className={`rounded-full bg-[color:var(--color-success)] px-5 font-medium text-white ${tap}`}
                  >
                    Done cooking
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className={`flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 font-medium text-white ${tap}`}
                  >
                    Next
                    <Icon name="arrow-right" size={20} />
                  </button>
                )}
              </footer>
            </>
          )}

          {phase === 'done' && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="font-serif text-[clamp(1.8rem,5vw,2.8rem)] font-semibold text-balance">
                Nice work — {recipe.title} is done.
              </p>
              <p className="text-sm text-[color:var(--color-ink-soft)]">How did it taste?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} stars`}
                    aria-pressed={rating >= n}
                    onClick={() => setStars(n)}
                    className={`grid place-items-center ${glove ? 'size-14' : 'size-11'}`}
                    style={{ color: rating >= n ? 'var(--color-gold)' : 'var(--color-line)' }}
                  >
                    <Icon name={rating >= n ? 'star-filled' : 'star'} size={glove ? 28 : 22} />
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {mode !== 'reader' && (
                  <button
                    type="button"
                    onClick={() => setLogOpen(true)}
                    className={`rounded-full bg-[color:var(--color-accent)] px-5 font-medium text-white ${tap}`}
                  >
                    Log this meal
                  </button>
                )}
                <button
                  type="button"
                  onClick={exit}
                  className={`rounded-full border border-[color:var(--color-line)] px-5 ${tap}`}
                >
                  Back to recipe
                </button>
              </div>
            </div>
          )}

          <LogMealDialog
            open={logOpen}
            onClose={() => setLogOpen(false)}
            recipeId={recipe.id}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
