# CookCap — A Family Cookbook

Cap-family offline-first cookbook PWA. Name your book → **`{Name} Cooks`**.

**Live:** https://shamikhahmed.github.io/CookCap/ · **v3.1.0**

## Features

- Hardcover flip book + cook mode + search + shopping + meal planner
- **223 recipes** — family editorial only (no third-party MealDB dump)
- Footer: Home · ±5 jump · scrub slider · go-to page #
- Smart search phrases · occasions · print · guest PIN · merge backup
- Chapters: Pakistani, Chinese, Italian, desserts, chai, breads, baking, snacks, meals, favorites, tips
- Optional lenses: profiles, My Plate / Mother / Budget / more modes
- **Dresser World** — wooden table + paper-tab bookmarks

## Stack

Next.js 15 (`output: 'export'`) · React 19 · Tailwind v4 · Motion · IndexedDB · SW `cookcap-v31`

## Run

```bash
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d
npm run pages:build
npm run gallery   # see HANDOVER for /CookCap serve
```

## Docs

[REVIEW-PACK](./docs/REVIEW-PACK.md) · [HANDOVER](./HANDOVER.md) · [CHANGELOG](./CHANGELOG.md) · [USER_GUIDE](./USER_GUIDE.md) ·  
[PRESENTATION](./PRESENTATION.md) · [ROADMAP](./docs/ROADMAP.md) · [SECURITY](./docs/SECURITY.md) · [gallery](./docs/gallery/README.md)
