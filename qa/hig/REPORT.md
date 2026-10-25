# CookCap HIG 3 — report (`design/hig-3`)

**Date:** 2026-10-25  
**Branch:** `design/hig-3` (local commits only — no push / PR per agent brief)  
**Accent:** copper terracotta `#8f4520` (`--tint` fills) / `#6e3418` (`--tint-text` on light) — Jia Cooks brand lock.

## Verdict

HIG design system + iPhone chrome recipe landed on Next.js static export without rewriting the hardcover book metaphor. Floating glass page bar, ScrollLock sheets, SW wait-for-user, copper tokens. Leaf `[data-leaf-scroll]` inner scrollers remain intentional.

**Fix round:** cover-height regression from `73cd72d` is fixed. Book shell keeps a definite `100dvh` height so the flex / `height:100%` leaf chain fills the area between header and glass bar; `html`/`body` stay free of `overflow:hidden`.

## Cover-height regression (fix round)

### Cause

`73cd72d` moved chrome to document scroll (HIG iPhone recipe) by setting `.journal-desk { height: auto !important }` in `src/design/cookcap.css` and `min-h-[100dvh]` on the Shell. The book stage still sizes with `flex:1` + `height:100%` (`.book-stage` → `.book-table` → `.book-frame` → leaf). Percentage heights need a **definite** containing-block height; `height:auto` collapsed that chain, so the cover leaf shrank to ~content (~35% viewport), vertically centred, with absolute cover chrome overlapping (`ADD PHOTO` on title, tagline on `COOKCAP`, recipe count clipped).

### Fix

| File | Change |
|---|---|
| `src/design/cookcap.css` | Restore `.journal-desk { height: 100dvh }` (drop `height:auto !important`). Keep `padding-bottom: calc(var(--tabbar-h) + 48px + safe-area)` so the fixed glass bar clears leaf content. Keep `html`/`body` `overflow-y: auto`. Add `.journal-stage` min-height floor matching chrome-free space. |
| `src/components/book/Shell.tsx` | Restore `h-[100dvh]` (with `min-h-[100dvh]`) on `.journal-desk`. |

### Verification (geometry)

Phone 390×844-class (Playwright iPhone 15 Pro CSS 393×659) light + dark; iPad 1180×820:

| Leaf | Page | Fill (frame/vh) | Gap above glass bar | Overlaps |
|---|---|---|---|---|
| Cover | 1 | ~0.76 phone / ~0.84 iPad | ≥8px | none (title / ADD PHOTO / brand) |
| Contents | 4 | same | same | none |
| Recipe (chapter→recipe) | 7 | same | same | none |
| Last (back of book) | 826 | same | same | none |

Desk `padding-bottom` = 106px ≥ footer 58 + 40 (ios-behaviour-check). `body` overflow-y = `auto` (not `hidden`).

## Files changed (high level)

| Area | Paths |
|---|---|
| Tokens / cascade | `src/design/tokens.css`, `system.css`, `cookcap.css`; `src/app/globals.css` |
| Kit / lock | `src/components/kit/index.tsx`, `src/lib/scroll-lock.ts`, `src/lib/a11y/dialog.ts` |
| Shell / sheets | `src/components/book/Shell.tsx`, `FavoritesDrawer.tsx`, `ShoppingDrawer.tsx` |
| SW / version | `public/sw.js` (`cookcap-v375`), `src/lib/version.ts`, `VERSION*`, `package.json` |
| Verify / docs | `scripts/ios-behaviour-check.mjs`, `scripts/hig-verify-leaves.mjs`, `DESIGN.md`, `CHANGELOG.md`, `qa/hig/*` |

## ios-behaviour-check

| | origin/main | design/hig-3 (post-fix) |
|---|---|---|
| Result | **7 FAIL / 8 PASS** | **15 PASS / 0 FAIL** |
| Evidence | `qa/hig/ios-check-origin-main.txt` | `qa/hig/ios-check-branch.txt` |

## Playwright e2e (`e2e/finish.spec.ts`)

| | origin/main | design/hig-3 |
|---|---|---|
| Count | **1 passed** | **1 passed** |
| Evidence | `qa/hig/e2e-origin-main.txt` | `qa/hig/e2e-branch.txt` |

Also: `npm run lint` (existing hook warnings only), `npm run typecheck`, `npm run build` green on branch.

## Evidence PNGs

- `before-phone-light.png` — origin/main cover (full-height leaf)  
- `after-phone-light.png` / `after-phone-dark.png` / `after-ipad.png` — post-fix cover  
- `after-*-contents.png` / `after-*-recipe.png` / `after-*-last.png` — leaf-type fill checks  
- `pairs-phone-light.png` / `pairs-phone-dark.png` / `pairs-ipad.png` — before\|after side-by-side, labelled  

## Known gaps

1. **Leaf inner scrollers** — recipe/contents leaves keep `overflow-y: auto` on `[data-leaf-scroll]` (book page metaphor). Documented as intentional PASS in the check.  
2. **Glass sidebar ≥700px** — chapter bookmark rail remains the wide-layout dock; page bar stays a bottom float.  
3. **Not every drawer** migrated to Cancel/Title/Done chrome (Favorites + Shopping done; Profiles/Plan/etc. still legacy headers — ScrollLock applies via `useDialogA11y`).  
4. **No push / PR** — agent brief forbids push; commits stay local on `design/hig-3`.
