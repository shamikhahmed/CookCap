'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { parseWhatsAppRecipe } from '@/lib/import/whatsapp';
import type { ChapterId, Recipe } from '@/lib/recipes/types';
import { CHAPTERS } from '@/lib/recipes/chapters';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { leafOfRecipe } from '@/lib/book/pages';

const PLACEHOLDER = `Aloo Gobi

Ingredients:
- 2 potatoes, cubed
- 1 cauliflower, florets
- 1 tsp cumin
- ½ tsp turmeric
- Salt to taste

Method:
1. Heat oil, bloom cumin.
2. Add potatoes, then cauliflower and spices.
3. Cover and cook until tender. Finish with coriander.`;

const FOOD_CHAPTERS = CHAPTERS.filter(
  (c) => c.id !== 'favorites' && c.id !== 'tips',
);

/** Paste a WhatsApp-forwarded recipe → preview → save into the book. */
export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCustom } = useApp();
  const { goToRecipe, leaves } = useBook();
  const reduce = useReducedMotion();
  const [raw, setRaw] = useState('');
  const [chapter, setChapter] = useState<ChapterId>('meals');
  const [preview, setPreview] = useState<Recipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingGoId, setPendingGoId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setPreview(null);
    setError(null);
    onClose();
  }, [onClose]);

  useDialogA11y(open, close, panelRef);

  /** Navigate after customs → leaves rebuild (goToRecipe before that = silent -1). */
  useEffect(() => {
    if (!pendingGoId) return;
    if (leafOfRecipe(pendingGoId, leaves) < 0) return;
    goToRecipe(pendingGoId);
    setPendingGoId(null);
  }, [pendingGoId, leaves, goToRecipe]);

  const counts = useMemo(() => {
    if (!preview) return null;
    const ings = preview.ingredients.reduce((n, g) => n + g.items.length, 0);
    return { ings, steps: preview.steps.length };
  }, [preview]);

  const parse = () => {
    if (!raw.trim()) return;
    setPreview(parseWhatsAppRecipe(raw, chapter));
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const recipe = { ...preview, chapter };
      await addCustom(recipe);
      setPendingGoId(recipe.id);
      setRaw('');
      setPreview(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save recipe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={close}
        >
          <motion.div
            ref={panelRef}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
            className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <h2
                id="import-modal-title"
                className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
              >
                Import recipe
              </h2>
              <button onClick={close} aria-label="Close" className="text-[color:var(--color-ink-faint)]">
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <p className="text-sm text-[color:var(--color-ink-soft)]">
                Paste a WhatsApp forward — title, ingredients, and steps. We&apos;ll tidy it into
                a page in your book.
              </p>

              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-widest text-[color:var(--color-ink-faint)]">
                  Chapter
                </span>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value as ChapterId)}
                  className="w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2.5 text-sm text-[color:var(--color-ink)]"
                >
                  {FOOD_CHAPTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-widest text-[color:var(--color-ink-faint)]">
                  Paste
                </span>
                <textarea
                  value={raw}
                  onChange={(e) => {
                    setRaw(e.target.value);
                    setPreview(null);
                  }}
                  rows={10}
                  placeholder={PLACEHOLDER}
                  className="w-full resize-y rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2.5 font-sans text-sm leading-relaxed text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)]/70"
                />
              </label>

              {preview && counts && (
                <div className="rounded-lg bg-[color:var(--color-paper-sunk)] p-4">
                  <p className="font-serif text-lg text-[color:var(--color-ink)]">{preview.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--color-ink-faint)]">
                    {counts.ings} ingredients · {counts.steps} steps
                  </p>
                </div>
              )}
              {error && (
                <p className="text-sm text-[color:var(--color-danger,#b33)]" role="alert">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex gap-2 border-t border-[color:var(--color-line)] px-5 py-3">
              {!preview ? (
                <button
                  type="button"
                  onClick={parse}
                  disabled={!raw.trim()}
                  className="flex-1 rounded-lg bg-[color:var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  Parse
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    className="rounded-lg bg-[color:var(--color-paper-sunk)] px-4 py-2.5 text-sm text-[color:var(--color-ink-soft)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-[color:var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : 'Save to book'}
                  </button>
                </>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
