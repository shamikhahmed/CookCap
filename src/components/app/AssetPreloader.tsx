'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/components/app/AppStore';
import stepMap from '@/lib/recipes/step-images.generated.json';

/**
 * On enter: warm every recipe hero (+ @sm when available) and step photo into
 * the browser (and SW asset cache in prod). Flip lag is mostly cold image decode.
 */

const STEP = stepMap as Record<string, string[]>;
const CONCURRENCY = 8;

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

export function AssetPreloader() {
  const { allRecipes, ready } = useApp();
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    if (allRecipes.length === 0) return;
    started.current = true;

    const signal = { dead: false };
    const urls: string[] = [];
    const seen = new Set<string>();
    const add = (u: string) => {
      if (!u || seen.has(u)) return;
      seen.add(u);
      urls.push(u);
    };

    for (const r of allRecipes) {
      if (r.chapter === 'tips') continue;
      add(`/recipes/${r.id}.webp`);
      add(`/recipes/${r.id}@sm.webp`);
      for (const s of STEP[r.id] ?? []) add(s);
    }

    const kick = () => {
      void runPool(urls, CONCURRENCY, signal).then(() => {
        if (!signal.dead) warmServiceWorker(urls);
      });
    };

    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;

    let idleId = 0;
    let timeoutId = 0;
    if (typeof ric === 'function') {
      idleId = ric(kick, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(kick, 200);
    }

    return () => {
      signal.dead = true;
      if (idleId && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [allRecipes, ready]);

  return null;
}
