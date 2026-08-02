# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **2.2.7**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v3 · SW `cookcap-v13`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run build
npm run gallery   # prefer: npm run build && python3 -m http.server 3456 --directory out; GALLERY_URL=http://127.0.0.1:3456 npm run gallery
```

## Chrome / safe areas

- `viewportFit: 'cover'` in `layout.tsx` (required for `env(safe-area-inset-*)`)
- Tokens: `--safe-t/b/l/r`, `--header-h`, `--footer-h`, `--chrome-total`
- `.app-header` / `.app-footer` carry insets; desk is `100dvh` flex column (no double pad)
- `--book-h: min(860px, max(180px, calc(100dvh - var(--chrome-total) - 2rem)))`

## Dresser

- v3: 3D pull-out drawers (`translateZ` + body `rotateX`); question letterpress-carved; brass paper slot
- `useDialogA11y` holds `onClose` in ref — never pass inline `() => …` for focus stability (still safe if you do)
- Reveal: `db-rise` → `db-turn` → `db-settle` → FLIP onto `.book-frame`

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
