'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useDialogA11y, motionReduce } from '@/lib/a11y/dialog';
import { Icon } from '@/components/ui/Icon';
import { type Locale, localeDir } from '@/lib/i18n/strings';

export type Skin = 'editorial' | 'candlelit' | 'lightbook' | 'modern';
/** `paper` = shipped world nav. Legacy styles kept for localStorage / code paths. */
export type TabStyle = 'paper' | 'cloth' | 'index' | 'top' | 'pills';
export type ReadMode = 'flip' | 'fast';

interface AppearanceState {
  skin: Skin;
  tabStyle: TabStyle;
  readMode: ReadMode;
  locale: Locale;
  setSkin: (s: Skin) => void;
  setTabStyle: (t: TabStyle) => void;
  setReadMode: (m: ReadMode) => void;
  setLocale: (l: Locale) => void;
}

const SKIN_KEY = 'cookcap-skin';
const TABS_KEY = 'cookcap-tabs';
const READ_KEY = 'cookcap-readmode';
const LOCALE_KEY = 'cookcap-locale';

const SKINS: Skin[] = ['editorial', 'candlelit', 'lightbook', 'modern'];
/** Shipped picker — paper tabs on wood only. */
const TABS: TabStyle[] = ['paper'];
const ALL_TABS: TabStyle[] = ['paper', 'cloth', 'index', 'top', 'pills'];
const READS: ReadMode[] = ['flip', 'fast'];

const SKIN_META: Record<Skin, { label: string; swatch: string; desk: string }> = {
  editorial: { label: 'Editorial Cream', swatch: '#f6f1e7', desk: '#efe7d7' },
  candlelit: { label: 'Candlelit', swatch: '#2a2320', desk: '#17120f' },
  lightbook: { label: 'Light Book', swatch: '#f3ecdb', desk: '#e7dcc6' },
  modern: { label: 'Modern', swatch: '#faf7f2', desk: '#f3efe9' },
};

const TAB_META: Record<TabStyle, string> = {
  paper: 'Paper tabs on wood',
  cloth: 'Cloth Tabs',
  index: 'Side Index',
  top: 'Top Segmented',
  pills: 'Classic Pills',
};

function isSkin(v: string | null): v is Skin {
  return !!v && (SKINS as string[]).includes(v);
}
function isTabs(v: string | null): v is TabStyle {
  return !!v && (ALL_TABS as string[]).includes(v);
}
function isRead(v: string | null): v is ReadMode {
  return !!v && (READS as string[]).includes(v);
}
function isLocale(v: string | null): v is Locale {
  return v === 'en' || v === 'ur';
}

function applyAppearance(skin: Skin, tabs: TabStyle, read: ReadMode, locale: Locale) {
  const root = document.documentElement;
  root.dataset.skin = skin;
  root.dataset.tabs = tabs;
  root.dataset.readmode = read;
  root.lang = locale === 'ur' ? 'ur' : 'en';
  root.dir = localeDir(locale);
}

const Ctx = createContext<AppearanceState | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<Skin>('editorial');
  const [tabStyle, setTabStyleState] = useState<TabStyle>('paper');
  const [readMode, setReadModeState] = useState<ReadMode>('flip');
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const s = localStorage.getItem(SKIN_KEY);
      const t = localStorage.getItem(TABS_KEY);
      const r = localStorage.getItem(READ_KEY);
      const loc = localStorage.getItem(LOCALE_KEY);
      const skinV = isSkin(s) ? s : 'editorial';
      const tabsV = isTabs(t) && (TABS as TabStyle[]).includes(t) ? t : 'paper';
      if (tabsV === 'paper' && t !== 'paper') {
        try {
          localStorage.setItem(TABS_KEY, 'paper');
        } catch {
          /* private */
        }
      }
      const readV = isRead(r) ? r : 'flip';
      const localeV = isLocale(loc) ? loc : 'en';
      setSkinState(skinV);
      setTabStyleState(tabsV);
      setReadModeState(readV);
      setLocaleState(localeV);
      applyAppearance(skinV, tabsV, readV, localeV);
    } catch {
      applyAppearance('editorial', 'paper', 'flip', 'en');
    }
  }, []);

  const setSkin = useCallback((s: Skin) => {
    setSkinState(s);
    try {
      localStorage.setItem(SKIN_KEY, s);
    } catch {
      /* private */
    }
    document.documentElement.dataset.skin = s;
  }, []);

  const setTabStyle = useCallback((t: TabStyle) => {
    setTabStyleState(t);
    try {
      localStorage.setItem(TABS_KEY, t);
    } catch {
      /* private */
    }
    document.documentElement.dataset.tabs = t;
  }, []);

  const setReadMode = useCallback((m: ReadMode) => {
    setReadModeState(m);
    try {
      localStorage.setItem(READ_KEY, m);
    } catch {
      /* private */
    }
    document.documentElement.dataset.readmode = m;
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {
      /* private */
    }
    document.documentElement.lang = l === 'ur' ? 'ur' : 'en';
    document.documentElement.dir = localeDir(l);
  }, []);

  const value = useMemo(
    () => ({ skin, tabStyle, readMode, locale, setSkin, setTabStyle, setReadMode, setLocale }),
    [skin, tabStyle, readMode, locale, setSkin, setTabStyle, setReadMode, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance(): AppearanceState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppearance must be used within <AppearanceProvider>');
  return ctx;
}

/** True when skin supports light/dark toggle (Candlelit / Modern). */
export function skinSupportsThemeToggle(skin: Skin): boolean {
  return skin === 'candlelit' || skin === 'modern';
}

export function AppearanceButton() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const { skin, tabStyle, readMode, locale, setSkin, setTabStyle, setReadMode, setLocale } =
    useAppearance();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  useDialogA11y(open, close, panelRef);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Appearance"
        title="Appearance"
        aria-expanded={open}
        className="grid size-10 place-items-center rounded-full text-[color:var(--color-ink-soft)] transition-all hover:bg-[color:var(--color-paper-sunk)] hover:text-[color:var(--color-ink)] active:scale-90"
      >
        <Icon name="palette" size={20} />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                data-overlay
                className={`fixed inset-0 z-[90] flex ${narrow ? 'items-end justify-center' : 'items-start justify-end p-4 pt-16 sm:pr-6'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionReduce(reduce)}
              >
                <button
                  type="button"
                  aria-label="Close appearance"
                  className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                  onClick={close}
                />
                <motion.div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="appearance-title"
                  initial={narrow ? { y: 40 } : { opacity: 0, y: -8 }}
                  animate={narrow ? { y: 0 } : { opacity: 1, y: 0 }}
                  exit={narrow ? { y: 40 } : { opacity: 0, y: -8 }}
                  transition={motionReduce(reduce)}
                  className={`relative z-10 overflow-y-auto border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] shadow-[var(--shadow-lg)] ${
                    narrow
                      ? 'max-h-[85dvh] w-full rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4'
                      : 'w-[min(22rem,calc(100vw-2rem))] rounded-xl p-4'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2
                      id="appearance-title"
                      className="font-serif text-lg font-semibold text-[color:var(--color-ink)]"
                    >
                      Appearance
                    </h2>
                    <button
                      type="button"
                      onClick={close}
                      className="min-h-11 rounded-full px-3 py-1 text-xs text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-paper-sunk)]"
                    >
                      Done
                    </button>
                  </div>

                  <section className="mb-4">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                      Theme
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SKINS.map((s) => {
                        const meta = SKIN_META[s];
                        const on = skin === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSkin(s)}
                            aria-pressed={on}
                            className={`min-h-11 rounded-lg border p-2.5 text-left transition-colors ${
                              on
                                ? 'border-[color:var(--color-accent)] bg-[color:var(--color-paper-sunk)]'
                                : 'border-[color:var(--color-line)] hover:border-[color:var(--color-ink-faint)]'
                            }`}
                          >
                            <span
                              className="mb-2 block h-8 w-full rounded-md border border-[color:var(--color-line)]"
                              style={{
                                background: `linear-gradient(135deg, ${meta.swatch} 55%, ${meta.desk})`,
                              }}
                              aria-hidden
                            />
                            <span className="block text-xs font-medium text-[color:var(--color-ink)]">
                              {meta.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="mb-4">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                      Chapter tabs
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {TABS.map((t) => {
                        const on = tabStyle === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTabStyle(t)}
                            aria-pressed={on}
                            className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                              on
                                ? 'border-[color:var(--color-accent)] bg-[color:var(--color-paper-sunk)] text-[color:var(--color-ink)]'
                                : 'border-[color:var(--color-line)] text-[color:var(--color-ink-soft)] hover:border-[color:var(--color-ink-faint)]'
                            }`}
                          >
                            {TAB_META[t]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[0.7rem] leading-snug text-[color:var(--color-ink-faint)]">
                      Index tabs stuck to the wooden table beside the book.
                    </p>
                  </section>

                  <section className="mb-4">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                      Reading
                    </p>
                    <div
                      className="flex overflow-hidden rounded-lg border border-[color:var(--color-line)]"
                      role="group"
                      aria-label="Reading mode"
                    >
                      {READS.map((m) => {
                        const on = readMode === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setReadMode(m)}
                            aria-pressed={on}
                            className={`min-h-11 flex-1 px-3 py-2 text-sm capitalize transition-colors ${
                              on
                                ? 'bg-[color:var(--color-accent)] text-white'
                                : 'bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-sunk)]'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[0.7rem] leading-snug text-[color:var(--color-ink-faint)]">
                      Flip keeps page-turn hops. Fast jumps chapters instantly.
                    </p>
                  </section>

                  <section>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                      Labels
                    </p>
                    <div
                      className="flex overflow-hidden rounded-lg border border-[color:var(--color-line)]"
                      role="group"
                      aria-label="Language"
                    >
                      {(
                        [
                          { id: 'en' as const, label: 'English' },
                          { id: 'ur' as const, label: 'Roman Urdu' },
                        ] as const
                      ).map((opt) => {
                        const on = locale === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setLocale(opt.id)}
                            aria-pressed={on}
                            className={`min-h-11 flex-1 px-3 py-2 text-sm transition-colors ${
                              on
                                ? 'bg-[color:var(--color-accent)] text-white'
                                : 'bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-sunk)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[0.7rem] leading-snug text-[color:var(--color-ink-faint)]">
                      Stub pack — chrome labels only. True Urdu script / RTL later.
                    </p>
                  </section>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
