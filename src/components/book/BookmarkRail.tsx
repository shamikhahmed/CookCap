'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CHAPTERS } from '@/lib/recipes/chapters';
import { useBook } from './BookController';

/**
 * Fat cookbook edge + chapter tabs at real 3D depths —
 * some tabs sit above neighbors, some tuck under (z + shadow + peek).
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
  desserts: 'Desserts',
  coffee: 'Chai',
  breads: 'Breads',
  baking: 'Baking',
  snacks: 'Snacks',
  meals: 'Meals',
  favorites: '♥ Jia',
  tips: 'Tips',
};

export function BookmarkRail() {
  const { index, goToChapter, locked, leaves, chapterStart, turning } = useBook();
  const reduce = useReducedMotion();
  const currentLeaf = leaves[index];
  const activeChapter =
    currentLeaf && 'chapter' in currentLeaf ? currentLeaf.chapter : null;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [tablet, setTablet] = useState(false);

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

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const tabs = CHAPTERS.map((c, i) => {
    const active = c.id === activeChapter;
    const started = index >= (chapterStart[c.id] ?? Infinity);
    return { c, active, started, i };
  });

  if (narrow) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          disabled={locked || turning}
          aria-label="Open chapter stickers"
          className="sticker-fab pointer-events-auto absolute -right-1 top-3 z-30 disabled:opacity-40"
        >
          <span className="font-serif text-[0.7rem] font-bold tracking-wide text-white">Tabs</span>
        </button>
        <AnimatePresence>
          {sheetOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                aria-label="Close chapters"
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                onClick={() => setSheetOpen(false)}
              />
              <motion.nav
                role="dialog"
                aria-modal="true"
                aria-label="Chapter stickers"
                initial={{ x: 48 }}
                animate={{ x: 0 }}
                exit={{ x: 48 }}
                className="journal-sheet relative flex h-full w-[min(18rem,90vw)] flex-col gap-2 overflow-y-auto p-5 shadow-[var(--shadow-lg)]"
              >
                <p className="mb-0.5 font-serif text-xl font-semibold text-[color:var(--color-ink)]">
                  Chapter tabs
                </p>
                <p className="mb-3 text-xs leading-relaxed text-[color:var(--color-ink-faint)]">
                  Tap a flag — pages flip toward that chapter.
                </p>
                {tabs.map(({ c, active }) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={locked || turning}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      goToChapter(c.id);
                      setSheetOpen(false);
                    }}
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
                      {STICKER[c.id] ?? c.title}
                    </span>
                    <span className="mt-0.5 block text-[0.65rem] text-white/80">{c.subtitle}</span>
                  </button>
                ))}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const n = tabs.length;
  // Reading position, 0 (cover) → 1 (last leaf). Tabs sit at different depths
  // relative to where you are: the chapter you're reading extrudes; chapters
  // already read recess into the read block; chapters ahead tuck deeper into
  // the remaining stack. The fore-edge itself thins as fewer pages remain.
  const total = Math.max(leaves.length - 1, 1);
  const cur = index / total;
  const edgeW = (2.9 + (1 - cur) * 3.4).toFixed(2); // rem — thick at start, thin near the end
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 28 };

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
          const tilt = TILT[c.id] ?? 0;
          const label = STICKER[c.id] ?? c.title;
          const startI = chapterStart[c.id] ?? 0;
          const p = startI / total; // where this chapter begins in the block
          const ahead = p >= cur - 0.001; // upcoming vs already read
          const dist = Math.min(1, Math.abs(p - cur) * 1.5);
          const near = 1 - dist; // 1 = right at the current reading depth

          const topPct = 2.2 + (i / Math.max(n - 1, 1)) * 84;
          // Deeper chapters tuck further into the block; read chapters sit shallow.
          const tuck = ahead ? 6 + dist * 30 : 3 + dist * 12;
          // Extrusion: active pokes out most; nearer-to-now chapters poke out more.
          const out = active ? 78 : (ahead ? 16 : 8) + near * 42;
          const elev = active ? 3 : near > 0.66 ? 2 : near > 0.33 ? 1 : 0;
          const z = active ? 60 : 12 + Math.round(near * 26) + (ahead ? 3 : 0);
          const yLift = active ? -6 : -(elev * 2);
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
