'use client';

import { useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { Icon, type IconName } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { MODES } from '@/lib/modes/registry';
import { NUTRITION_DISCLAIMER } from '@/lib/profiles/nutrition';
import type { ModeId } from '@/lib/profiles/types';

const HEALTH_LENSES: ModeId[] = ['diabetic', 'heart', 'fiber'];

const VALID_ICONS = new Set<string>([
  'sunrise',
  'sun',
  'moon',
  'cake',
  'cup',
  'bread',
  'leaf',
  'bolt',
  'sprout',
  'flame',
  'olive',
  'chili',
  'wheat',
  'whisk',
  'cookie',
  'pot',
  'sparkle',
  'search',
  'heart',
  'heart-filled',
  'star',
  'star-filled',
  'clock',
  'gauge',
  'users',
  'flame-cal',
  'close',
  'arrow-left',
  'arrow-right',
  'book',
  'bookmark',
  'sun-toggle',
  'moon-toggle',
]);

function modeIcon(name: string): IconName {
  return (VALID_ICONS.has(name) ? name : 'sparkle') as IconName;
}

/** Grid of cooking modes from the registry. */
export function ModeChooser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode } = useApp();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

  useDialogA11y(open, onClose, panelRef);

  const showHealthNote = useMemo(
    () => HEALTH_LENSES.includes(mode) || MODES.some((m) => HEALTH_LENSES.includes(m.id)),
    [mode],
  );

  const select = useCallback(
    (id: ModeId) => {
      setMode(id);
      onClose();
    },
    [setMode, onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-chooser-title"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div>
                <h2
                  id="mode-chooser-title"
                  className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Choose a mode
                </h2>
                <p className="text-xs text-[color:var(--color-ink-faint)]">
                  A soft lens on the book — switch anytime
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-[color:var(--color-ink-faint)]"
              >
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MODES.map((m) => {
                  const active = m.id === mode;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => select(m.id)}
                        aria-pressed={active}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                          active
                            ? 'border-[color:var(--color-accent)] bg-[color:var(--color-paper-sunk)]'
                            : 'border-[color:var(--color-line)] hover:bg-[color:var(--color-paper-sunk)]'
                        }`}
                      >
                        <span
                          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full"
                          style={{ background: `${m.color}22`, color: m.color }}
                        >
                          <Icon name={modeIcon(m.icon)} size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-serif text-[color:var(--color-ink)]">
                            {m.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-[color:var(--color-ink-faint)]">
                            {m.blurb}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {showHealthNote && (
                <p className="mt-4 text-center text-[0.7rem] text-[color:var(--color-ink-faint)]">
                  Health lenses are estimates only — not medical advice. {NUTRITION_DISCLAIMER}
                </p>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
