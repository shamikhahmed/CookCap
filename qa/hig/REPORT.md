# CookCap HIG 3 — report (`design/hig-3`)

**Date:** 2026-10-25  
**Branch:** `design/hig-3` (local commit only — no push / PR per agent brief)  
**Accent:** copper terracotta `#8f4520` (`--tint` fills) / `#6e3418` (`--tint-text` on light) — Jia Cooks brand lock.

## Verdict

HIG design system + iPhone chrome recipe landed on Next.js static export without rewriting the hardcover book metaphor. Floating glass page bar, ScrollLock sheets, SW wait-for-user, copper tokens. Leaf `[data-leaf-scroll]` inner scrollers remain intentional.

## Files changed (high level)

| Area | Paths |
|---|---|
| Tokens / cascade | `src/design/tokens.css`, `system.css`, `cookcap.css`; `src/app/globals.css` |
| Kit / lock | `src/components/kit/index.tsx`, `src/lib/scroll-lock.ts`, `src/lib/a11y/dialog.ts` |
| Shell / sheets | `src/components/book/Shell.tsx`, `FavoritesDrawer.tsx`, `ShoppingDrawer.tsx` |
| SW / version | `public/sw.js` (`cookcap-v375`), `src/lib/version.ts`, `VERSION*`, `package.json` |
| Verify / docs | `scripts/ios-behaviour-check.mjs`, `DESIGN.md`, `CHANGELOG.md`, `qa/hig/*`, `playwright.config.ts` (port 8831) |

## ios-behaviour-check

| | origin/main | design/hig-3 |
|---|---|---|
| Result | **7 FAIL / 8 PASS** | **15 PASS / 0 FAIL** |
| Evidence | `qa/hig/ios-check-origin-main.txt` | `qa/hig/ios-check-branch.txt` |

### origin/main FAIL

- page bar floats ≥14px above bottom  
- page bar is fixed (glass float) — `relative`  
- content padding clears page bar  
- body not overflow:hidden — `hidden`  
- sheet flow (ScrollLock)  
- SW: skipWaiting only on user request  
- SW: no auto clients.claim  

### design/hig-3

All listed checks PASS (chrome tappable, ≥44pt, glass float, padding, overflow, ScrollLock sheet, inputs ≥16px, SW wait).

## Playwright e2e (`e2e/finish.spec.ts`)

| | origin/main (served `/tmp` archive build) | design/hig-3 |
|---|---|---|
| Count | **1 passed** | **1 passed** |
| Evidence | `qa/hig/e2e-origin-main.txt` | `qa/hig/e2e-branch.txt` |

Also: `npm run typecheck`, `npm run lint` (existing hook warnings only), `npm run build` green on branch.

## Evidence PNGs

- `before-phone-light.png` / `after-phone-light.png`  
- `after-phone-dark.png` / `after-ipad.png`  

## Known gaps

1. **Leaf inner scrollers** — recipe/contents leaves keep `overflow-y: auto` on `[data-leaf-scroll]` (book page metaphor). Documented as intentional PASS in the check.  
2. **Glass sidebar ≥700px** — chapter bookmark rail remains the wide-layout dock; page bar stays a bottom float (not converted into a module sidebar).  
3. **Not every drawer** migrated to Cancel/Title/Done chrome (Favorites + Shopping done; Profiles/Plan/etc. still legacy headers — ScrollLock applies via `useDialogA11y`).  
4. **No push / PR** — agent brief forbids push; commit stays local on `design/hig-3`.
