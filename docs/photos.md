# CookCap photos

## Heroes only

One photo per recipe: `public/recipes/<id>.webp` + `<id>@sm.webp` + blur in
`src/lib/recipes/images.generated.json`.

- **Honest path:** photo ships with the dish (TheMealDB `strMealThumb`, FoodFusion
  scrape, etc.). Never attach a guessed stock photo.
- Missing / broken → generated art via `heroSeed` (never a wrong-dish photo).
- **Step photos removed** (v2.2.9) — no `public/recipes/steps/`, no `stepImages.ts`.

## Scripts

```bash
npm run import:mealdb          # MealDB recipes + bundled thumbs
npm run rematch:heroes         # fix mismatched legacy heroes
npm run gate:recipes           # linkage integrity
```

`AssetPreloader` warms hero + `@sm` only.
