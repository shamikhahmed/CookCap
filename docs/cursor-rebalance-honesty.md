# Historical — catalog is 215 family recipes; TheMealDB removed in v2.4.0.

# Cursor — rebalance chapters + photo-honesty audit + perf at 956 (v2.3.0)

Live v2.2.9, 956 recipes, SW `cookcap-v15`. Ship **v2.3.0 / cookcap-v16**. Guardrails
hold. Verify by DOM + real-device (pane pixels lie).

## Problem (measured on disk)
Chapter distribution is broken — the bulk import dumped ~half into `meals`:
```
meals 441 (46%) · desserts 171 · snacks 124 · pakistani 65 · chinese 52
italian 39 · breads 19 · tips 15 · baking 15 · coffee 9 · favorites 8
```
One tab holding 46% defeats the chapter system. Fix the mapping, don't hide it.

## 1. Rebalance chapters (target: no chapter > ~20% of catalog)
- Re-map imported recipes by **source category / area / tags**, not defaulting to `meals`:
  - Cuisine → `pakistani` / `chinese` / `italian` (extend to the cuisines the data
    actually has if worth a tab).
  - Meal type → `breakfast`, `snacks`, `desserts`, `baking`, `breads`, `coffee`.
  - Dietary → `vegetarian`, `vegan`.
  - `meals` = **fallback only** (true mains that fit nothing more specific).
- The `ChapterId` union already includes `breakfast`, `vegetarian`, `vegan`, `budget`
  that aren't shown as tabs. For every chapter now used, ensure `chapters.ts` has a
  full entry (title/subtitle/blurb/quote/tab color/icon) so its **paper tab auto-renders**.
  Add `breakfast` / `vegetarian` (and any other high-count bucket) as real chapters.
- Keep the mapping in the ingest/data layer (a lookup, not hand-editing 900 objects).
  Deterministic + re-runnable.
- After remap: no chapter > ~20%; every chapter ≥ a handful; the contents page counts
  update automatically.

## 2. Photo↔dish honesty audit (the owner's core complaint)
- The honesty guarantee = the hero **ships with the recipe** from the bulk source
  (photo attached to its own dish → can't mismatch). Confirm the import used
  bundled photos, not category-guess matching.
- **Spot-audit** a stratified sample (≥3 per chapter, ≥40 total): open each recipe,
  compare hero to the dish name. Log any mismatch in `docs/photo-honesty-pass.json`.
- Any mismatch or missing photo → **generated art** (never a wrong-dish photo, never a
  broken image). Fix at the source (id→image map), not per-page.
- Re-confirm: 0 broken images, blur placeholder on every hero, `withBase()` paths.

## 3. Perf at 956 (prove no lag)
- `WarmLeafPool` ±N + `AssetPreloader` must keep flips cold-start-free at this scale;
  **never mount all 956**. Search over 956 must stay instant (indexed, debounced).
- Measure: `PerformanceObserver('longtask')` → no >50ms task on flip / chapter hop /
  search; steady ~60fps; memory stable over a long session (no leak). Bundle not
  bloated by the data (recipes are data, not code — confirm tree-shaking / no giant
  synchronous parse blocking first paint). Numbers → `PERF.md`.
- Contents/chapter pages with big chapters must not render 400 rows at once — paginate
  or virtualize the list; tab labels still fit.

## 4. Re-run the linkage gate (fail build on any)
0 duplicate ids · every `related` resolves · every `chapter` valid AND has a
`chapters.ts` entry · contents counts == `RECIPES.filter(chapter)` · every recipe has
hero-or-art · search finds new recipes · paper-tab labels don't clip.

## 5. Ship
`typecheck`+`lint`+`build` green. Commit groups (`fix: rebalance chapters`,
`chore: photo honesty audit`, `perf: 956 scale`). Bump VERSION/package/version.ts →
2.3.0, SW → `cookcap-v16`, CHANGELOG/HANDOVER/QA-MATRIX/PERF/Capricorn together. Push
`main`. Regenerate gallery (contents page showing balanced chapters + a few new-chapter
dividers). Final report: new chapter distribution table, honesty sample results, perf
numbers, linkage-gate pass.
