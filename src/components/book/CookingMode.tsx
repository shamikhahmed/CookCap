'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/components/ui/Icon';
import { useBook } from '@/components/book/BookController';
import type { Recipe } from '@/lib/recipes/types';

/**
 * Fullscreen cooking mode (portaled to body). Locks book nav so arrow keys
 * advance steps, not pages. Wake Lock keeps the screen on.
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
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const wakeRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setLocked(open);
    return () => setLocked(false);
  }, [open, setLocked]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDone(new Set());
  }, [open, recipe.id]);

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

  const goNext = useCallback(() => {
    setDone((d) => new Set(d).add(step));
    setStep((s) => Math.min(recipe.steps.length - 1, s + 1));
  }, [step, recipe.steps.length]);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (step < recipe.steps.length - 1) goNext();
        else onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose, goNext, goPrev, step, recipe.steps.length]);

  const toggleDone = (i: number) =>
    setDone((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const current = recipe.steps[step];
  const progress = recipe.steps.length ? ((step + (done.has(step) ? 1 : 0)) / recipe.steps.length) * 100 : 0;
  const atLast = step >= recipe.steps.length - 1;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
          role="dialog"
          aria-modal="true"
          aria-label={`Cooking ${recipe.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[0.25em] text-[color:var(--color-ink-faint)]">
                Cooking mode · step {step + 1}/{recipe.steps.length}
              </p>
              <h2 className="truncate font-serif text-xl font-semibold">{recipe.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Exit cooking mode"
              className="grid size-11 place-items-center rounded-full bg-[color:var(--color-paper-sunk)]"
            >
              <Icon name="close" size={22} />
            </button>
          </header>

          <div className="mx-4 h-1 overflow-hidden rounded-full bg-[color:var(--color-line)] sm:mx-6">
            <motion.div
              className="h-full rounded-full bg-[color:var(--color-accent)]"
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center sm:px-12">
            <button
              type="button"
              onClick={() => toggleDone(step)}
              aria-pressed={done.has(step)}
              className="mb-6 grid size-14 place-items-center rounded-full text-xl font-bold text-white transition-transform active:scale-90"
              style={{
                background: done.has(step) ? 'var(--color-success)' : 'var(--color-accent)',
              }}
            >
              {done.has(step) ? '✓' : step + 1}
            </button>

            <p
              className={`max-w-2xl font-serif text-[clamp(1.5rem,4.5vw,2.4rem)] leading-snug text-balance ${
                done.has(step) ? 'line-through opacity-50' : ''
              }`}
            >
              {current.instruction}
            </p>

            {current.tip && (
              <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--color-ink-soft)]">
                {(current.tip.match(
                  /\b(mein|ker|dein|lein|aur|per|karein|dal|phir|tak|ubal|pheela|laga)\b/gi,
                )?.length ?? 0) >= 2 ? (
                  <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
                    Roman Urdu
                  </span>
                ) : null}
                <span className="italic">{current.tip}</span>
              </p>
            )}
            {current.durationSec != null && (
              <CookTimer key={`${recipe.id}-${step}`} seconds={current.durationSec} />
            )}
          </div>

          <footer className="flex items-center justify-between gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 0}
              className="flex items-center gap-2 rounded-full px-4 py-3 text-[color:var(--color-ink-soft)] disabled:opacity-30"
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
                  onClick={() => setStep(i)}
                  className="size-2 rounded-full transition-colors"
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
                onClick={onClose}
                className="rounded-full bg-[color:var(--color-success)] px-5 py-3 font-medium text-white"
              >
                Done cooking
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 py-3 font-medium text-white"
              >
                Next
                <Icon name="arrow-right" size={20} />
              </button>
            )}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function CookTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || left <= 0) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, left]);

  const m = Math.floor(left / 60);
  const s = left % 60;

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <p className="font-serif text-5xl tabular-nums tracking-tight">
        {m}:{s.toString().padStart(2, '0')}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-full bg-[color:var(--color-paper-sunk)] px-4 py-2 text-sm font-medium"
        >
          {running ? 'Pause' : left === 0 ? 'Done' : 'Start timer'}
        </button>
        <button
          type="button"
          onClick={() => {
            setLeft(seconds);
            setRunning(false);
          }}
          className="rounded-full px-4 py-2 text-sm text-[color:var(--color-ink-faint)]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
