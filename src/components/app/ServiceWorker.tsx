'use client';

import { useEffect } from 'react';
import { BASE_PATH } from '@/lib/base-path';

/**
 * Registers SW in production and warms the asset cache with scripts/styles
 * already on the page — so a second visit (and many offline navigations) work.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const swUrl = `${BASE_PATH}/sw.js`;
    const scope = `${BASE_PATH}/` || '/';

    const warm = (reg: ServiceWorkerRegistration) => {
      const urls = new Set<string>();
      document.querySelectorAll('script[src]').forEach((el) => {
        const src = (el as HTMLScriptElement).src;
        if (src.startsWith(window.location.origin)) urls.add(src);
      });
      document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
        const href = (el as HTMLLinkElement).href;
        if (href.startsWith(window.location.origin)) urls.add(href);
      });
      const list = Array.from(urls).slice(0, 40);
      const send = (sw: ServiceWorker | null) => {
        sw?.postMessage({ type: 'CACHE_URLS', urls: list });
      };
      send(reg.active);
      if (reg.installing) {
        reg.installing.addEventListener('statechange', () => {
          if (reg.installing?.state === 'activated') send(reg.active);
        });
      }
      navigator.serviceWorker.ready.then((r) => send(r.active));
    };

    const register = () =>
      navigator.serviceWorker
        .register(swUrl, { scope })
        .then(async (reg) => {
          warm(reg);
          // Appendix L — pull updates on every visit so installed PWAs leave stale caches.
          try {
            await reg.update();
          } catch {
            /* offline */
          }
          if (reg.waiting) {
            // First install: activate immediately. Updates: SwUpdateToast offers reload.
            if (!navigator.serviceWorker.controller) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
          reg.addEventListener('updatefound', () => {
            const sw = reg.installing;
            sw?.addEventListener('statechange', () => {
              if (sw.state === 'installed' && !navigator.serviceWorker.controller) {
                sw.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch((e) => {
          console.warn('[CookCap] Service worker registration failed:', e);
        });

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
