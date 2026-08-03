'use client';

import { useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { Icon, type IconName } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { MODES } from '@/lib/modes/registry';
import { MODE_GROUP_LABELS, MODE_GROUP_ORDER, type ModeGroup } from '@/lib/modes/types';
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
  'palette',
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

  const showHealthNote = HEALTH_LENSES.includes(mode);

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={reduce ? false : { y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 16, opacity: 0 }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-chooser-title"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
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

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {MODE_GROUP_ORDER.map((group: ModeGroup) => {
                const items = MODES.filter((m) => m.group === group);
                if (items.length === 0) return null;
                return (
                  <section key={group} className="mb-4 last:mb-0">
                    <h3 className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
                      {MODE_GROUP_LABELS[group]}
                    </h3>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {items.map((m) => {
                        const active = m.id === mode;
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => select(m.id)}
                              aria-pressed={active}
                              className={`flex min-h-11 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
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
                  </section>
                );
              })}

              {showHealthNote && (
                <p className="mt-4 text-center text-[0.7rem] text-[color:var(--color-ink-faint)]">
                  {NUTRITION_DISCLAIMER}
                </p>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
