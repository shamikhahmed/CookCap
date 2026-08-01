# Recipe photos

Drop hero images into `public/recipes/` using the recipe **id** as the filename.

## Files

| File | Size |
|------|------|
| `public/recipes/<recipe-id>.webp` | Full hero |
| `public/recipes/<recipe-id>@sm.webp` | ~800w thumbnail |

Optional blur + catalog entry: run `node scripts/fetch-images.mjs` after adding files (or to backfill missing stock).

## Finding the id

- **URL / deep link** — the leaf uses the recipe id (e.g. `karahi-chicken`).
- **Source** — `id:` field on the object in `src/lib/recipes/data.ts`, `data-extra.ts`, `data-fill.ts`, or `data-foodfusion.ts`.
- Same id is the image basename (`karahi-chicken.webp`, `ff-beef-biryani.webp`).

## Step photos

Method leaf shows up to 3 dish-correct photos (first / mid / last) when mapped.

| File | Use |
|------|-----|
| `public/recipes/steps/<id>-1.webp` | Early / plated A |
| `public/recipes/steps/<id>-2.webp` | Mid / plated B |
| `public/recipes/steps/<id>-3.webp` | Finish / plated C |

**Honest rule:** dish must match. Wrong stock → omit key from map + delete files (no photo better than wrong photo).

Regen curated map:

```bash
node scripts/rematch-step-images.mjs
```

`fetch-step-images.mjs` is **disabled** (Foodish/LoremFlickr used to put dosa on bread, cupcakes on latte).

Family photos preferred — overwrite same paths.

## Stock vs your photos

Free stock (MealDB / Unsplash) covers many recipes. Your own photos are the gold path — same filenames replace stock.
