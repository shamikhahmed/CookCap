# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **3.0.0**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v4 (`cookcap`, migrates `jia-cooks`) · SW `cookcap-v29`

Heroes locked: `src/lib/recipes/images.lock.json` — rematch/fill need `--force-unlock`.  
Gates: `gate:recipes` · `gate:anti-2d` · `smoke:product` (CI after build).
User media: IDB `user-heroes` + `cover-image`; fork merge in `buildLeaves`; Serve with → `src/lib/recipes/serve-with.ts`. Phase map: `docs/ROADMAP.md`. Hard nos: `docs/SECURITY.md`.

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d
npm run build
npm run gallery   # prefer: npm run pages:build && python3 -m http.server 3456 --directory out; GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery
```

## Chrome / safe areas

- `viewportFit: 'cover'` in `layout.tsx` (required for `env(safe-area-inset-*)`)
- Tokens: `--safe-t/b/l/r`, `--header-h`, `--footer-h`, `--chrome-total`
- `.app-header` / `.app-footer` carry insets; desk is `100dvh` flex column (no double pad)
- `--book-h: min(860px, max(180px, calc(100dvh - var(--chrome-total) - 2rem)))`

## Dresser

- **World:** dressing table onboarding → book lifts out → lands on same wooden table → paper tabs stuck beside book
- Escape during dresser confirms before skip
- Gates: `npm run gate:anti-2d` · `npm run gate:recipes` (~221 recipes) — also CI-enforced

## Recipes

- One hero only (no step photos)
- Family editorial catalog only — **no TheMealDB**
- Chapters: pakistani / chinese / italian / desserts / coffee / breads / baking / snacks / meals / favorites / tips
- WarmLeafPool ≤9 DOM; chapter lists ≤24 rows
- Contents leaf = single scroll (Today’s kitchen + chapters)

## Lenses (additive — Reader = pure book)

| Mode | What |
|------|------|
| Reader | Default. No badges/tracking |
| My Plate | Fit badges, For You leaf, log, healthier |
| Mother | Cook-for multi + allergen flags |
| Budget | Cost estimates + weekly budget + pantry |
| Quick / Beginner / Dawat / Ramadan / Toddler / health lenses / Couple | Scoring presets |

Profiles + diary + pantry + user heroes + cover = device-local IndexedDB. Migration through v4 keeps prior stores. Export includes meal plan + photo blobs (base64). Profile delete cascades diary. Catalog forks: custom with same id overrides bundled; Restore deletes custom only (`keepLinks`).

## Gotchas

- `unoptimized` Image needs `withBase()` on Pages
- Phone = full-bleed leaf; Tabs in footer
- Switching mode remaps leaf index (`remapLeafIndex`) — still expect For You to appear/disappear
- First-run: Dresser unless `prefers-reduced-motion` or `hardwareConcurrency ≤ 4` → Simple
- Desk z: never reintroduce `.journal-desk > * { z-index: 1 }` (kills Appearance clicks)
- Shipped tabs = `paper` only (legacy LS cloth/index/top/pills forced back to paper)

## Key paths

`src/components/app/DresserOnboarding.tsx` · `OnboardingFlow.tsx` · `onboarding/useOnboardingSteps.ts` · `src/lib/profiles/*` · `src/lib/modes/*` · `src/lib/cost/*` · `src/components/profiles/*` · `ForYouLeaf` · `enrich.ts` · `data-goal.ts` · `src/lib/book/pages.ts` (`remapLeafIndex`)
