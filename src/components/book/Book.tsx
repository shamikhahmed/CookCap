'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animate,
  type AnimationPlaybackControls,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { type Leaf } from '@/lib/book/pages';
import { useBook } from './BookController';
import { LeafView } from './LeafView';
import { BookmarkRail } from './BookmarkRail';
import { WarmLeafPool } from './WarmLeafPool';

/**
 * Claude-baseline Apple Books page turn — single page only.
 * One curl at a time. Grab-anywhere once gesture is horizontal.
 * Chapter hops curl 1–2 pages via `animateJump`. No 2P / no leather void.
 */

const MAX_DEG = 168;
const H_INTENT = 12;

interface Turn {
  dir: 'forward' | 'backward';
  base: Leaf;
  overlay: Leaf;
}

export function Book() {
  const { index, next, prev, atStart, atEnd, locked, leaves, setTurning, animateJump, clearAnimateJump } =
    useBook();
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const deg = useMotionValue(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const active = useRef(false);
  const suppress = useRef(false);
  const prevIndex = useRef(index);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  const snapIdle = () => {
    animRef.current?.stop();
    animRef.current = null;
    active.current = false;
    setTurning(false);
    setTurn(null);
    deg.set(0);
  };

  const play = (dir: 'forward' | 'backward', base: Leaf, overlay: Leaf) => {
    animRef.current?.stop();
    active.current = true;
    setTurning(true);
    setTurn({ dir, base, overlay });
    deg.set(dir === 'forward' ? 0 : -MAX_DEG);
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
    const shouldCurl = Math.abs(delta) === 1 || animateJump;
    clearAnimateJump();
    if (reduce || !shouldCurl) {
      snapIdle();
      return;
    }
    if (active.current) {
      snapIdle();
      return;
    }
    if (delta > 0) play('forward', leaves[index]!, leaves[from]!);
    else play('backward', leaves[from]!, leaves[index]!);
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
      if (dir === 'forward') {
        setTurn({ dir, base: leaves[Math.min(leaves.length - 1, index + 1)]!, overlay: leaves[index]! });
        deg.set(0);
      } else {
        setTurn({ dir, base: leaves[index]!, overlay: leaves[Math.max(0, index - 1)]! });
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
    if (d.dir === 'forward') deg.set(Math.max(-MAX_DEG, Math.min(0, frac * MAX_DEG)));
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
    const finish = (complete: boolean, dir: 'forward' | 'backward') => {
      animRef.current?.stop();
      const to = dir === 'forward' ? (complete ? -MAX_DEG : 0) : complete ? 0 : -MAX_DEG;
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
      const settled = Math.abs(deg.get()) / MAX_DEG;
      finish(d.vel < -0.35 || settled > 0.55, 'forward');
    } else {
      const settled = (deg.get() + MAX_DEG) / MAX_DEG;
      finish(d.vel > 0.35 || settled > 0.55, 'backward');
    }
  };

  const progressAbs = useTransform(deg, (v) => Math.min(1, Math.abs(v) / MAX_DEG));
  const revealShadow = useTransform(progressAbs, [0, 0.5, 1], [0, 0.3, 0.05]);
  const sheetShade = useTransform(deg, [0, -90, -MAX_DEG], [0, 0.42, 0.64]);
  const curlOpacity = useTransform(progressAbs, [0, 0.12, 0.85, 1], [0, 0.55, 0.4, 0]);
  // Visible paper thickness on the lifting edge, and a faint bend squash — the
  // cues that make the turning sheet read as a real leaf, not a flat plane.
  const edgeThickness = useTransform(progressAbs, [0, 0.1, 0.6, 1], [0, 5, 7, 2]);
  const edgeOpacity = useTransform(progressAbs, [0, 0.1, 0.9, 1], [0, 0.7, 0.55, 0]);
  const bendSquash = useTransform(deg, [0, -84, -MAX_DEG], [1, 0.985, 1]);

  const baseLeaf = turn ? turn.base : leaves[index]!;
  const overlayLeaf = turn?.overlay ?? null;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-full w-full items-center justify-center"
      style={{ perspective: 2200 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute inset-0 rounded-[1.4rem]">
        <div
          className="absolute inset-0 rounded-[1.4rem] shadow-[var(--shadow-book)]"
          style={{ background: 'var(--color-leather-dark)' }}
        />
        {/* Spine (left) */}
        <div className="absolute inset-y-3 left-[-4px] w-[8px] rounded-l-md bg-gradient-to-l from-[color:var(--color-paper-sunk)] via-[color:var(--color-paper-sunk)]/40 to-transparent" />
        {/* Soft stack hint under open leaf (right peeks only) */}
        <div className="book-page-stack" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* Fat fore-edge + chapter tabs (one composition) */}
      <BookmarkRail />

      {/* Keep nearby pages mounted — flip should not cold-start React + images */}
      <WarmLeafPool index={index} leaves={leaves} />

      <div
        className="relative z-20 h-full w-full"
        style={{ transformStyle: 'preserve-3d', touchAction: 'pan-y' }}
      >
        {/* In-flow sheet — keeps case width solid (no absolute-only collapse). */}
        <div className="relative h-full w-full overflow-hidden rounded-[1.2rem] bg-[color:var(--color-paper)] shadow-[var(--shadow-lg)] ring-1 ring-black/5">
          <SpineGutter />
          {/* Soft cast onto the page block */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-4 bg-gradient-to-l from-black/12 to-transparent"
          />
          <LeafView leaf={baseLeaf} />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              opacity: turn ? revealShadow : 0,
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.25) 18%, transparent 55%)',
            }}
          />
        </div>

        {turn && overlayLeaf && (
          <motion.div
            className="absolute inset-0 origin-left overflow-hidden rounded-[1.2rem] bg-[color:var(--color-paper)] shadow-[var(--shadow-lg)]"
            style={{
              rotateY: deg,
              scaleX: bendSquash,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              transformPerspective: 2200,
              zIndex: 30,
            }}
          >
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
