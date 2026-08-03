/*
  CookCap service worker — offline-first.
  Cache name = VERSION below (bump on every ship so installed PWAs drop old caches).
  Grep the const, not this comment.

  Strategy (anti stale-chunk crash):
  - navigate / HTML → network-first (never pin old index.html to new chunk hashes)
  - /_next/static/* → cache-first (content-hashed, immutable)
  - other same-origin assets → stale-while-revalidate
  - install: skipWaiting; activate: claim + delete foreign caches

  Works under GitHub Pages project path (/CookCap/) by deriving BASE from the
  script URL. Local/static export root uses BASE ''.
*/
const VERSION = 'cookcap-v34';
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

async function precacheShell() {
  const cache = await caches.open(SHELL);
  await Promise.all(
    SHELL_URLS.map(async (u) => {
      try {
        const res = await fetch(u, { cache: 'no-store', credentials: 'same-origin' });
        if (res.ok) await cache.put(u, res.clone());
      } catch {
        /* offline install — skip */
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
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

function isHtmlRequest(request, url) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html')) return true;
  const path = url.pathname;
  return path === BASE || path === `${BASE}/` || path.endsWith('.html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML / navigations — always prefer network so chunk hashes match deploy
  if (isHtmlRequest(request, url)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(root('/'), copy));
          }
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

  // Hashed Next bundles — cache-first forever
  if (path.includes('/_next/static/')) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) await cache.put(request, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      }),
    );
    return;
  }

  if (
    path.includes('/_next/') ||
    path.includes('/icons/') ||
    path.includes('/recipes/') ||
    path.endsWith('.webp') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.woff2') ||
    path.endsWith('.js') ||
    path.endsWith('.css')
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
