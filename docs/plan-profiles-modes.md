# Jia Cooks / CookCap — Plan: Profiles, Modes, Nutrition & Calendar

> **Status 2026-08-02:** Product **CookCap** **v2.0.0**. Phases **0–12 shipped**
> (profiles, modes, nutrition, calendar, pantry, budget, goal recipes, docs/gallery).
> Cloud sync (opt phase 13) still out of scope.

Hand this to Cursor. It is a **plan first**, then a build brief. Working dir =
this repo. Stack: Next.js 15 · React 19 · TS strict · Tailwind v4 · Motion ·
IndexedDB · SW. Current **v2.0.0**. Offline-first, no accounts.

The book/reader experience is finished and must stay intact. Everything below is
**additive** — a lens on top of the book, never a replacement. If a user ignores
all of it, Jia Cooks still works exactly as the heirloom book it is.

---

## 0. Confidence audit (fix/verify before building on top)

These are the places I'm least sure are right. Nutrition tracking makes some of
them load-bearing, so verify them first.

1. **Per-recipe macro accuracy.** `Recipe.nutrition` (kcal/protein/carbs/fat/fiber/
   sugar) exists for all 186, but many were builder-**estimated**, not measured.
   Calorie/protein tracking is only as trustworthy as this data. Action: add a
   `macrosVerified?: boolean` flag, show an "estimated" hint in the UI when false,
   and let a profile-owner correct a logged entry's macros. Consider a small
   per-ingredient kcal/protein table to recompute more honestly.
2. **Photo↔dish honesty.** `data-foodfusion.ts` + the Foodish category fallback in
   `scripts/fetch-images.mjs` can attach a plausible-but-wrong photo (e.g. random
   "biryani" image for a specific dish). Audit; prefer generated art over a wrong
   photo. This matters more once recipes are recommended by goal.
3. **Page-total consistency across devices** (`/318` desktop vs `/218` phone seen
   earlier). Confirm leaf count is identical across breakpoints or intentional.
4. **Desktop book grounding/size** — still small/top-left on wide screens; center +
   scale within the reserved tab margin.
5. **Bookmarks vs the intended mental model.** Confirm with the owner: laminated
   tabs at different **paper depths** is implemented (right rail on desktop, sheet
   on phone). If the ask was **top-edge** tabs, that's a layout change — get a yes
   before moving them.
6. **Data integrity** across `data.ts` / `data-extra.ts` / `data-fill.ts` /
   `data-foodfusion.ts`: no dup ids, every `related` resolves, valid `chapter`,
   sane spice/allergens.
7. **Perf with 186 recipes + images** — keep `WarmLeafPool` + `AssetPreloader`;
   never mount the whole book; watch bundle + memory.

---

## 1. Product concept

Add a **who-is-this-for lens** without turning the book into a fitness app.

### Household + Profiles (local, no auth)
A household has 1–N eaters. Each **profile**:
- name, avatar (reuse the Kitchen-Friend art style / color),
- optional biometrics (sex, age, height, weight, activity) → auto **targets** via
  Mifflin–St Jeor; or fully manual targets,
- **goal**: maintain / lose (cut) / gain (bulk) / none,
- **diet prefs**: vegetarian/vegan, avoid-list (allergens from `Recipe.allergens`),
  spice tolerance,
- daily **targets**: kcal, protein, carbs, fat.

Profiles are IndexedDB-only and private. (Future: optional export/sync — out of
scope now.)

### Modes (chosen at start, switchable any time)
- **Reader** (default) — the pure book. No badges, no tracking. Untouched.
- **My Plate** (personal / gym) — the active profile drives it: recipes get a
  **fit badge** ("+38 g protein · fits your cut"), a **"For You"** shelf ranks
  goal-fitting recipes, and each recipe offers **"Make it healthier"** swaps and
  **"Log this"**.
- **Mother Mode** — cooking *for others*. Pick who you're cooking for (self, a
  child profile, the whole family, or "guests / event: N people"). The recipe
  **auto-scales servings**, aggregates the selected eaters' targets, and flags
  allergens that matter for *those* people. Extends the existing serving stepper +
  combined shopping list + meal planner.

Mode is a soft overlay: switching to Reader hides all of it instantly.

### "Make it healthier"
A per-recipe toggle that applies a **swap engine** and shows before/after macro
bars. Generic swaps with deltas: butter→Greek yogurt, cream→evaporated milk,
sugar→dates/less, white rice→brown, deep-fry→air-fry, full-fat→low-fat dairy,
add-a-veg, portion-down. Recipes may also carry curated `healthierSwaps` for
hand-tuned accuracy. Always show it as an *estimate*.

### Diary + Calendar
- **Log a recipe** (servings + which profile + meal slot) to a date.
- **Today ring**: kcal + protein vs target, with a gentle streak.
- **Calendar** (month/week): each day shows consumed kcal/protein vs goal;
  overlay **planned** (meal planner) vs **eaten** (diary). Tap a day → entries,
  edit/remove, quick "cook again". Weekly protein average + adherence.

---

## 2. Data model (additive)

`src/lib/recipes/types.ts`
```ts
// Recipe additions (all optional — nothing breaks)
macrosVerified?: boolean;
dietTags?: ('vegetarian'|'vegan'|'high-protein'|'low-cal'|'gluten-free'|'low-carb')[];
healthierSwaps?: { from: string; to: string; deltaKcal?: number; deltaProtein?: number; note?: string }[];
```

New domain (`src/lib/profiles/types.ts`):
```ts
type Goal = 'maintain' | 'cut' | 'bulk' | 'none';
interface Targets { kcal: number; protein: number; carbs: number; fat: number }
interface Profile {
  id: string; name: string; color: string; avatar: string; // friend art id
  sex?: 'f'|'m'|'na'; age?: number; heightCm?: number; weightKg?: number;
  activity?: 1.2|1.375|1.55|1.725; goal: Goal;
  vegetarian?: boolean; vegan?: boolean; avoid: string[]; spiceMax?: number;
  targets: Targets; targetsManual?: boolean;
}
type Mode = 'reader' | 'plate' | 'mother';
interface DiaryEntry { id: string; date: string; profileId: string;
  recipeId: string; servings: number; meal: 'breakfast'|'lunch'|'dinner'|'snack';
  kcal: number; protein: number; carbs: number; fat: number; healthier?: boolean }
```

IndexedDB (`src/lib/db/store.ts`, bump version + `upgrade`):
- `profiles` (keyPath id), `diary` (keyPath id, index by `date` and `profileId`),
- `meta`: `activeProfile`, `mode`, `household` order.
Guard the migration; never wipe existing favorites/notes/ratings/meal-plan.

Compute helpers (`src/lib/profiles/nutrition.ts`): Mifflin–St Jeor BMR × activity ±
goal delta (cut −15%, bulk +10%); protein target = 1.6–2.2 g/kg (or manual);
scaleMacros(recipe, servings); applySwaps(recipe) → adjusted macros.

## 3. UI surfaces
- **Onboarding**: extend `NameGate` → after the name, an *optional, skippable*
  "Who eats from this book?" step (add a profile) and "Pick a mode". Skipping =
  Reader mode, current behavior.
- **Profile switcher** in `TopBar` (avatar row + "Cooking for…"). In Mother Mode it
  becomes a multi-select "cooking for" chip set.
- **"For You" leaf** (only when mode≠reader): a special leaf after Contents ranking
  goal-fit recipes; reuse `ideas.ts` ranking, add goal/macros scoring. Never mounts
  the whole book.
- **Recipe page** (`RecipeLeaf`): a compact **fit badge**, **"Make it healthier"**
  toggle (before/after macro bars), **"Log this"** button (date + servings + profile
  + meal), and an "estimated macros" hint when `!macrosVerified`.
- **Calendar drawer** (like `MealPlannerDrawer`): month grid, rings, planned vs
  eaten, tap-day detail; weekly protein/adherence summary.
- All new surfaces: keyboard-accessible, reduced-motion-safe, offline, respect the
  no-scrollbar-chrome + focus-trap patterns already in the app.

## 4. More recipes (goal-friendly)
Add via the compact `r({…})` builder in `data-extra.ts`/`data-fill.ts`; index,
search, tabs update automatically. Prioritize honest macros (`macrosVerified: true`
where hand-checked). Suggested set (breakfast + high-protein + light):
overnight oats, egg-white masala omelette, Greek-yogurt protein bowl, chicken chapli
bowl, daal (high-protein), grilled chicken karahi (lean), protein smoothie, chana
chaat, tuna sabudana, paneer bhurji, besan chilla, baked (not fried) samosa,
air-fryer tikka, fruit + nut chia pot. Consider **tag-based** "Healthy" / "Breakfast"
shelves rather than new chapters, to keep the book's chapter spine stable (confirm
with owner before adding chapters).

## 5. Privacy & honesty (non-negotiable)
- Profiles/diary are **local device data**, not accounts. No network, no tracking.
- This is **not** medical advice. Show a one-line disclaimer on targets. Never
  prescribe extreme deficits; floor kcal at sane minimums.
- Label estimated macros as estimates. "Make it healthier" is guidance, not fact.

## 6. Phasing (ship in slices, each independently useful)
1. **Foundation** — profile + diary stores + migration; `nutrition.ts`; Mode state
   in AppStore; Reader mode unchanged.
2. **Profiles UI** — onboarding step, TopBar switcher, manage-profiles drawer.
3. **My Plate** — fit badges + "For You" shelf + goal ranking.
4. **Make it healthier** — swap engine + before/after bars + curated swaps on ~20
   flagship recipes.
5. **Log + Calendar** — Log this, today ring, calendar drawer, planned-vs-eaten.
6. **Mother Mode** — cooking-for multi-select, serving aggregation, allergen flags
   for selected eaters, combined shopping/meal-plan.
7. **Recipes + honesty pass** — add goal-friendly recipes with verified macros;
   fix estimated ones; photo audit.
8. **Mode engine + cost** — declarative `ModeDef` + recommender scoring;
   `ingredient-cost.ts` (PKR) + `estCostPerServing`; mode chooser UI (shared).
9. **Student / Budget mode** — cost-per-serving, weekly grocery budget tracker,
   pantry-aware shopping, leftover remix, batch meal-prep.
10. **Pantry + more modes** — pantry inventory + match; then Quick, Beginner,
    Dawat/Event, Ramadan, Toddler, and health-lens presets (mostly data).

## 6b. Modes as data, not code (architecture)

A **Mode is a scoring/filter preset** over recipe fields — never a code fork.
Define modes declaratively so adding one is ~10 lines of data:

```ts
interface ModeDef {
  id: string; label: string; blurb: string; icon: string; color: string;
  // soft filters (hide nothing hard unless allergen/diet): prefer/boost
  boost?: Partial<{ highProtein: number; lowCal: number; lowCost: number;
    quick: number; fewIngredients: number; lowSugar: number; lowSodium: number;
    highFiber: number; makeAhead: number; batch: number }>;
  maxMinutes?: number; maxCostPerServing?: number; equipmentExclude?: string[];
  showCost?: boolean; showMacros?: boolean;
}
```
The recommender scores each recipe = Σ(boost × normalizedSignal) − penalties
(allergens for the active eaters, over-time, over-budget). "For You" + fit badges
read from this. Reader mode = empty preset (no scoring, no chrome).

### New recipe fields to power modes (all optional, additive)
```ts
estCostPerServing?: number;   // in PKR; from an ingredient price table
costTier?: 'budget'|'mid'|'splurge';
totalMinutes?: number;        // prep+cook cached
equipment?: string[];         // already exists on some recipes
pantryStaple?: boolean;       // uses mostly cupboard basics
servesCrowd?: boolean;        // scales well for events
```
Cost is estimated the same honest way as macros: a small local
`ingredient-cost.ts` table (PKR, editable) × quantities, labeled as an estimate.
Locale/currency configurable (default PKR; user can switch).

## 6c. Mode catalog (build the presets; UI is shared)

Each mode is a lens; several can co-exist with a profile. Ship the engine + 3–4
modes first, then the rest are data.

- **Reader** — the pure book. No scoring, no chrome. (default)
- **My Plate (Gym/Goal)** — boost highProtein + (lowCal|highCal by goal); fit
  badges; "make it healthier"; log + calendar.
- **Mother Mode** — cook-for multi-select; serving aggregation; per-eater allergen
  flags; combined shopping + meal plan.
- **Student / Budget** — boost lowCost + batch + pantryStaple; show **cost per
  serving** and a **weekly grocery budget** tracker; "cook from what's in the
  pantry"; leftover remix; cheapest-protein swaps; bulk meal-prep planner.
- **Quick (15–20 min)** — `maxMinutes`; boost quick + fewIngredients; weeknight
  rescue.
- **Beginner / First Kitchen** — boost fewIngredients + no-special-equipment;
  foolproof steps; skill path via the Tips chapter.
- **Dawat / Event** — pick headcount → scale + a **prep timeline** (what to make
  when), make-ahead flags, a menu builder + one combined shopping list.
- **Ramadan** — Sehri/Iftar slots; hydrating + slow-energy picks; timing-aware.
- **Toddler / Weaning** — soft, low-salt, age-appropriate; portion sizes for kids.
- **Health lenses** (opt-in, clearly "not medical advice"): **Diabetic-friendly**
  (lowSugar/lowGI), **Heart-smart** (lowSodium/lowSatFat), **High-fiber/Gut**,
  **PCOS-friendly**. These are boosts + soft warnings, never diagnoses.
- **Couple / Just-me** — default servings 2 or 1; small-batch guidance.

## 6d. Cross-cutting features (mode-agnostic)
- **Pantry inventory** (IndexedDB): what you have → recipe match ("you can make X
  now, need 2 more for Y"), gentle expiry nudges, waste reduction.
- **Smart shopping list**: aisle grouping, merge duplicates, **pantry-aware** (only
  add what's missing), running cost estimate + budget cap, share/export, check-off.
- **Cost intelligence**: cost-per-serving, cost-per-gram-protein (great for Student
  + Gym), "stretch one chicken into 3 meals", cheaper-swap suggestions.
- **Leftover remixer**: log leftovers → next-day ideas.
- **Batch / meal-prep planner**: Sunday-cook → labelled containers for the week;
  ties into calendar + shopping.
- **Family contributions**: each household member can add their own recipes → they
  surface under a personal shelf; keeps the "heirloom passed down" feeling.
- **Streaks & stamps** (gentle, not gamey): "cooked it" stamps, protein streak,
  tried-every-chapter badge — warm, never nagging.
- **General substitution engine**: out of an ingredient → safe swaps with deltas.

All of the above stay: offline-first, local-only, keyboard-accessible,
reduced-motion-safe, no scrollbar chrome, book never fully mounted, and **honest**
(cost + macros labeled as estimates; health modes carry a one-line disclaimer).

## 7. Out of scope (for now)
Accounts/auth, cloud sync, wearable integration, barcode scanning, real dietitian
logic, social sharing of diaries. (Note them as future ideas only.)

## 8. Definition of done (per slice)
- Reader mode visually identical to today; all new UI is opt-in and removable.
- `npm run typecheck` + `build` + `lint` green; Lighthouse stays near 100s.
- Offline works; IndexedDB migration preserves existing user data.
- Everything keyboard-accessible + reduced-motion-safe; no scrollbar chrome; book
  never fully mounted.
- Docs updated together: `VERSION`/`package.json` (minor bump per slice),
  `CHANGELOG.md`, `HANDOVER.md`, `USER_GUIDE.md` (how to add profiles, log meals,
  read the calendar, add goal recipes), `docs/adding-recipes.md`, and a dated line
  in the Capricorn note `~/Capricorn-Brain/01 Projects/Jia-Cooks.md`.
- Then commit; push to the repo.
