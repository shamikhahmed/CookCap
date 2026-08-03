# Cursor — v3.2.2 (P0): stop the returning-user CRASH (stale SW) + wood polish

## P0 — Live crash for returning users (must fix first)
Symptom (reproduced live): a returning visit shows **"Application error: a client-side
exception has occurred"** and a blank screen. Clearing the service worker fixes it →
it's the **stale-SW chunk-mismatch trap**: the installed SW serves cached HTML/chunks
whose hashes don't match the newly deployed `_next/static/*` → `ChunkLoadError` →
crash, until the SW happens to update. Bumping the cache name alone does NOT fix it.

Fix (all of these):
1. **HTML/navigation = network-first** (fall back to cache offline). Never serve a
   stale `index.html` that points at old chunk hashes.
2. **`_next/static/*` = cache-first** (hashed + immutable — safe forever).
3. New SW calls **`self.skipWaiting()`** on install and **`clients.claim()`** on
   activate; delete all old caches on activate.
4. In the page: on `navigator.serviceWorker` **`controllerchange`**, `location.reload()`
   **once** (guard a flag so it can't loop).
5. Add a global guard: `window.addEventListener('error', e => { if
   (/ChunkLoadError|Loading chunk .* failed/.test(e.message)) location.reload(); })` and
   the same for `unhandledrejection`. Belt-and-suspenders so a mismatch self-heals.
6. Verify LIVE: install the PWA, deploy a change, reopen → it updates to the new build
   with NO crash and NO manual cache clear. Test on iOS Safari + Chrome.

This is the single most important issue — real users are seeing a broken app.

## P1 — Wood is in the reader now; polish it (DOM-verified live)
`.journal-desk` background is now a dark-walnut gradient (was cream) and 32 paper tabs
render with ink labels — good. Tune on real device:
- Confirm the wood reads as **wood** (grain + plank seams visible, warm, not a flat
  brown gradient) in all 4 skins; light skins = lighter oak, not muddy.
- Paper tabs must read as **paper notes stuck to the wood**: paper face, ink label,
  hairline + one soft shadow, even edges, slight peel on hover/press. Check the tab
  face vs wood AND label vs face both pass **AA**.
- Book sits on the wood with a believable contact shadow (already present — deepen if flat).
- Phone: ensure the wood world is felt (header/footer wood tint or a wood frame), book
  still full-bleed; Tabs sheet styled as notes.

## P2 — Contrast sweep (finish the visibility audit)
Every screen × 4 skins × light/dark: AA everywhere, **≥7:1 for allergen/warning/"not
medical advice"**. Check tab labels, hints (`ink-faint`), the "What's new" popup, footer
progress, chrome icons on wood. Nothing blends into wood or paper.

## Ship
`typecheck`+`lint`+`build` green. Commit: `fix: SW update — no stale-chunk crash`,
`polish: wooden reader + tabs`, `fix: contrast`. Bump VERSION/package/version.ts →
3.2.2, SW → `cookcap-v34`, CHANGELOG/HANDOVER/QA/Capricorn. Push `main`. **Prove the
crash is gone** by the install→deploy→reopen test, and DOM-confirm wood + tab contrast.
