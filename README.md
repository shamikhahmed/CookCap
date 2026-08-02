# CookCap — A Family Cookbook

Cap-family offline-first cookbook PWA. Name your book → **`{Name} Cooks`**.

**Live:** https://shamikhahmed.github.io/CookCap/ · **v2.4.2**

## Features

- Hardcover flip book + cook mode + search + shopping + meal planner
- **~215 recipes** — family editorial only (no third-party MealDB dump)
- Chapters: Pakistani, Chinese, Italian, desserts, chai, breads, baking, snacks, meals, favorites, tips
- Search filters: Easy · ≤30 min · **★5…★1** (your local ratings)
- **Optional lenses:** profiles, My Plate / Mother / Budget / more modes, meal diary + calendar, pantry, PKR cost estimates
- Reader mode = pure book (ignore lenses → same heirloom experience)
- **Dresser World** — wooden table + paper-tab bookmarks; dresser onboarding continuous with reading desk

## Stack

Next.js 15 (`output: 'export'`) · React 19 · Tailwind v4 · Motion · IndexedDB · SW `cookcap-v21`

## Run

```bash
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d
npm run build
npm run pages:build
npm run gallery
```

## Docs

[HANDOVER](./HANDOVER.md) · [CHANGELOG](./CHANGELOG.md) · [USER_GUIDE](./USER_GUIDE.md) ·
[PRESENTATION](./PRESENTATION.md) · [gallery](./docs/gallery/README.md) ·
[plan](./docs/plan-profiles-modes.md)
