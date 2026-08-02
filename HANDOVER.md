# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **1.5.1**.

## Live

https://shamikhahmed.github.io/CookCap/

Same model as PulseCap / VaultCap: Next `output: 'export'` + Actions Pages.
`NEXT_PUBLIC_BASE_PATH=/CookCap` on CI only.

## Critical gotcha (v1.5.1)

`next/image` with `unoptimized` does **not** auto-prefix `basePath`. All recipe /
step / preload asset URLs must go through `withBase()` or they 404 on Pages
(looked like “no photos”). SW `cookcap-v2`.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB · SW `cookcap-v2`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run build
npm run gallery   # needs :3000
```

## Mobile

Phone = full-bleed reader leaf (Apple Books style). Desktop = leather case + fat
fore-edge tabs. Phone Tabs = footer control → sheet (no floating FAB).

## Name → book

`NameGate` → `{Name} Cooks`. Product chrome = **CookCap**. ··· → Change book name.

## Roadmap honesty

`MASTER_PROMPT.md` + `docs/plan-profiles-modes.md` describe profiles/modes/
nutrition/calendar. **Not shipped.** Only Phase 0 stabilize (this release) is done.

## Key files

`withBase` · `RecipeImage` · `images.ts` · `Shell` · `Book` · `BookmarkRail` ·
`.github/workflows/pages.yml` · `docs/gallery/`
