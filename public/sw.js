/*
  Jia Cooks service worker — offline-first (jia-v7).

  - Precache shell + icons on install.
  - Navigations: network-first → cached `/`.
  - `/_next`, fonts, icons, recipes: stale-while-revalidate.
  - Client may postMessage CACHE_URLS to warm hashed assets after first paint.
*/
const VERSION = 'jia-v7';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const SHELL_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
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
          caches.open(SHELL).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() =>
          caches.match('/').then((r) => r || caches.match('/offline.html') || caches.match(request)),
        ),
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/recipes/') ||
    /\.(?:woff2?|png|jpe?g|webp|avif|svg|webmanifest|js|css)$/.test(url.pathname)
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
    return;
  }

  event.respondWith(
    caches.open(ASSETS).then(async (cache) => {
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    }),
  );
});
