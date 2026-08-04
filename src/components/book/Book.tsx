'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animate,
  type AnimationPlaybackControls,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { type Leaf } from '@/lib/book/pages';
import { EASE_PAGE } from '@/lib/motion';
import { useBook } from './BookController';
import { LeafView } from './LeafView';
import { BookmarkRail } from './BookmarkRail';
import { WarmLeafPool } from './WarmLeafPool';

/**
 * Claude-baseline Apple Books page turn — single page only.
 * Cover→title uses hinge ceremony (bible §6). Else one curl at a time.
 * Chapter hops curl 1–2 pages via `animateJump`. No 2P / no leather void.
 */

const MAX_DEG = 168;
/** Cover open — paper snap at −160° (bible §6), not full leaf curl. */
const COVER_DEG = 160;
const COVER_MS = 0.62;
/** Lower than desktop so phone horizontal drags win over scroll sooner. */
const H_INTENT = 8;

interface Turn {
  dir: 'forward' | 'backward';
  base: Leaf;
  overlay: Leaf;
  /** First open: leather cover hinge, not paper curl. */
  kind?: 'page' | 'cover';
}

export function Book() {
  const { index, next, prev, atStart, atEnd, locked, leaves, setTurning, animateJump, clearAnimateJump } =
    useBook();
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const deg = useMotionValue(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [rmFade, setRmFade] = useState(false);
  const active = useRef(false);
  const suppress = useRef(false);
  const coverOpenRef = useRef(false);
  const prevIndex = useRef(index);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  const snapIdle = () => {
    animRef.current?.stop();
    animRef.current = null;
    active.current = false;
    coverOpenRef.current = false;
    setTurning(false);
    setTurn(null);
    deg.set(0);
    if (containerRef.current) containerRef.current.style.touchAction = '';
  };

  const play = (
    dir: 'forward' | 'backward',
    base: Leaf,
    overlay: Leaf,
    kind: 'page' | 'cover' = 'page',
  ) => {
    animRef.current?.stop();
    active.current = true;
    coverOpenRef.current = kind === 'cover';
    setTurning(true);
    setTurn({ dir, base, overlay, kind });
    const max = kind === 'cover' ? COVER_DEG : MAX_DEG;
    deg.set(dir === 'forward' ? 0 : -max);
    if (kind === 'cover' && dir === 'forward') {
      animRef.current = animate(deg, -COVER_DEG, {
        type: 'tween',
        duration: COVER_MS,
        ease: EASE_PAGE,
        onComplete: snapIdle,
      });
      return;
    }
    animRef.current = animate(deg, dir === 'forward' ? -MAX_DEG : 0, {
      type: 'spring',
      stiffness: 90,
      damping: 20,
      restDelta: 0.5,
      onComplete: snapIdle,
    });
  };

  useEffect(() => {
    const from = prevIndex.current;
    prevIndex.current = index;
    if (from === index) return;
    if (suppress.current) {
      suppress.current = false;
      snapIdle();
      return;
    }
    const delta = index - from;
    const coverOpen = from === 0 && delta === 1 && leaves[from]?.kind === 'cover';
    const shouldCurl = Math.abs(delta) === 1 || animateJump;
    clearAnimateJump();
    if (reduce) {
      snapIdle();
      if (coverOpen) {
        setRmFade(true);
        const t = window.setTimeout(() => setRmFade(false), 200);
        return () => window.clearTimeout(t);
      }
      return;
    }
    if (!shouldCurl) {
      snapIdle();
      return;
    }
    if (active.current) {
      snapIdle();
      return;
    }
    if (delta > 0) {
      play('forward', leaves[index]!, leaves[from]!, coverOpen ? 'cover' : 'page');
    } else {
      play('backward', leaves[from]!, leaves[index]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      if (e.repeat) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, locked]);

  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    engaged: boolean;
    dir: 'forward' | 'backward' | null;
    engageX: number;
    lastX: number;
    lastT: number;
    vel: number;
    downTarget: Element | null;
  } | null>(null);

  const width = () => containerRef.current?.clientWidth ?? 1;

  const onPointerDown = (e: React.PointerEvent) => {
    if (locked || reduce || active.current || turn) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest('input, textarea, select, button, a, [data-no-flip]')) return;
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      engaged: false,
      dir: null,
      engageX: e.clientX,
      lastX: e.clientX,
      lastT: performance.now(),
      vel: 0,
      downTarget: target,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.engaged) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > H_INTENT) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < H_INTENT) return;
      const dir = dx < 0 ? 'forward' : 'backward';
      if ((dir === 'forward' && atEnd) || (dir === 'backward' && atStart)) {
        drag.current = null;
        return;
      }
      d.engaged = true;
      d.dir = dir;
      d.engageX = e.clientX;
      active.current = true;
      setTurning(true);
      try {
        (e.currentTarget as HTMLElement).style.touchAction = 'none';
      } catch {
        /* ignore */
      }
      if (dir === 'forward') {
        const cover = index === 0 && leaves[index]?.kind === 'cover';
        coverOpenRef.current = cover;
        setTurn({
          dir,
          base: leaves[Math.min(leaves.length - 1, index + 1)]!,
          overlay: leaves[index]!,
          kind: cover ? 'cover' : 'page',
        });
        deg.set(0);
      } else {
        coverOpenRef.current = false;
        setTurn({ dir, base: leaves[index]!, overlay: leaves[Math.max(0, index - 1)]!, kind: 'page' });
        deg.set(-MAX_DEG);
      }
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }

    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.vel = 0.6 * d.vel + 0.4 * ((e.clientX - d.lastX) / dt);
    d.lastX = e.clientX;
    d.lastT = now;

    const frac = (e.clientX - d.engageX) / width();
    const max = coverOpenRef.current ? COVER_DEG : MAX_DEG;
    if (d.dir === 'forward') deg.set(Math.max(-max, Math.min(0, frac * max)));
    else deg.set(Math.max(-MAX_DEG, Math.min(0, -MAX_DEG + frac * MAX_DEG)));
    e.preventDefault();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;

    if (!d.engaged || !d.dir) {
      if (
        Math.abs(d.lastX - d.startX) < 8 &&
        Math.abs(e.clientY - d.startY) < 8 &&
        d.downTarget?.closest('[data-tap-advance]') &&
        !atEnd
      ) {
        next();
      }
      return;
    }

    const v = Math.max(-2.5, Math.min(2.5, d.vel));
    const cover = coverOpenRef.current;
    const max = cover ? COVER_DEG : MAX_DEG;
    const finish = (complete: boolean, dir: 'forward' | 'backward') => {
      animRef.current?.stop();
      const to = dir === 'forward' ? (complete ? -max : 0) : complete ? 0 : -MAX_DEG;
      if (cover && dir === 'forward') {
        animRef.current = animate(deg, to, {
          type: 'tween',
          duration: complete
            ? Math.max(0.18, COVER_MS * (1 - Math.abs(deg.get()) / COVER_DEG))
            : 0.28,
          ease: EASE_PAGE,
          onComplete: () => {
            if (complete) {
              setTurning(false);
              suppress.current = true;
              try {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  navigator.vibrate(12);
                }
              } catch {
                /* unsupported */
              }
              next();
            } else {
              suppress.current = false;
            }
            snapIdle();
          },
        });
        return;
      }
      animRef.current = animate(deg, to, {
        type: 'spring',
        stiffness: 110,
        damping: 18,
        velocity: v * 120,
        restDelta: 0.5,
        onComplete: () => {
          if (complete) {
            setTurning(false);
            suppress.current = true;
            try {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(12);
              }
            } catch {
              /* unsupported */
            }
            if (dir === 'forward') next();
            else prev();
          } else {
            suppress.current = false;
          }
          snapIdle();
        },
      });
    };

    if (d.dir === 'forward') {
      const settled = Math.abs(deg.get()) / max;
      finish(d.vel < -0.35 || settled > 0.55, 'forward');
    } else {
      const settled = (deg.get() + MAX_DEG) / MAX_DEG;
      finish(d.vel > 0.35 || settled > 0.55, 'backward');
    }
  };

  const progressAbs = useTransform(deg, (v) => {
    const max = coverOpenRef.current ? COVER_DEG : MAX_DEG;
    return Math.min(1, Math.abs(v) / max);
  });
  const revealShadow = useTransform(progressAbs, [0, 0.5, 1], [0, 0.35, 0.06]);
  /** Cover cast shadow peaks mid-swing (−90°), then fades (bible §6). */
  const castShadow = useTransform(deg, (v) => {
    if (!coverOpenRef.current) return 0;
    const a = Math.abs(v);
    if (a <= 90) return (a / 90) * 0.42;
    return 0.42 * (1 - (a - 90) / (COVER_DEG - 90));
  });
  const gutterDepth = useTransform(deg, (v) => {
    if (!coverOpenRef.current) return 0.14;
    return 0.14 + 0.22 * Math.min(1, Math.abs(v) / COVER_DEG);
  });
  const sheetShade = useTransform(deg, [0, -90, -MAX_DEG], [0, 0.48, 0.68]);
  const curlOpacity = useTransform(progressAbs, [0, 0.12, 0.85, 1], [0, 0.62, 0.45, 0]);
  // Visible paper thickness on the lifting edge, and a faint bend squash — the
  // cues that make the turning sheet read as a real leaf, not a flat plane.
  const edgeThickness = useTransform(progressAbs, [0, 0.1, 0.6, 1], [0, 6, 8, 2.5]);
  const edgeOpacity = useTransform(progressAbs, [0, 0.1, 0.9, 1], [0, 0.78, 0.58, 0]);
  const bendSquash = useTransform(deg, [0, -84, -MAX_DEG], [1, 0.982, 1]);

  const baseLeaf = turn ? turn.base : leaves[index]!;
  const overlayLeaf = turn?.overlay ?? null;
  const isCoverOpen = turn?.kind === 'cover';

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-full w-full items-center justify-center touch-pan-y"
      style={{ perspective: 'min(1400px, 120vw)' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Hardcover case — desktop/tablet only. Phone is a full-bleed leaf. */}
      <div className="absolute inset-0 hidden rounded-[1.4rem] sm:block">
        <div
          className="absolute inset-0 rounded-[1.4rem] shadow-[var(--shadow-book)]"
          style={{ background: 'var(--color-leather-dark)' }}
        />
        <div className="absolute inset-y-3 left-[-4px] w-[8px] rounded-l-md bg-gradient-to-l from-[color:var(--color-paper-sunk)] via-[color:var(--color-paper-sunk)]/40 to-transparent" />
        <div className="book-page-stack" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <BookmarkRail />

      <WarmLeafPool index={index} leaves={leaves} />

      <div
        className="relative z-20 h-full w-full"
        style={{ transformStyle: 'preserve-3d', touchAction: 'pan-y' }}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-none bg-[color:var(--color-paper)] shadow-none ring-0 sm:rounded-[1.2rem] sm:shadow-[var(--shadow-lg)] sm:ring-1 sm:ring-black/5 ${rmFade ? 'book-cover-rm-fade' : ''}`}
        >
          <SpineGutter />
          {isCoverOpen && <CoverSpineGutter depth={gutterDepth} />}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[5] hidden w-4 bg-gradient-to-l from-black/12 to-transparent sm:block"
          />
          {isCoverOpen && (
            <div className="book-cover-fan" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
          <LeafView leaf={baseLeaf} />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              opacity: turn ? (isCoverOpen ? castShadow : revealShadow) : 0,
              background: isCoverOpen
                ? 'radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.55), transparent 65%)'
                : 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 18%, transparent 55%)',
            }}
          />
        </div>

        {turn && overlayLeaf && (
          <motion.div
            className={`absolute inset-0 origin-left rounded-none shadow-none sm:rounded-[1.2rem] sm:shadow-[var(--shadow-lg)] ${isCoverOpen ? 'overflow-visible bg-transparent' : 'overflow-hidden bg-[color:var(--color-paper)]'}`}
            style={{
              rotateY: deg,
              scaleX: isCoverOpen ? 1 : bendSquash,
              transformStyle: 'preserve-3d',
              backfaceVisibility: isCoverOpen ? 'visible' : 'hidden',
              transformPerspective: 1800,
              zIndex: 30,
            }}
          >
            {isCoverOpen ? (
              <>
                <div
                  className="absolute inset-0 overflow-hidden rounded-none sm:rounded-[1.2rem]"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <LeafView leaf={overlayLeaf} />
                </div>
                <div
                  className="book-cover-inside absolute inset-0 overflow-hidden rounded-none sm:rounded-[1.2rem]"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                  aria-hidden
                >
                  <div className="flex h-full w-full flex-col items-center justify-center bg-[color:var(--color-paper)] px-8 text-center">
                    <p className="font-serif text-sm italic text-[color:var(--color-ink-faint)]">
                      Made &amp; Kept with Love
                    </p>
                    <div className="mt-6 h-px w-16 bg-[color:var(--color-line)]" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <SpineGutter />
                <LeafView leaf={overlayLeaf} />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-20 bg-black"
                  style={{ opacity: sheetShade }}
                />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/3"
                  style={{
                    opacity: curlOpacity,
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.35) 70%, rgba(255,255,255,0.55))',
                  }}
                />
                {/* Paper thickness on the cut edge — the leaf's visible depth. */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 z-30 rounded-r-[1.2rem]"
                  style={{
                    width: edgeThickness,
                    opacity: edgeOpacity,
                    background:
                      'linear-gradient(90deg, rgba(120,90,60,0.15), rgba(60,40,22,0.55) 60%, rgba(30,18,10,0.7))',
                  }}
                />
              </>
            )}
          </motion.div>
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        Page {index + 1} of {leaves.length}
      </span>
    </div>
  );
}

function SpineGutter() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/14 via-black/5 to-transparent" />
  );
}

/** Deepens as cover swings open (bible §6 spine gutter). */
function CoverSpineGutter({ depth }: { depth: MotionValue<number> }) {
  const background = useTransform(
    depth,
    (d) =>
      `linear-gradient(90deg, rgba(0,0,0,${d}) 0%, rgba(0,0,0,${d * 0.4}) 40%, transparent 100%)`,
  );
  return (
    <motion.div
      className="pointer-events-none absolute inset-y-0 left-0 z-[11] w-14"
      style={{ background }}
    />
  );
}
