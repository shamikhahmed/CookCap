# CookCap photos

## Heroes only

One photo per recipe: `public/recipes/<id>.webp` + `<id>@sm.webp` + blur in
`src/lib/recipes/images.generated.json`.

- Prefer photos that ship with the dish (FoodFusion scrape, curated Unsplash).
  Never attach a guessed stock photo.
- Missing / broken → generated art via `heroSeed` (never a wrong-dish photo).
- **Step photos removed** (v2.2.9) — no `public/recipes/steps/`, no `stepImages.ts`.
- **TheMealDB removed** (v2.4.0) — no `mdb-*` heroes, no themealdb.com fetches.

## Scripts

```bash
npm run rematch:heroes         # fix mismatched legacy heroes (Unsplash / Foodish)
npm run gate:recipes           # linkage integrity
```

`AssetPreloader` warms hero + `@sm` only.
