# CookCap — Production-readiness A–Z (`design/hig-3`) — Round 3

**Date:** 2026-10-25  
**App version:** 3.7.8 · **SW:** `cookcap-v378`  
**Browser under test:** Chromium iPhone 15 Pro metrics + WebKit ios-behaviour-check.  
**Server:** `python3 -m http.server` on ports 8920–8929 serving `out/` (no network installs).

## Round 3 summary

Reviewer shot defects fixed (own commits), then re-shot. Gates: lint warnings only, typecheck green, build green, e2e 1 passed, ios-check **15/15** (`SW: no auto clients.claim` restored — do not re-add `clients.claim`).

| # | Shot / issue | Fix | Commit |
|---|---|---|---|
| 1 | `overlay-tabs` translucent list | Opaque paper sheet + scrim + shadow; body portal (matches Shopping) | `62a6c63` |
| 2 | `offline-reload` pill over icons | In-flow banner under header; auto-hide ~4.5s; `role=status` | `3fa3f81` |
| 3 | `offline-reload` splash cross-fade | `__APP_READY__` on splash exit; ≤1s hard cap; audit waits `[data-splash]` gone | `beb35c3`, `27f7d53` |
| 4 | `overlay-whats-new` recipe-only | Force-open via `cookcap-open-whats-new`; polish toast; wait visible | `27f7d53` |

## Round 2 (retained)

| # | Shot / issue | Fix | Commit |
|---|---|---|---|
| 1 | `leaf-contents-light` ghost Go-to-page | Opaque body-portal popover | `9b0c0e4`… |
| 2–4 | contrast / sheets / search kbd | As round 2 | see prior |
| 5 | offline book boot | Precache HTML+JS/CSS (**no** `clients.claim`) | `d72e2ac`, `4802357` |
| 6 | `fresh-first-run` tagline | `PRODUCT_TAGLINE` | `4621c56` |

## Summary table (A–L)

| | Area | Status | Evidence |
|---|---|---|---|
| A | Build & gates | **PASS** | lint warnings only; `tsc --noEmit`; `npm run build`; e2e 1 passed; ios **15/15**; VERSION ↔ SW `3.7.8` / `v378` |
| B | Inventory | **PASS** | `INVENTORY.md` |
| C | Visual | **FIXED** | Re-shot tabs / offline / what’s-new under `shots/` |
| D | Interaction | **PASS*** | Overlays search/shop/favorites/tabs/whats-new/about |
| E | Core flows | **PASS*** | e2e finish |
| F | iPhone | **PASS** | `ios-check.txt` 15 PASS (`no auto clients.claim`) |
| G | a11y | **PASS*** | Offline `role=status`; prior AA fixes retained |
| H | PWA / offline | **FIXED** | Offline shot: book + banner under header; splash gone; no claim |
| I–L | Perf / privacy / content / docs | **PASS*** | Unchanged posture |

## Gates (round 3)

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
- Never re-add `clients.claim` or weaken `SW: no auto clients.claim`.
