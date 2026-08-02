# Adding a recipe to CookCap

The book is data-driven: **one recipe = one object**. Everything else — the index,
bookmarks, search, categories, related links, navigation, reading progress —
updates automatically from that object. You never touch layout code.

## 1. Add the recipe object

**Flagship / fully editorial** — append a verbose object to `RECIPES` in
`src/lib/recipes/data.ts`.

**Growing collection** — append a compact `r({…})` entry to
`src/lib/recipes/data-extra.ts` or `src/lib/recipes/data-fill.ts` (both are
spread into `RECIPES` automatically).

**WhatsApp paste** — in-app Import modal (device-local customs; macros unverified).

Do **not** import TheMealDB — removed in v2.4.0.

```ts
{
  id: 'kebab-rolls',          // unique, kebab-case — also the image filename
  chapter: 'pakistani',       // one of the ChapterId values (src/lib/recipes/types.ts)
  title: 'Kebab Rolls',
  tagline: 'Spiced mince, wrapped and griddled.',
  story: 'A short note — why this recipe matters, in first person.',
  tasteLike: 'Smoky and rich…',
  texture: 'Crisp paratha, juicy filling.',
  cuisine: 'Pakistani',
  difficulty: 'medium',       // 'easy' | 'medium' | 'hard'
  spiceLevel: 3,              // 0–5 chili pips
  allergens: ['gluten', 'egg'],
  prepMin: 20, cookMin: 15, servings: 4,
  nutrition: { calories: 480, protein: 22, carbs: 40, fat: 26, fiber: 3, sugar: 4 },
  tags: ['savory', 'street-food'],
  ingredients: [{ items: [{ quantity: 500, unit: 'g', item: 'minced beef' } /* … */] }],
  steps: [
    { instruction: 'Brown the mince with the spices.', durationSec: 480 },
  ],
  chefNotes: ['…'], tips: ['…'], commonMistakes: ['…'],
  substitutions: [{ from: 'beef', to: 'chicken mince' }],
  equipment: ['Griddle'], storage: '…', reheating: '…',
  related: ['chana-masala'],  // optional — auto-related fills gaps
  heroSeed: 12,               // any number — used only if no photo exists
}
```

That’s it. The recipe now appears in its chapter, the contents page, search,
and the page-flip book. One hero photo only — never step images.
and the bookmark tab — no other edits.

## 2. Add a hero photo (optional but lovely)

Two paths:

- **Automatic** — add the recipe’s title to `QUERIES` in
  `scripts/fetch-images.mjs` and run `node scripts/fetch-images.mjs`. It fetches,
  optimizes to WebP (1600w + 800w), and writes the blur placeholder into
  `src/lib/recipes/images.generated.json`.
- **Licensed / your own** — drop `public/recipes/<id>.webp` (1600w) and
  `<id>@sm.webp` (800w), then add an entry to `images.generated.json` with a
  `blurDataURL`. To generate a blur quickly:
  `sharp('photo.jpg').resize(20,20).webp({quality:40}).toBuffer()` → base64.

No photo? The page falls back to generated art automatically — nothing breaks.

## Meal planner

Week plan lives in IndexedDB (`meta` key `meal-plan`). No new recipe fields required.
