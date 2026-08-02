'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/components/app/AppStore';
import { useBook } from '@/components/book/BookController';
import { withBase } from '@/lib/base-path';
import type { Leaf } from '@/lib/book/pages';
import { getImage } from '@/lib/recipes/images';

/**
 * Keep flips cold-start-free without decoding the whole catalog on the main thread.
 * - SW gets hero URLs that exist in the image manifest (skip missing → no 404 spam)
 * - Browser decode window tracks the reader (±WINDOW around index)
 */

const CONCURRENCY = 3;
const WINDOW = 12;

function loadUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

async function runPool(urls: string[], limit: number, signal: { dead: boolean }) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, urls.length) }, async () => {
    while (!signal.dead && i < urls.length) {
      const url = urls[i++]!;
      await loadUrl(url);
      // Yield so page flips / search stay under the longtask budget.
      await new Promise((r) => setTimeout(r, 0));
    }
  });
  await Promise.all(workers);
}

function warmServiceWorker(urls: string[]) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      const chunk = 60;
      for (let i = 0; i < urls.length; i += chunk) {
        reg.active?.postMessage({ type: 'CACHE_URLS', urls: urls.slice(i, i + chunk) });
      }
    })
    .catch(() => void 0);
}

function heroUrlsForLeaf(leaf: Leaf | undefined): string[] {
  if (!leaf || leaf.kind !== 'recipe') return [];
  if (!getImage(leaf.recipeId)) return [];
  return [withBase(`/recipes/${leaf.recipeId}.webp`), withBase(`/recipes/${leaf.recipeId}@sm.webp`)];
}

export function AssetPreloader() {
  const { allRecipes, ready, leaves } = useApp();
  const { index } = useBook();
  const decoded = useRef(new Set<string>());
  const swQueued = useRef(false);
  const signalRef = useRef({ dead: false });

  // One-shot: hand full catalog to SW cache (no main-thread decode).
  useEffect(() => {
    if (!ready || swQueued.current || allRecipes.length === 0) return;
    swQueued.current = true;
    const urls: string[] = [];
    for (const r of allRecipes) {
      if (r.chapter === 'tips') continue;
      if (!getImage(r.id)) continue;
      urls.push(withBase(`/recipes/${r.id}.webp`), withBase(`/recipes/${r.id}@sm.webp`));
    }
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;
    const kick = () => warmServiceWorker(urls);
    if (typeof ric === 'function') ric(kick, { timeout: 4000 });
    else window.setTimeout(kick, 800);
  }, [allRecipes, ready]);

  // Sliding decode window around the current leaf.
  useEffect(() => {
    if (!ready || leaves.length === 0) return;
    signalRef.current.dead = false;
    const signal = signalRef.current;

    const urls: string[] = [];
    const lo = Math.max(0, index - WINDOW);
    const hi = Math.min(leaves.length - 1, index + WINDOW);
    for (let i = lo; i <= hi; i++) {
      for (const u of heroUrlsForLeaf(leaves[i])) {
        if (decoded.current.has(u)) continue;
        decoded.current.add(u);
        urls.push(u);
      }
    }
    if (urls.length === 0) return;

    void runPool(urls, CONCURRENCY, signal);
    return () => {
      signal.dead = true;
    };
  }, [index, leaves, ready]);

  return null;
}
