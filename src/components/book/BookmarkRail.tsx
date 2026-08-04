'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CHAPTERS } from '@/lib/recipes/chapters';
import { motionReduce, useDialogA11y } from '@/lib/a11y/dialog';
import { useAppearance, type TabStyle } from '@/components/app/Appearance';
import { useApp } from '@/components/app/AppStore';
import { favoritesLabel } from '@/lib/edition';
import { useBook } from './BookController';

/**
 * Chapter nav — paper tabs on the wooden table (shipped default),
 * plus legacy cloth / index / top / pills paths.
 */

const TILT: Record<string, number> = {
  pakistani: -1.4,
  chinese: 1.8,
  italian: -0.9,
  desserts: 2.2,
  coffee: -1.8,
  breads: 1.0,
  baking: -2.4,
  snacks: 1.5,
  meals: -0.6,
  favorites: 2.6,
  tips: -1.6,
};

const STICKER: Record<string, string> = {
  pakistani: 'Pakistani',
  chinese: 'Chinese',
  italian: 'Italian',
  european: 'Europe',
  world: 'World',
  desserts: 'Desserts',
  coffee: 'Chai',
  breakfast: 'Breakfast',
  breads: 'Breads',
  baking: 'Baking',
  snacks: 'Snacks',
  vegetarian: 'Veg',
  meals: 'Meals',
  favorites: '♥',
  tips: 'Tips',
};

function tabLabel(id: string, title: string, favLabel: string) {
  if (id === 'favorites') return favLabel.length > 12 ? '♥ Favs' : `♥ ${favLabel.replace(/'s Favorites$/, '')}`;
  return STICKER[id] ?? title;
}

function useChapterTabs() {
  const { index, goToChapter, locked, leaves, chapterStart, turning } = useBook();
  const { edition } = useApp();
  const favLabel = favoritesLabel(edition);
  const currentLeaf = leaves[index];
  const activeChapter =
    currentLeaf && 'chapter' in currentLeaf ? currentLeaf.chapter : null;
  const tabs = CHAPTERS.map((c, i) => {
    const active = c.id === activeChapter;
    const started = index >= (chapterStart[c.id] ?? Infinity);
    return { c, active, started, i };
  });
  return { tabs, goToChapter, locked, turning, index, leaves, chapterStart, favLabel };
}

/** Slim segmented control when data-tabs=top (desktop + tablet). */
export function TopChapterBar() {
  const { tabStyle } = useAppearance();
  const { tabs, goToChapter, locked, turning, favLabel } = useChapterTabs();
  const [narrow, setNarrow] = useState(true);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)');
    const apply = () => setNarrow(phone.matches);
    apply();
    phone.addEventListener('change', apply);
    return () => phone.removeEventListener('change', apply);
  }, []);

  if (tabStyle !== 'top' || narrow) return null;

  return (
    <nav aria-label="Chapters" className="chapter-top shrink-0 px-2 sm:px-0">
      {tabs.map(({ c, active }) => (
        <button
          key={c.id}
          type="button"
          className="chapter-top__btn"
          disabled={locked || turning}
          aria-current={active ? 'page' : undefined}
          onClick={() => goToChapter(c.id)}
        >
          {tabLabel(c.id, c.title, favLabel)}
        </button>
      ))}
    </nav>
  );
}

function PaperSheetTabs({ onPick }: { onPick: (id: string) => void }) {
  const { tabs, locked, turning, favLabel } = useChapterTabs();
  return (
    <div className="paper-sheet-tabs flex flex-col gap-1.5">
      {tabs.map(({ c, active }) => (
        <button
          key={c.id}
          type="button"
          disabled={locked || turning}
          aria-current={active ? 'page' : undefined}
          onClick={() => onPick(c.id)}
          className={`paper-tab paper-tab--sheet disabled:opacity-40${active ? ' is-active' : ''}`}
          style={{ '--sticker': c.tab } as CSSProperties}
        >
          <span className="paper-tab__label">{tabLabel(c.id, c.title, favLabel)}</span>
          <span className="paper-tab__sub">{c.subtitle}</span>
        </button>
      ))}
    </div>
  );
}

function SheetChips({
  tabStyle,
  onPick,
}: {
  tabStyle: TabStyle;
  onPick: (id: string) => void;
}) {
  const { tabs, locked, turning, favLabel } = useChapterTabs();

  if (tabStyle === 'paper') {
    return <PaperSheetTabs onPick={onPick} />;
  }

  if (tabStyle === 'index' || tabStyle === 'top') {
    return (
      <div className="flex flex-col">
        {tabs.map(({ c, active }) => (
          <button
            key={c.id}
            type="button"
            disabled={locked || turning}
            aria-current={active ? 'page' : undefined}
            onClick={() => onPick(c.id)}
            className="chapter-index__row disabled:opacity-40"
            style={{ '--sticker': c.tab } as CSSProperties}
          >
            <span className="chapter-index__dot" aria-hidden />
            <span>
              {tabLabel(c.id, c.title, favLabel)}
              <span className="mt-0.5 block text-[0.65rem] font-sans font-normal tracking-normal text-[color:var(--color-ink-faint)]">
                {c.subtitle}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      {tabs.map(({ c, active }) => (
        <button
          key={c.id}
          type="button"
          disabled={locked || turning}
          aria-current={active ? 'page' : undefined}
          onClick={() => onPick(c.id)}
          className="sticker-chip text-left disabled:opacity-40"
          style={
            {
              '--sticker': c.tab,
              transform: `rotate(${TILT[c.id] ?? 0}deg)`,
              outline: active
                ? '2px solid color-mix(in srgb, var(--color-ink) 35%, transparent)'
                : undefined,
            } as CSSProperties
          }
        >
          <span className="font-serif text-sm font-semibold text-white">
            {tabLabel(c.id, c.title, favLabel)}
          </span>
          <span className="mt-0.5 block text-[0.65rem] text-white/80">{c.subtitle}</span>
        </button>
      ))}
    </>
  );
}

function PaperTabRail({ tablet }: { tablet: boolean }) {
  const { tabs, goToChapter, locked, turning, favLabel } = useChapterTabs();
  const reduce = useReducedMotion();
  const n = tabs.length;
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 32 };
  const [peeling, setPeeling] = useState(false);

  useEffect(() => {
    let clearT: number | undefined;
    const startPeel = () => {
      if (reduce) return;
      setPeeling(true);
      if (clearT) window.clearTimeout(clearT);
      clearT = window.setTimeout(() => setPeeling(false), 320 + n * 40 + 80);
    };
    try {
      if (sessionStorage.getItem('cookcap-tabs-peel') === '1') {
        sessionStorage.removeItem('cookcap-tabs-peel');
        startPeel();
      }
    } catch {
      /* private */
    }
    const onPeel = () => startPeel();
    window.addEventListener('cookcap-tabs-peel', onPeel);
    return () => {
      window.removeEventListener('cookcap-tabs-peel', onPeel);
      if (clearT) window.clearTimeout(clearT);
    };
  }, [n, reduce]);

  return (
    <aside
      className={`paper-tab-rail pointer-events-none${tablet ? ' paper-tab-rail--tablet' : ''}${
        peeling ? ' is-peeling' : ''
      }`}
    >
      <nav aria-label="Chapter tabs" className="paper-tab-rail__nav pointer-events-auto">
        {tabs.map(({ c, active, i }) => {
          const label = tabLabel(c.id, c.title, favLabel);
          const topPct = 2 + (i / Math.max(n - 1, 1)) * 88;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => goToChapter(c.id)}
              disabled={locked || turning}
              aria-current={active ? 'page' : undefined}
              title={`${c.title} — ${c.subtitle}`}
              onPointerDown={(e) => e.stopPropagation()}
              initial={false}
              animate={{
                x: active ? 6 : 0,
                y: active ? -2 : 0,
                scale: active ? 1.04 : 1,
              }}
              whileHover={
                locked || turning || reduce
                  ? undefined
                  : { x: 10, y: -3, scale: active ? 1.06 : 1.03 }
              }
              whileTap={locked || turning || reduce ? undefined : { scale: 0.98, y: 1 }}
              transition={spring}
              className={`paper-tab disabled:opacity-40${active ? ' is-active' : ''}`}
              style={
                {
                  '--sticker': c.tab,
                  '--tab-i': i,
                  top: `${topPct}%`,
                  zIndex: active ? 40 : 10 + i,
                } as CSSProperties
              }
            >
              <span className="paper-tab__label">{label}</span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}

export function BookmarkRail() {
  const { tabStyle } = useAppearance();
  const { tabs, goToChapter, locked, turning, index, leaves, chapterStart, favLabel } = useChapterTabs();
  const reduce = useReducedMotion();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [tablet, setTablet] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 639px)');
    const pad = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');
    const apply = () => {
      setNarrow(phone.matches);
      setTablet(pad.matches);
    };
    apply();
    phone.addEventListener('change', apply);
    pad.addEventListener('change', apply);
    return () => {
      phone.removeEventListener('change', apply);
      pad.removeEventListener('change', apply);
    };
  }, []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  useDialogA11y(sheetOpen, closeSheet, sheetRef);

  useEffect(() => {
    const open = () => setSheetOpen(true);
    window.addEventListener('cookcap-open-chapters', open);
    return () => window.removeEventListener('cookcap-open-chapters', open);
  }, []);

  if (narrow) {
    const woodSheet = tabStyle === 'paper';
    return (
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionReduce(reduce)}
          >
            <button
              type="button"
              aria-label="Close chapters"
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={closeSheet}
            />
            <motion.nav
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chapter-sheet-title"
              initial={{ x: 48 }}
              animate={{ x: 0 }}
              exit={{ x: 48 }}
              transition={motionReduce(reduce)}
              className={`journal-sheet relative flex h-full w-[min(18rem,90vw)] flex-col gap-2 overflow-y-auto p-5 shadow-[var(--shadow-lg)]${
                woodSheet ? ' journal-sheet--wood' : ''
              }`}
            >
              <p
                id="chapter-sheet-title"
                className="mb-0.5 font-serif text-xl font-semibold text-[color:var(--color-ink)]"
              >
                Chapter tabs
              </p>
              <p className="mb-3 text-xs leading-relaxed text-[color:var(--color-ink-faint)]">
                {woodSheet
                  ? 'Paper tabs stuck to the table — tap to flip toward that chapter.'
                  : 'Tap a flag — pages flip toward that chapter.'}
              </p>
              <SheetChips
                tabStyle={tabStyle}
                onPick={(id) => {
                  goToChapter(id);
                  closeSheet();
                }}
              />
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (tabStyle === 'paper') {
    return <PaperTabRail tablet={tablet} />;
  }

  // Top style: rail hidden (CSS + skip render)
  if (tabStyle === 'top') return null;

  const n = tabs.length;
  const total = Math.max(leaves.length - 1, 1);
  const cur = index / total;
  const edgeW = (2.9 + (1 - cur) * 3.4).toFixed(2);
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 28 };
  const depthOn = tabStyle === 'cloth' || tabStyle === 'pills';

  if (tabStyle === 'index') {
    return (
      <aside
        className={`book-edge pointer-events-none${tablet ? ' book-edge--tablet' : ''}`}
        style={{ '--edge-w': '0.55rem' } as CSSProperties}
      >
        <div className="book-edge__block" aria-hidden>
          <div className="book-edge__pages" />
          <div className="book-edge__shade" />
          <div className="book-edge__lip" />
          <div className="book-edge__bevel" />
        </div>
        <nav aria-label="Chapter index" className="chapter-index pointer-events-auto">
          {tabs.map(({ c, active }) => (
            <button
              key={c.id}
              type="button"
              disabled={locked || turning}
              aria-current={active ? 'page' : undefined}
              title={`${c.title} — ${c.subtitle}`}
              onClick={() => goToChapter(c.id)}
              onPointerDown={(e) => e.stopPropagation()}
              className="chapter-index__row disabled:opacity-40"
              style={{ '--sticker': c.tab } as CSSProperties}
            >
              <span className="chapter-index__dot" aria-hidden />
              {tabLabel(c.id, c.title, favLabel)}
            </button>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={`book-edge pointer-events-none${tablet ? ' book-edge--tablet' : ''}`}
      aria-hidden={false}
      style={{ '--edge-w': `${edgeW}rem` } as CSSProperties}
    >
      <div className="book-edge__block" aria-hidden>
        <div className="book-edge__pages" />
        <div className="book-edge__shade" />
        <div className="book-edge__lip" />
        <div className="book-edge__bevel" />
      </div>

      <nav aria-label="Chapter stickers" className="book-edge__tabs" style={{ perspective: 600 }}>
        {tabs.map(({ c, active, i }) => {
          const tilt = depthOn ? (TILT[c.id] ?? 0) : 0;
          const label = tabLabel(c.id, c.title, favLabel);
          const startI = chapterStart[c.id] ?? 0;
          const p = startI / total;
          const ahead = p >= cur - 0.001;
          const dist = Math.min(1, Math.abs(p - cur) * 1.5);
          const near = 1 - dist;

          const topPct = 2.2 + (i / Math.max(n - 1, 1)) * 84;
          const tuck = 0;
          const out = depthOn
            ? active
              ? 76
              : (ahead ? 18 : 10) + near * 38
            : active
              ? 64
              : 40;
          const elev = active ? 3 : near > 0.66 ? 2 : near > 0.33 ? 1 : 0;
          const z = active ? 60 : 12 + Math.round(near * 26) + (ahead ? 3 : 0);
          const yLift = depthOn ? (active ? -6 : -(elev * 2)) : 0;
          const op = active ? 1 : ahead ? 0.95 : 0.78;

          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => goToChapter(c.id)}
              disabled={locked || turning}
              aria-current={active ? 'page' : undefined}
              title={`${c.title} — ${c.subtitle}`}
              onPointerDown={(e) => e.stopPropagation()}
              initial={false}
              animate={{ x: out, y: yLift, rotate: tilt, scale: active ? 1.08 : 1 }}
              whileHover={
                locked || turning || reduce
                  ? undefined
                  : { x: out + 14, y: yLift - 3, scale: active ? 1.1 : 1.06, rotate: tilt * 0.4 }
              }
              transition={spring}
              className={`sticker-tab pointer-events-auto disabled:opacity-40 elev-${elev}${ahead ? '' : ' sticker-tab--recessed'}`}
              style={
                {
                  '--sticker': c.tab,
                  '--elev': elev,
                  top: `${topPct}%`,
                  marginLeft: `${tuck}px`,
                  zIndex: z,
                  opacity: op,
                } as CSSProperties
              }
            >
              <span className="sticker-slit sticker-slit--top" aria-hidden />
              <span className="sticker-slit sticker-slit--bot" aria-hidden />
              <span className="sticker-stem" aria-hidden />
              <span className="sticker-face">
                <span className="sticker-label">{label}</span>
              </span>
              {active && <span className="sticker-pin" aria-hidden />}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
