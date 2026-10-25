/*
  CookCap service worker — offline-first.
  Cache name = VERSION below (bump on every ship so installed PWAs drop old caches).
  Grep the const, not this comment.

  Strategy (anti stale-chunk crash):
  - navigate / HTML → network-first (never pin old index.html to new chunk hashes)
  - /_next/static/* → cache-first (content-hashed, immutable)
  - other same-origin assets → stale-while-revalidate
  - install: precache shell HTML + its script/link assets so offline reload reaches the book
  - install: NEVER auto skipWaiting (HIG iPhone recipe). New SW waits;
    SwUpdateToast posts SKIP_WAITING on user Reload only.
    First install still skipWaiting via ServiceWorker.tsx when no controller yet.
  - activate: prune old caches only (never claims clients — a running page is not taken over)
    (otherwise offline navigations bypass the SW and chunk caches never fill).

  Works under GitHub Pages project path (/CookCap/) by deriving BASE from the
  script URL. Local/static export root uses BASE ''.
*/
const VERSION = 'cookcap-v378';
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

function assetUrlsFromHtml(html, baseHref) {
  const urls = new Set();
  const re = /(?:src|href)=["']([^"']+\.(?:js|css))["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      urls.add(new URL(m[1], baseHref).href);
    } catch {
      /* ignore bad URL */
    }
  }
  return [...urls];
}

async function putOk(cache, request, res) {
  if (res && res.ok) await cache.put(request, res.clone());
}

async function cacheHtmlAndAssets(htmlRequest, htmlResponse) {
  const shell = await caches.open(SHELL);
  await putOk(shell, htmlRequest, htmlResponse);
  let html = '';
  try {
    html = await htmlResponse.clone().text();
  } catch {
    return;
  }
  const assets = await caches.open(ASSETS);
  const list = assetUrlsFromHtml(html, htmlResponse.url || self.location.origin + root('/'));
  await Promise.all(
    list.map(async (u) => {
      try {
        const cached = await assets.match(u);
        if (cached) return;
        const res = await fetch(u, { credentials: 'same-origin' });
        await putOk(assets, u, res);
      } catch {
        /* offline install — skip */
      }
    }),
  );
}

async function precacheShell() {
  const cache = await caches.open(SHELL);
  await Promise.all(
    SHELL_URLS.map(async (u) => {
      try {
        const res = await fetch(u, { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) return;
        if (u === root('/') || u.endsWith('.html')) {
          await cacheHtmlAndAssets(u, res);
        } else {
          await putOk(cache, u, res);
        }
      } catch {
        /* offline install — skip */
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  // Precache only — do not skipWaiting (avoids mid-session takeover on iPhone).
  event.waitUntil(precacheShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      // Never claim clients: a running page is not taken over by a new worker. The next
      // navigation (reload, relaunch) is served by this worker, which is all offline needs.
    })(),
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
            // Cache HTML + linked JS/CSS so a later offline reload can boot the book
            event.waitUntil(cacheHtmlAndAssets(root('/'), res.clone()));
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
