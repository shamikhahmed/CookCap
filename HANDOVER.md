# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **2.0.1**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v3 · SW `cookcap-v4`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run build
npm run gallery   # prefer static: npm run build && npx serve out -l 3456; GALLERY_URL=http://localhost:3456 npm run gallery
```

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

## Key paths

`src/lib/profiles/*` · `src/lib/modes/*` · `src/lib/cost/*` · `src/components/profiles/*` · `ForYouLeaf` · `enrich.ts` · `data-goal.ts`
