'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { useBook } from './BookController';
import { CHAPTER_MAP } from '@/lib/recipes/chapters';
import { RecipeImage } from '@/components/ui/RecipeImage';
import { Icon } from '@/components/ui/Icon';
import type { Recipe } from '@/lib/recipes/types';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Slide-over: favorites, recent, imported customs (edit/delete). */
export function FavoritesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { favorites, recent, toggleFavorite, recipeMap, customs, removeCustom, updateCustom, ready } =
    useApp();
  const { goToRecipe } = useBook();
  const favList = ready ? Array.from(favorites) : [];
  const recentList = ready ? recent : [];
  const panelRef = useRef<HTMLElement>(null);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEditId(null);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editId) setEditId(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, editId]);

  const jump = (id: string) => {
    goToRecipe(id);
    onClose();
  };

  const editing = editId ? customs.find((c) => c.id === editId) : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-label="Favorites and history"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]">
                Your Kitchen
              </h2>
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
              {editing ? (
                <CustomEditor
                  recipe={editing}
                  onCancel={() => setEditId(null)}
                  onSave={async (r) => {
                    await updateCustom(r);
                    setEditId(null);
                  }}
                />
              ) : (
                <>
                  <Group
                    title="Favorites"
                    empty={
                      ready
                        ? 'Tap the heart on any recipe to save it here.'
                        : 'Loading your kitchen…'
                    }
                  >
                    {favList.map((id) => {
                      if (!recipeMap[id]) return null;
                      return (
                        <Row key={id} id={id} onJump={jump}>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(id)}
                            aria-label="Remove favorite"
                            className="text-[#ff7a6b]"
                          >
                            <Icon name="heart-filled" size={20} />
                          </button>
                        </Row>
                      );
                    })}
                  </Group>

                  <Group title="Recently viewed" empty="Recipes you open will appear here.">
                    {recentList
                      .filter((id) => recipeMap[id])
                      .map((id) => (
                        <Row key={id} id={id} onJump={jump} />
                      ))}
                  </Group>

                  <Group
                    title="Imported recipes"
                    empty="Paste a WhatsApp recipe from ··· → Import."
                  >
                    {customs.map((r) => (
                      <Row key={r.id} id={r.id} onJump={jump}>
                        <button
                          type="button"
                          onClick={() => setEditId(r.id)}
                          aria-label={`Edit ${r.title}`}
                          className="px-1 text-xs font-medium text-[color:var(--color-accent)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeCustom(r.id)}
                          aria-label={`Delete ${r.title}`}
                          className="text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-accent)]"
                        >
                          <Icon name="close" size={18} />
                        </button>
                      </Row>
                    ))}
                  </Group>
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CustomEditor({
  recipe,
  onCancel,
  onSave,
}: {
  recipe: Recipe;
  onCancel: () => void;
  onSave: (r: Recipe) => Promise<void>;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [tagline, setTagline] = useState(recipe.tagline);
  const [story, setStory] = useState(recipe.story ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
      >
        ← Back
      </button>
      <h3 className="font-serif text-xl font-semibold text-[color:var(--color-ink)]">Edit import</h3>
      <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
        />
      </label>
      <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
        Tagline
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
        />
      </label>
      <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
        Story
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
        />
      </label>
      <button
        type="button"
        disabled={saving || !title.trim()}
        onClick={() => {
          setSaving(true);
          void onSave({
            ...recipe,
            title: title.trim(),
            tagline: tagline.trim() || recipe.tagline,
            story: story.trim() || recipe.story || '',
          }).finally(() => setSaving(false));
        }}
        className="w-full rounded-lg bg-[color:var(--color-accent)] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function Group({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(arr) ? arr.length === 0 : !arr;
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-xs uppercase tracking-widest text-[color:var(--color-ink-faint)]">
        {title}
      </h3>
      {isEmpty ? (
        <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-4 text-sm text-[color:var(--color-ink-faint)]">
          {empty}
        </p>
      ) : (
        <ul className="space-y-1">{children}</ul>
      )}
    </section>
  );
}

function Row({
  id,
  onJump,
  children,
}: {
  id: string;
  onJump: (id: string) => void;
  children?: React.ReactNode;
}) {
  const { recipeMap } = useApp();
  const r = recipeMap[id];
  if (!r) return null;
  const c = CHAPTER_MAP[r.chapter];
  return (
    <li className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-[color:var(--color-paper-sunk)]">
      <button
        type="button"
        onClick={() => onJump(id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
          <RecipeImage recipeId={id} seed={r.heroSeed} tab={c.tab} alt={r.title} sizes="44px" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-serif text-[color:var(--color-ink)]">{r.title}</span>
          <span className="block truncate text-xs text-[color:var(--color-ink-faint)]">
            {c.title}
          </span>
        </span>
      </button>
      {children}
    </li>
  );
}
