# CookCap — Production-readiness A–Z (`design/hig-3`) — Round 2

**Date:** 2026-10-25  
**App version:** 3.7.8 · **SW:** `cookcap-v378`  
**Browser under test:** Chromium iPhone 15 Pro metrics + WebKit ios-behaviour-check.  
**Server:** `python3 -m http.server` on ports 8920–8929 serving `out/` (no network installs).

## Round 2 summary

Reviewer shot defects fixed (own commits), then re-shot. Gates: lint warnings only, typecheck green, build green, e2e 1 passed, ios-check **15/15**.

| # | Shot / issue | Fix | Commit |
|---|---|---|---|
| 1 | `leaf-contents-light` ghost Go-to-page | Opaque body-portal popover; Cancel+Go; ≥16px input; not `data-overlay` | `9b0c0e4`, `ae010c8`, `db6bd8d` |
| 2 | `after-contrast-light-cover` AA | Secondary Add photo (≥44pt, ink on paper); foil on title only; small caps `--color-ink-soft` | `e4e732f` |
| 3 | `overlay-shop` page bar over sheet | Sheets `z-[80]` + `data-overlay`; hide `.app-footer` while open; safe-area pad | `433f87b` |
| 4 | `overlay-search` kbd hints on phone | `.search-kbd-hints` only `@media (hover:hover) and (pointer:fine)` | `e845815` |
| 5 | `offline-reload` splash-only | Precache HTML+JS/CSS; **`clients.claim()` on activate**; audit waits `data-app-ready` | `d72e2ac`, `d622815` |
| 6 | `fresh-first-run` repeated subtitle | `PRODUCT_TAGLINE` = flip/keep/cook offline line | `4621c56` |

## Summary table (A–L)

| | Area | Status | Evidence |
|---|---|---|---|
| A | Build & gates | **PASS** | lint warnings only; `tsc --noEmit`; `npm run build`; e2e 1 passed; ios **15/15**; VERSION ↔ SW `3.7.8` / `v378` |
| B | Inventory | **PASS** | `INVENTORY.md` |
| C | Visual | **FIXED** | Re-shot set under `shots/` (phone + ipad + desktop + overlays light/dark) |
| D | Interaction | **PASS*** | Overlays search/shop/favorites/tabs/whats-new/about ok in audit |
| E | Core flows | **PASS*** | e2e finish; fresh dresser first-run |
| F | iPhone | **PASS** | `ios-check.txt` 15 PASS |
| G | a11y | **FIXED** | Cover secondary + small caps; prior page-bar AA retained |
| H | PWA / offline | **FIXED** | Offline shot reaches book (`data-app-ready`); SW claims after activate |
| I–L | Perf / privacy / content / docs | **PASS*** | Unchanged posture; docs bumped to 3.7.8 |

## Gates (round 2)

| Suite | Result |
|---|---|
| lint | warnings only (pre-existing hooks) |
| typecheck | green |
| build | green |
| `test:e2e` | 1 passed |
| ios-behaviour-check | **15 PASS / 0 FAIL** |

## Capture

```bash
npm run build
./scripts/prod-ready-reshoot.sh 8926   # or: python3 -m http.server 8926 --directory out &
# PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright node scripts/prod-ready-audit.mjs http://127.0.0.1:8926/
```

## Remaining gaps

- Not every inventory overlay × every breakpoint photographed (budget).  
- Lighthouse not run (no fabricated scores).  
- Leaf `[data-leaf-scroll]` remains intentional.
