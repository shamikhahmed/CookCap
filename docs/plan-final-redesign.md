# CookCap — Final redesign + 500 recipes (build spec)

Structure is solid (3D dresser world, paper tabs, appearance skins). This is the
quality + content pass: honest imagery, crisp reading, upgraded type, a refined
recipe layout, a full visibility audit, and **+500 recipes properly linked**.
Guardrails hold. Verify by DOM + real-device (pane pixels lie).

## Owner decisions (locked)
- **One hero image per recipe. REMOVE step-by-step photos entirely** (they mismatch).
- **Real photos, sourced correctly** — the honesty rule below makes mismatch impossible.
- Reading content on **clean paper pages** (skin colors) for legibility; **wood only as
  the surrounding table/frame**. Contrast AA everywhere.
- **Typography upgraded** (see §3). **Refined-editorial** recipe layout (§4).
- **+500 more recipes**, everything linked (index, tabs, search, related, favorites, For You).

---

## 1. Imagery — honest by construction
The recurring failure = attaching a photo that isn't the dish. Kill it structurally:
- **The hero photo must ship WITH the recipe** from a source that bundles the correct
  image (TheMealDB `strMealThumb`, etc.). A photo that arrives attached to its own
  recipe cannot mismatch. This is the honesty guarantee — use it for all new recipes.
- **Remove step images**: delete `step.image` usage + the step-image render in
  `RecipeLeaf`, the `stepImages.ts` map, `public/recipes/steps/*`, and the
  fetch/rematch step scripts. One hero only.
- Legacy recipes whose hero is a category-guess/mismatch: re-source from a
  photo-bundled dish match, or fall back to generated art. Never a wrong-dish photo.
- Pipeline per hero: download → `sharp` → `<id>.webp` (1600) + `<id>@sm.webp` (800) +
  20px blur into the manifest. Local, offline, `withBase()`. Broken/absent → generated art.
- Preload + WarmLeafPool unchanged: current + neighbor heroes warmed; no pop, no lag.

## 2. Reading surface + visibility audit
- Recipe pages, contents, chapter dividers = **paper** (`--color-paper*` per skin),
  generous margins, crisp ink. Wood is the table *around* the book, never behind body text.
- **Full visibility sweep** — every screen × 4 skins × light/dark: no text blends into
  wood or paper; dividers/borders/tabs visible; **AA everywhere, ≥7:1 for critical**
  (safety warnings, allergens). Fix any low-contrast token pairing.
- Backgrounds never wash out text; gradients/vignette stay behind a legible surface.

## 3. Typography (upgrade, tokenized)
- Keep **one display/serif voice + one UI/body face**, but level them up to a timeless
  cookbook feel. Recommended: a refined book serif for titles (Fraunces is fine tuned,
  or a classic like Source Serif / Newsreader) + a quiet, highly legible body
  (serif for recipe body, sans for chrome). Load via `next/font`, self-hosted.
- One **modular scale** (tokens already exist) — audit EVERY role: recipe title,
  section head, ingredient, step, quick-fact, label, caption, badge, hint, button.
  Body ≥16px. Consistent line-height + measure (60–72ch max on wide). `text-wrap:
  balance` on headings; no widows/orphans; smart quotes; tabular figures for
  times/macros. A tasteful drop-cap on Jia's story.

## 4. Recipe page — refined editorial (rebuild the layout)
Top→bottom, one clear hierarchy, tokenized spacing:
- **Hero** (single photo, aspect-locked, blur-up) with title + cuisine overlaid.
- **Quick facts** row: time · difficulty · servings · calories (icons, tabular).
- **Jia's note** (drop-cap), taste/texture, spice pips, allergens.
- **Ingredients** (servings scaler) and **Method** (numbered, tap-to-check) — clean,
  no step photos. Timers inline.
- Chef tips / common mistakes / storage / **related recipes** (real links).
- Consistent section dividers, spacing, and rhythm across every recipe.

## 5. +500 recipes, properly linked
Target **≥500 total** (currently ~250). Do it honestly + automatically:
- **Source** from photo-bundled datasets (TheMealDB across every category + area = the
  bulk; add other free/CC recipe data that ships its own photo). Each import → a
  structured `Recipe` (id, chapter, title, tagline, cuisine, difficulty, time,
  servings, nutrition[estimate-labeled], tags, ingredients[], steps[], hero from the
  source photo). Generate stories/taste in a warm neutral voice (edition-agnostic).
- **Map to chapters** by cuisine/category; keep chapter ids valid. Spread across all
  chapters (don't dump 400 into one).
- **Dedupe** by id + title; **auto-related** (same chapter/tags/cuisine); **search
  index** picks them up automatically (data-driven — no manual wiring).
- Write to `src/lib/recipes/data-*.ts` via the compact builder. If a source has fewer
  honest photo-matched dishes than 500, **say so** — never pad to a number with
  mismatched images or invented dishes.
- Run the scrape/optimize as a script (`scripts/`), commit images + generated TS.

## 6. Linkage integrity gate (prove it)
Assert in a check script, fail build on any:
- **0** duplicate recipe ids across all `data-*.ts`.
- **every** `related[]` id resolves to a real recipe.
- **every** `chapter` is a valid `ChapterId`; every chapter has ≥1 recipe; counts on
  the contents page match `RECIPES.filter(chapter)`.
- **every** recipe has a hero (photo on disk + manifest) OR falls to generated art —
  no broken image, no wrong-dish photo (spot-audit a sample).
- search returns new recipes; favorites/For-You/meal-planner can reference them.

## 7. Ship (phased)
P1 remove step images + visibility/contrast audit + typography.
P2 recipe-page refined layout.
P3 +500 recipe ingestion + images + linkage gate.
Each phase: `typecheck`+`lint`+`build` green; regenerate gallery; bump
VERSION/SW/CHANGELOG/HANDOVER/QA/PERF/Capricorn together; push `main`; verify live by
DOM + real-device. Final report with the linkage-gate output, contrast results, and
the recipe count.
