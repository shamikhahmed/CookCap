# CookCap — A Family Cookbook

Cap-family offline-first cookbook PWA. Name your book → **`{Name} Cooks`**.

**Live:** https://shamikhahmed.github.io/CookCap/ · **v3.3.0**

## Features

- Hardcover flip book + cook mode + search + shopping + meal planner
- **790 recipes** — family editorial + local world table (no live MealDB)
- Wooden reading table + paper tabs stuck to wood (phone wood frame)
- Footer: Home · ±5 jump · scrub slider · go-to page #
- Smart search phrases · occasions · print · guest PIN · merge backup
- Chapters: Pakistani, Chinese, Italian, European, world, desserts, chai, breakfast, breads, baking, snacks, vegetarian, meals, favorites, tips
- Optional lenses: profiles, My Plate / Mother / Budget / more modes
- **Dresser World** — same wood tokens dresser → reader

## Stack

Next.js 15 (`output: 'export'`) · React 19 · Tailwind v4 · Motion · IndexedDB · SW `cookcap-v34`

## Run

```bash
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d && npm run gate:wood
npm run pages:build
npm run gallery   # see HANDOVER for /CookCap serve
```

## Docs

Start: [`docs/REVIEW-PACK.md`](docs/REVIEW-PACK.md) · [`HANDOVER.md`](HANDOVER.md) · [`CHANGELOG.md`](CHANGELOG.md)
