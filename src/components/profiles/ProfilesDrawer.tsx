'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { Icon } from '@/components/ui/Icon';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { calcTargets, NUTRITION_DISCLAIMER } from '@/lib/profiles/nutrition';
import {
  makeProfile,
  type Goal,
  type Profile,
} from '@/lib/profiles/types';

const ALLERGENS = ['dairy', 'gluten', 'nuts', 'eggs', 'shellfish'] as const;

const GOAL_OPTIONS: { id: Goal; label: string }[] = [
  { id: 'maintain', label: 'Maintain' },
  { id: 'cut', label: 'Cut' },
  { id: 'bulk', label: 'Bulk' },
  { id: 'none', label: 'No goal' },
];

type FormState = {
  id?: string;
  name: string;
  goal: Goal;
  age: string;
  weightKg: string;
  heightCm: string;
  sex: '' | 'f' | 'm' | 'na';
  vegetarian: boolean;
  avoid: string[];
  spiceMax: string;
  targetsManual: boolean;
  targets: { kcal: string; protein: string; carbs: string; fat: string };
};

function emptyForm(): FormState {
  return {
    name: '',
    goal: 'maintain',
    age: '',
    weightKg: '',
    heightCm: '',
    sex: '',
    vegetarian: false,
    avoid: [],
    spiceMax: '',
    targetsManual: false,
    targets: { kcal: '2000', protein: '120', carbs: '200', fat: '65' },
  };
}

function fromProfile(p: Profile): FormState {
  return {
    id: p.id,
    name: p.name,
    goal: p.goal,
    age: p.age != null ? String(p.age) : '',
    weightKg: p.weightKg != null ? String(p.weightKg) : '',
    heightCm: p.heightCm != null ? String(p.heightCm) : '',
    sex: p.sex ?? '',
    vegetarian: !!p.vegetarian,
    avoid: [...p.avoid],
    spiceMax: p.spiceMax != null ? String(p.spiceMax) : '',
    targetsManual: !!p.targetsManual,
    targets: {
      kcal: String(p.targets.kcal),
      protein: String(p.targets.protein),
      carbs: String(p.targets.carbs),
      fat: String(p.targets.fat),
    },
  };
}

function buildProfile(form: FormState): Profile {
  const base = makeProfile({
    id: form.id,
    name: form.name.trim(),
    goal: form.goal,
    age: form.age ? Number(form.age) : undefined,
    weightKg: form.weightKg ? Number(form.weightKg) : undefined,
    heightCm: form.heightCm ? Number(form.heightCm) : undefined,
    sex: form.sex || undefined,
    vegetarian: form.vegetarian || undefined,
    avoid: form.avoid,
    spiceMax: form.spiceMax !== '' ? Number(form.spiceMax) : undefined,
    targetsManual: form.targetsManual || undefined,
    targets: {
      kcal: Number(form.targets.kcal) || 2000,
      protein: Number(form.targets.protein) || 120,
      carbs: Number(form.targets.carbs) || 200,
      fat: Number(form.targets.fat) || 65,
    },
  });

  if (!form.targetsManual) {
    return { ...base, targets: calcTargets(base), targetsManual: false };
  }
  return base;
}

/** Manage household eaters — local profiles only. */
export function ProfilesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    profiles,
    activeProfile,
    setActiveProfileId,
    cookingForIds,
    setCookingForIds,
    upsertProfile,
    removeProfile,
    reportStorageError,
  } = useApp();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const editingRef = useRef(editing);
  editingRef.current = editing;

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setConfirmDeleteId(null);
    }
  }, [open]);

  const closeHandler = useCallback(() => {
    if (editingRef.current) {
      setEditing(null);
      setConfirmDeleteId(null);
      return;
    }
    onClose();
  }, [onClose]);

  useDialogA11y(open, closeHandler, panelRef);

  const liveTargets = useMemo(() => {
    if (!editing || editing.targetsManual) return null;
    const draft = buildProfile({ ...editing, targetsManual: false });
    return draft.targets;
  }, [editing]);

  const save = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const profile = buildProfile(editing);
      await upsertProfile(profile);
      if (!activeProfile) setActiveProfileId(profile.id);
      setEditing(null);
    } catch {
      setSaveError('Could not save profile on this device.');
      reportStorageError('Could not save profile on this device.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCookingFor = (id: string) => {
    setCookingForIds(
      cookingForIds.includes(id)
        ? cookingForIds.filter((x) => x !== id)
        : [...cookingForIds, id],
    );
  };

  const doDelete = async (id: string) => {
    await removeProfile(id);
    setConfirmDeleteId(null);
    if (editing?.id === id) setEditing(null);
  };

  const toggleAvoid = (a: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      avoid: editing.avoid.includes(a)
        ? editing.avoid.filter((x) => x !== a)
        : [...editing.avoid, a],
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionReduce(reduce)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={closeHandler}
        >
          <motion.aside
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionReduce(reduce)}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profiles-drawer-title"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <h2
                id="profiles-drawer-title"
                className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
              >
                Profiles
              </h2>
              <button
                type="button"
                onClick={closeHandler}
                aria-label="Close"
                className="grid size-11 place-items-center text-[color:var(--color-ink-faint)]"
              >
                <Icon name="close" size={22} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {editing ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="text-sm text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
                  >
                    ← Back
                  </button>
                  <h3 className="font-serif text-xl font-semibold text-[color:var(--color-ink)]">
                    {editing.id ? 'Edit profile' : 'Add profile'}
                  </h3>

                  <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Name
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
                      autoFocus
                    />
                  </label>

                  <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Goal
                    <select
                      value={editing.goal}
                      onChange={(e) => setEditing({ ...editing, goal: e.target.value as Goal })}
                      className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
                    >
                      {GOAL_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      Age
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={editing.age}
                        onChange={(e) => setEditing({ ...editing, age: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      Sex
                      <select
                        value={editing.sex}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            sex: e.target.value as FormState['sex'],
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                      >
                        <option value="">—</option>
                        <option value="f">Female</option>
                        <option value="m">Male</option>
                        <option value="na">Prefer not</option>
                      </select>
                    </label>
                    <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      Weight (kg)
                      <input
                        type="number"
                        min={1}
                        value={editing.weightKg}
                        onChange={(e) => setEditing({ ...editing, weightKg: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      Height (cm)
                      <input
                        type="number"
                        min={1}
                        value={editing.heightCm}
                        onChange={(e) => setEditing({ ...editing, heightCm: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]">
                    <input
                      type="checkbox"
                      checked={editing.vegetarian}
                      onChange={(e) => setEditing({ ...editing, vegetarian: e.target.checked })}
                      className="accent-[color:var(--color-accent)]"
                    />
                    Vegetarian
                  </label>

                  <div>
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                      Avoid allergens
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGENS.map((a) => {
                        const on = editing.avoid.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAvoid(a)}
                            aria-pressed={on}
                            className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                              on
                                ? 'bg-[color:var(--color-accent)] text-white'
                                : 'bg-[color:var(--color-paper-sunk)] text-[color:var(--color-ink-soft)]'
                            }`}
                          >
                            {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                    Max spice (0–5)
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={editing.spiceMax}
                      onChange={(e) => setEditing({ ...editing, spiceMax: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]">
                    <input
                      type="checkbox"
                      checked={editing.targetsManual}
                      onChange={(e) =>
                        setEditing({ ...editing, targetsManual: e.target.checked })
                      }
                      className="accent-[color:var(--color-accent)]"
                    />
                    Set targets manually
                  </label>

                  {editing.targetsManual ? (
                    <div className="grid grid-cols-2 gap-2">
                      {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
                        <label
                          key={k}
                          className="block text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]"
                        >
                          {k}
                          <input
                            type="number"
                            min={0}
                            value={editing.targets[k]}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                targets: { ...editing.targets, [k]: e.target.value },
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-3 py-2 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  ) : liveTargets ? (
                    <p className="rounded-lg bg-[color:var(--color-paper-sunk)] p-3 text-sm tabular-nums text-[color:var(--color-ink-soft)]">
                      Targets: {liveTargets.kcal} kcal · {liveTargets.protein} g protein ·{' '}
                      {liveTargets.carbs} g carbs · {liveTargets.fat} g fat
                    </p>
                  ) : null}

                  {saveError && (
                    <p className="rounded-lg bg-[color:var(--color-danger)]/10 p-3 text-sm text-[color:var(--color-danger)]" role="alert">
                      {saveError}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={saving || !editing.name.trim()}
                    onClick={() => void save()}
                    className="w-full rounded-lg bg-[color:var(--color-accent)] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>

                  {editing.id && (
                    <div className="pt-2">
                      {confirmDeleteId === editing.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void doDelete(editing.id!)}
                            className="flex-1 rounded-lg px-3 py-2 text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-paper-sunk)]"
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 rounded-lg bg-[color:var(--color-paper-sunk)] px-3 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(editing.id!)}
                          className="w-full rounded-lg px-3 py-2 text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-paper-sunk)]"
                        >
                          Delete profile
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-center text-xs text-[color:var(--color-ink-faint)]">
                    {NUTRITION_DISCLAIMER}
                  </p>
                </div>
              ) : (
                <>
                  <ul className="mb-4 space-y-1">
                    {profiles.length === 0 ? (
                      <li className="rounded-lg bg-[color:var(--color-paper-sunk)] p-4 text-sm text-[color:var(--color-ink-faint)]">
                        No profiles yet. Add who eats from this book — stays on this device.
                      </li>
                    ) : (
                      profiles.map((p) => {
                        const goalLabel =
                          GOAL_OPTIONS.find((g) => g.id === p.goal)?.label ?? p.goal;
                        const active = activeProfile?.id === p.id;
                        return (
                          <li key={p.id}>
                            <div
                              className={`flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[color:var(--color-paper-sunk)] ${
                                active ? 'bg-[color:var(--color-paper-sunk)]' : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setActiveProfileId(p.id)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              >
                                <span
                                  className="size-10 shrink-0 rounded-full"
                                  style={{ background: p.color }}
                                  aria-hidden
                                />
                                <span className="min-w-0">
                                  <span className="block truncate font-serif text-[color:var(--color-ink)]">
                                    {p.name}
                                    {active ? ' · active' : ''}
                                  </span>
                                  <span className="block truncate text-xs text-[color:var(--color-ink-faint)]">
                                    {goalLabel} · {p.targets.kcal} kcal
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(fromProfile(p))}
                                className="px-1 text-xs font-medium text-[color:var(--color-accent)]"
                              >
                                Edit
                              </button>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setEditing(emptyForm())}
                    className="w-full rounded-xl border border-dashed border-[color:var(--color-line)] px-3 py-3 text-sm text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-sunk)]"
                  >
                    + Add profile
                  </button>

                  {profiles.length > 0 && (
                    <section className="mt-5 rounded-xl bg-[color:var(--color-paper-sunk)] p-3">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                        Cooking for
                      </h3>
                      <p className="mt-1 text-xs text-[color:var(--color-ink-soft)]">
                        Mother mode allergen checks. Empty = active profile only.
                      </p>
                      <ul className="mt-2 space-y-1">
                        {profiles.map((p) => {
                          const on = cookingForIds.includes(p.id);
                          return (
                            <li key={p.id}>
                              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-sm text-[color:var(--color-ink)]">
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggleCookingFor(p.id)}
                                  className="size-4 accent-[color:var(--color-accent)]"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  <p className="mt-4 text-center text-xs text-[color:var(--color-ink-faint)]">
                    {NUTRITION_DISCLAIMER}
                  </p>
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
