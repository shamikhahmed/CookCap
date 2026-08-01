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
import { useApp } from '@/components/app/AppStore';
import { leafOfRecipe, type Leaf } from '@/lib/book/pages';
import { playPageFlip } from '@/lib/sound/flip';

/**
 * Reader position. Single-page steps; chapter jumps can flip 1–2 pages
 * toward the target so stickers feel like real book tabs.
 */

interface BookState {
  index: number;
  total: number;
  next: () => void;
  prev: () => void;
  goToLeaf: (i: number) => void;
  goToChapter: (id: string) => void;
  goToRecipe: (id: string) => void;
  atStart: boolean;
  atEnd: boolean;
  locked: boolean;
  setLocked: (v: boolean) => void;
  turning: boolean;
  setTurning: (v: boolean) => void;
  /** When true, Book.tsx animates even if jump is farther than 1 page. */
  animateJump: boolean;
  clearAnimateJump: () => void;
  leaves: Leaf[];
  chapterStart: Record<string, number>;
  step: number;
  spreadActive: boolean;
}

const Ctx = createContext<BookState | null>(null);
const POS_KEY = 'jia-pos';

export function BookController({ children }: { children: ReactNode }) {
  const { leaves, chapterStart, soundOn } = useApp();
  const step = 1;
  const spreadActive = false;

  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [turning, setTurningState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [animateJump, setAnimateJump] = useState(false);

  const turningRef = useRef(false);
  const lockedRef = useRef(false);
  const indexRef = useRef(0);
  const hopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  lockedRef.current = locked;
  indexRef.current = index;

  const setTurning = useCallback((v: boolean) => {
    turningRef.current = v;
    setTurningState(v);
  }, []);

  const clearAnimateJump = useCallback(() => setAnimateJump(false), []);

  useEffect(() => {
    return () => {
      if (hopTimer.current) clearTimeout(hopTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hydrated) return;
    if (leaves.length < 2) return;

    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('recipe');
    if (recipeId) {
      const t = leafOfRecipe(recipeId, leaves);
      if (t >= 0) setIndex(t);
      setHydrated(true);
      return;
    }

    const saved = Number(localStorage.getItem(POS_KEY) ?? localStorage.getItem('grimoire-pos'));
    if (Number.isFinite(saved) && saved > 0 && saved < leaves.length) setIndex(saved);
    setHydrated(true);
  }, [leaves, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(POS_KEY, String(index));
  }, [index, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setIndex((i) => Math.max(0, Math.min(leaves.length - 1, i)));
  }, [leaves.length, hydrated]);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(leaves.length - 1, i)),
    [leaves.length],
  );

  const next = useCallback(() => {
    if (lockedRef.current || turningRef.current) return;
    setIndex((i) => {
      const n = clamp(i + step);
      if (n !== i) playPageFlip(!soundOn);
      return n;
    });
  }, [clamp, step, soundOn]);

  const prev = useCallback(() => {
    if (lockedRef.current || turningRef.current) return;
    setIndex((i) => {
      const n = clamp(i - step);
      if (n !== i) playPageFlip(!soundOn);
      return n;
    });
  }, [clamp, step, soundOn]);

  const goToLeaf = useCallback(
    (i: number) => {
      if (lockedRef.current) return;
      if (hopTimer.current) clearTimeout(hopTimer.current);
      setTurning(false);
      setAnimateJump(false);
      setIndex(clamp(i));
    },
    [clamp, setTurning],
  );

  const goToChapter = useCallback(
    (id: string) => {
      if (lockedRef.current || turningRef.current) return;
      const t = chapterStart[id];
      if (t == null) return;
      const target = clamp(t);
      const from = indexRef.current;
      if (target === from) return;

      if (hopTimer.current) clearTimeout(hopTimer.current);

      const delta = target - from;
      const sign = delta > 0 ? 1 : -1;
      // Far hop: flip 1–2 pages toward chapter, then land with a curl.
      const hops = Math.abs(delta) > 10 ? 2 : Math.abs(delta) > 1 ? 1 : 0;

      playPageFlip(!soundOn);
      setAnimateJump(true);

      if (hops === 0) {
        setIndex(target);
        return;
      }

      if (hops === 1) {
        setIndex(target);
        return;
      }

      // Two-beat flip: mid page, then destination.
      const mid = clamp(from + sign * Math.min(3, Math.abs(delta) - 1));
      setIndex(mid);
      hopTimer.current = setTimeout(() => {
        if (lockedRef.current) return;
        playPageFlip(!soundOn);
        setAnimateJump(true);
        setIndex(target);
      }, 520);
    },
    [chapterStart, clamp, setTurning, soundOn],
  );

  const goToRecipe = useCallback(
    (id: string) => {
      if (lockedRef.current) return;
      if (hopTimer.current) clearTimeout(hopTimer.current);
      const t = leafOfRecipe(id, leaves);
      if (t >= 0) {
        const target = clamp(t);
        const from = indexRef.current;
        setTurning(false);
        // Short recipe hops get a curl; long ones stay snappy.
        setAnimateJump(Math.abs(target - from) > 0 && Math.abs(target - from) <= 4);
        setIndex(target);
        if (Math.abs(target - from) > 0) playPageFlip(!soundOn);
      }
    },
    [leaves, clamp, setTurning, soundOn],
  );

  const value = useMemo<BookState>(
    () => ({
      index,
      total: leaves.length,
      next,
      prev,
      goToLeaf,
      goToChapter,
      goToRecipe,
      atStart: index === 0,
      atEnd: index >= leaves.length - 1,
      locked,
      setLocked,
      turning,
      setTurning,
      animateJump,
      clearAnimateJump,
      leaves,
      chapterStart,
      step,
      spreadActive,
    }),
    [
      index,
      leaves,
      next,
      prev,
      goToLeaf,
      goToChapter,
      goToRecipe,
      locked,
      turning,
      setTurning,
      animateJump,
      clearAnimateJump,
      chapterStart,
      step,
      spreadActive,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBook(): BookState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBook must be used within <BookController>');
  return ctx;
}
