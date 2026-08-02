'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { Icon } from '@/components/ui/Icon';
import { getMeta } from '@/lib/db/store';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { NUTRITION_DISCLAIMER } from '@/lib/profiles/nutrition';
import type { DiaryEntry } from '@/lib/profiles/types';

const PLAN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type PlanDay = (typeof PLAN_DAYS)[number];
type MealPlan = Partial<Record<PlanDay, string>>;

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function planDayFor(d: Date): PlanDay {
  // JS Sun=0 → plan Mon-first index
  return PLAN_DAYS[(d.getDay() + 6) % 7]!;
}

function startOfMonth(y: number, m: number): Date {
  return new Date(y, m, 1);
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function addDays(iso: string, delta: number): string {
  const [y, mo, d] = iso.split('-').map(Number);
  const dt = new Date(y!, mo! - 1, d!);
  dt.setDate(dt.getDate() + delta);
  return isoDate(dt);
}

function calcStreak(datesWithLogs: Set<string>, today: string): number {
  let streak = 0;
  let cursor = today;
  // If today has no log, start from yesterday (gentle streak)
  if (!datesWithLogs.has(today)) {
    cursor = addDays(today, -1);
  }
  while (datesWithLogs.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Month calendar — planned vs eaten, today ring, streak. */
export function CalendarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { diary, removeDiaryEntry, activeProfile, recipeMap } = useApp();
  const { goToRecipe } = useBook();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [plan, setPlan] = useState<MealPlan>({});

  const today = isoDate(now);
  const profileId = activeProfile?.id ?? null;
  const targetKcal = activeProfile?.targets.kcal ?? 2000;
  const targetProtein = activeProfile?.targets.protein ?? 120;

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    void getMeta<MealPlan>('meal-plan').then((p) => setPlan(p ?? {}));
  }, [open]);

  const profileDiary = useMemo(
    () => (profileId ? diary.filter((e) => e.profileId === profileId) : diary),
    [diary, profileId],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    for (const e of profileDiary) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [profileDiary]);

  const datesWithLogs = useMemo(() => new Set(byDate.keys()), [byDate]);

  const todayEntries = byDate.get(today) ?? [];
  const todayKcal = todayEntries.reduce((s, e) => s + e.kcal, 0);
  const todayProtein = todayEntries.reduce((s, e) => s + e.protein, 0);
  const streak = calcStreak(datesWithLogs, today);

  const weekProteinAvg = useMemo(() => {
    let sum = 0;
    let days = 0;
    for (let i = 0; i < 7; i++) {
      const key = addDays(today, -i);
      const entries = byDate.get(key);
      if (!entries?.length) continue;
      sum += entries.reduce((s, e) => s + e.protein, 0);
      days += 1;
    }
    return days > 0 ? Math.round(sum / days) : 0;
  }, [byDate, today]);

  const cells = useMemo(() => {
    const first = startOfMonth(year, month);
    const total = daysInMonth(year, month);
    const pad = first.getDay(); // Sun-first grid
    const out: ({ iso: string; day: number } | null)[] = [];
    for (let i = 0; i < pad; i++) out.push(null);
    for (let d = 1; d <= total; d++) {
      out.push({ iso: isoDate(new Date(year, month, d)), day: d });
    }
    return out;
  }, [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(null);
  };

  const selectedEntries = selected ? (byDate.get(selected) ?? []) : [];
  const selectedPlanId = selected
    ? plan[planDayFor(new Date(selected + 'T12:00:00'))]
    : undefined;
  const selectedPlanRecipe = selectedPlanId ? recipeMap[selectedPlanId] : undefined;

  const closeHandler = useCallback(() => {
    if (selectedRef.current) {
      setSelected(null);
      return;
    }
    onClose();
  }, [onClose]);

  useDialogA11y(open, closeHandler, panelRef);

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
            className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-drawer-title"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <div>
                <h2
                  id="calendar-drawer-title"
                  className="font-serif text-2xl font-semibold text-[color:var(--color-ink)]"
                >
                  Calendar
                </h2>
                <p className="text-xs text-[color:var(--color-ink-faint)]">
                  {activeProfile ? activeProfile.name : 'All profiles'} · planned vs eaten
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

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Today summary */}
              <section className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)]/55 p-3">
                <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
                  Today
                </p>
                <p className="mt-1 font-serif text-lg text-[color:var(--color-ink)]">
                  {todayKcal} / {targetKcal} kcal · {Math.round(todayProtein)} / {targetProtein} g
                  protein
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-paper)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-accent)]"
                    style={{
                      width: `${Math.min(100, Math.round((todayKcal / Math.max(targetKcal, 1)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-[color:var(--color-ink-faint)]">
                  {streak > 0 ? `${streak}-day streak` : 'No streak yet'} · weekly protein avg{' '}
                  {weekProteinAvg} g
                </p>
              </section>

              {/* Month nav */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="rounded-lg p-2 text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
                >
                  <Icon name="arrow-left" size={18} />
                </button>
                <p className="font-serif text-lg text-[color:var(--color-ink)]">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                  className="rounded-lg p-2 text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
                >
                  <Icon name="arrow-right" size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                {DOW_LABELS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                  if (!cell) return <div key={`pad-${i}`} />;
                  const entries = byDate.get(cell.iso) ?? [];
                  const kcal = entries.reduce((s, e) => s + e.kcal, 0);
                  const pct = Math.min(100, Math.round((kcal / Math.max(targetKcal, 1)) * 100));
                  const planned = !!plan[planDayFor(new Date(cell.iso + 'T12:00:00'))];
                  const isToday = cell.iso === today;
                  const isSel = cell.iso === selected;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => setSelected(cell.iso)}
                      className={`flex flex-col items-center rounded-lg px-0.5 py-1.5 text-xs transition-colors ${
                        isSel
                          ? 'bg-[color:var(--color-accent)] text-white'
                          : isToday
                            ? 'bg-[color:var(--color-paper-sunk)] text-[color:var(--color-ink)]'
                            : 'text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-sunk)]'
                      }`}
                    >
                      <span className="tabular-nums">{cell.day}</span>
                      <span
                        className={`mt-1 h-1 w-full max-w-[1.5rem] overflow-hidden rounded-full ${
                          isSel ? 'bg-white/30' : 'bg-[color:var(--color-line)]'
                        }`}
                        aria-hidden
                      >
                        <span
                          className={`block h-full ${isSel ? 'bg-white' : 'bg-[color:var(--color-accent)]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      {planned && (
                        <span
                          className={`mt-0.5 size-1 rounded-full ${
                            isSel ? 'bg-white/80' : 'bg-[color:var(--color-ink-faint)]'
                          }`}
                          title="Planned"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {selected && (
                <section className="rounded-xl border border-[color:var(--color-line)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[color:var(--color-ink)]">{selected}</h3>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-xs text-[color:var(--color-ink-faint)]"
                    >
                      Close day
                    </button>
                  </div>

                  {selectedPlanRecipe && (
                    <p className="mb-2 text-xs text-[color:var(--color-ink-faint)]">
                      Planned:{' '}
                      <button
                        type="button"
                        className="text-[color:var(--color-accent)]"
                        onClick={() => {
                          goToRecipe(selectedPlanRecipe.id);
                          onClose();
                        }}
                      >
                        {selectedPlanRecipe.title}
                      </button>
                    </p>
                  )}

                  {selectedEntries.length === 0 ? (
                    <p className="text-sm text-[color:var(--color-ink-faint)]">
                      Nothing logged this day.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedEntries.map((e) => {
                        const r = recipeMap[e.recipeId];
                        return (
                          <li
                            key={e.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[color:var(--color-paper-sunk)]"
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => {
                                if (r) {
                                  goToRecipe(r.id);
                                  onClose();
                                }
                              }}
                            >
                              <span className="block truncate font-serif text-sm text-[color:var(--color-ink)]">
                                {r?.title ?? e.recipeId}
                              </span>
                              <span className="block text-xs capitalize text-[color:var(--color-ink-faint)]">
                                {e.meal} · {e.kcal} kcal · {e.protein} g protein
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label="Remove entry"
                              onClick={() => void removeDiaryEntry(e.id)}
                              className="text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-danger)]"
                            >
                              <Icon name="close" size={16} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

              <p className="text-center text-[0.7rem] text-[color:var(--color-ink-faint)]">
                {NUTRITION_DISCLAIMER}
              </p>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
