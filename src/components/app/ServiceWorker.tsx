'use client';

import { useEffect } from 'react';

/**
 * Registers SW in production and warms the asset cache with scripts/styles
 * already on the page — so a second visit (and many offline navigations) work.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

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
        .register('/sw.js', { scope: '/' })
        .then(warm)
        .catch(() => void 0);

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
