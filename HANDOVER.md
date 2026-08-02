# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **2.3.1**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v3 · SW `cookcap-v17`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run build
npm run gate:recipes && npm run rebalance:mealdb && npm run audit:photos
npm run gallery   # prefer: npm run build && python3 -m http.server 3456 --directory out; GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery
```

## Chrome / safe areas

- `viewportFit: 'cover'` in `layout.tsx` (required for `env(safe-area-inset-*)`)
- Tokens: `--safe-t/b/l/r`, `--header-h`, `--footer-h`, `--chrome-total`
- `.app-header` / `.app-footer` carry insets; desk is `100dvh` flex column (no double pad)
- `--book-h: min(860px, max(180px, calc(100dvh - var(--chrome-total) - 2rem)))`

## Dresser

- **World:** dressing table onboarding → book lifts out → lands on same wooden table → paper tabs stuck beside book
- v3 drawers: 3D pull-out (`translateZ` + body `rotateX`); question letterpress-carved; brass paper slot
- Reveal Part 2 timeline → FLIP → paper-tab peel → complete at 2760ms
- Gates: `npm run gate:anti-2d` · `npm run gate:recipes` (838 recipes)

## Recipes

- One hero only (no step photos)
- TheMealDB import: `npm run import:mealdb` → `data-themealdb.ts` + bundled thumbs
- Chapter map: `chapterMap.ts` — cuisine / type / dietary; **meals = fallback**; tabs include breakfast / vegetarian / world / european
- First-load JS ~818 kB with full catalog — WarmLeafPool ≤9 DOM; chapter lists ≤24 rows

## Lenses (additive — Reader = pure book)

| Mode | What |
|------|------|
| Reader | Default. No badges/tracking |
| My Plate | Fit badges, For You leaf, log, healthier |
| Mother | Cook-for multi + allergen flags |
| Budget | Cost estimates + weekly budget + pantry |
| Quick / Beginner / Dawat / Ramadan / Toddler / health lenses / Couple | Scoring presets |

Profiles + diary + pantry = device-local IndexedDB. Migration v2→v3 keeps favorites/notes/ratings/meal-plan.

## Gotchas

- `unoptimized` Image needs `withBase()` on Pages
- Phone = full-bleed leaf; Tabs in footer
- Switching mode adds/removes For You leaf → page indices shift (expected)
- First-run: Dresser unless `prefers-reduced-motion` or `hardwareConcurrency ≤ 4` → Simple
- Desk z: never reintroduce `.journal-desk > * { z-index: 1 }` (kills Appearance clicks)

## Key paths

`src/components/app/DresserOnboarding.tsx` · `OnboardingFlow.tsx` · `onboarding/useOnboardingSteps.ts` · `src/lib/profiles/*` · `src/lib/modes/*` · `src/lib/cost/*` · `src/components/profiles/*` · `ForYouLeaf` · `enrich.ts` · `data-goal.ts`
