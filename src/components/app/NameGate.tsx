'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useDialogA11y } from '@/lib/a11y/dialog';
import { PRODUCT_NAME, sanitizeOwnerName } from '@/lib/edition';

/**
 * First-run gate: ask who the cookbook is for → "{Name} Cooks" on the cover.
 * Cannot dismiss without a name (Escape ignored).
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
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useDialogA11y(
    open,
    () => {
      if (dismissible) onDismiss?.();
    },
    panelRef,
    { initialFocus: 'first' },
  );

  useEffect(() => {
    if (!open) return;
    setValue('');
    setError('');
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const name = sanitizeOwnerName(value);
    if (!name) {
      setError('Enter a first name (or nickname).');
      return;
    }
    onSubmit(name);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="name-gate-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
            className="w-full max-w-sm rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] p-6 shadow-[var(--shadow-lg)]"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--color-ink-faint)]">
              {PRODUCT_NAME}
            </p>
            <h2
              id="name-gate-title"
              className="mt-2 font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
            >
              Whose cookbook is this?
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
              Cover title becomes <span className="font-serif italic">YourName Cooks</span>. Change
              later from the ··· menu.
            </p>
            <label className="mt-5 block text-sm text-[color:var(--color-ink-soft)]" htmlFor="cookcap-owner">
              Your name
            </label>
            <input
              id="cookcap-owner"
              type="text"
              autoComplete="given-name"
              maxLength={40}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g. Jia"
              className="mt-1.5 w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3.5 py-2.5 text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
            />
            {error && (
              <p className="mt-2 text-sm text-[color:var(--color-danger, #b33)]" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              className="mt-5 w-full rounded-xl bg-[color:var(--color-accent)] px-4 py-2.5 font-medium text-white transition-transform active:scale-[0.98]"
            >
              Open my book
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
