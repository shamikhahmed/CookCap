/*
  CookCap service worker — offline-first.
  Cache name = VERSION below (bump on every ship so installed PWAs drop old caches).
  Grep the const, not this comment.

  Works under GitHub Pages project path (/CookCap/) by deriving BASE from the
  script URL. Local/static export root uses BASE ''.
*/
const VERSION = 'cookcap-v27';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const BASE = new URL('./', self.location.href).pathname.replace(/\/$/, '');
const root = (p) => `${BASE}${p.startsWith('/') ? p : `/${p}`}`;

const SHELL_URLS = [
  root('/'),
  root('/offline.html'),
  root('/manifest.webmanifest'),
  root('/icons/icon.svg'),
  root('/icons/icon-192.png'),
  root('/icons/icon-512.png'),
  root('/icons/maskable-512.png'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (!data || data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return;
  event.waitUntil(
    caches.open(ASSETS).then(async (cache) => {
      await Promise.all(
        data.urls.map(async (u) => {
          try {
            const res = await fetch(u, { credentials: 'same-origin' });
            if (res.ok) await cache.put(u, res.clone());
          } catch {
            /* ignore */
          }
        }),
      );
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(root('/'), copy));
          return res;
        })
        .catch(() =>
          caches
            .match(root('/'))
            .then((r) => r || caches.match(root('/offline.html')) || caches.match(request)),
        ),
    );
    return;
  }

  const path = url.pathname;
  if (
    path.includes('/_next/') ||
    path.includes('/icons/') ||
    path.includes('/recipes/') ||
    path.endsWith('.webp') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
