# Changelog

## 2.2.2 — 2026-08-02

### Fix (PWA update)
- **SW cache** → `cookcap-v8` (header comment no longer says stale `v2`; grep the `const VERSION`)
- Register path calls `reg.update()` + `SKIP_WAITING` so installed PWAs leave old caches
- Grounding still pure CSS `--book-h` (confirmed live at 1280)

## 2.2.1 — 2026-08-02

### Fix (desktop first paint)
- **Book grounding** — pure CSS `vh` box (`--book-h` + width = h×5/7); no `%` of flex parent. Fresh load at 1280/1440/1920 is big + centered (resize no longer required)
- Cloth tabs — `left: 6px` nudge off fore-edge seam
- SW → `cookcap-v7`

## 2.2.0 — 2026-08-02

### Final ship (punch list + system screens)
- **Cloth tabs** — `width:auto` so labels (“Pakistani”…) no longer clip; origin nudged
- **Linen cover** — light skins (Editorial / Light Book / Modern-light) use cream cover, not muddy leather
- **Splash** — quiet CookCap mark until store ready (~real load + 280ms polish)
- **Welcome** — NameGate step 0: living family cookbook value prop before name
- **About & data** — ··· → About: version, privacy, licenses, export JSON, delete-all (confirm)
- **IA** — ··· ordered identity → tools → sound → About last; Appearance stays top-bar
- Docs: `AUDIT.md`, `IA-RATIONALE.md`, `QA-MATRIX.md`, `PERF.md`; SW → `cookcap-v6`

## 2.1.0 — 2026-08-02

### Appearance system (beautify plan)
- **Skins** — Editorial Cream (default), Candlelit, Light Book, Modern via `data-skin` CSS tokens
- **Chapter tabs** — Cloth (default), Side Index, Top Segmented, Classic Pills via `data-tabs`
- **Reading mode** — Flip (default) vs Fast chapter/recipe jumps
- **Appearance panel** — palette button → live skin/tabs/read; persists `cookcap-skin|tabs|readmode`
- **Brand hierarchy** — header `CookCap` + `— {NAME}'S KITCHEN`; cover personal title + tiny CookCap foil; never "Family Cooks"
- **Desktop grounding** — taller book (`clamp(560–820)`), lamp pool, contact shadow, ultrawide cap 1400px
- **First-run** — book paints first, then warm welcome card over blurred desk
- SW → `cookcap-v5`; gallery appearance matrix `{skin}-{tabs}-cover.png`

## 2.0.1 — 2026-08-02

### Honesty + audit
- **Lighthouse** (live Pages): desktop Perf **96** / A11y **100** / BP **96** / SEO **63** (SEO = intentional `noindex` only). Reports in `docs/lighthouse*`
- **Photo honesty pass** — stripped 34 wrong-dish stock heroes → generated art fallback; report `docs/photo-honesty-pass.json`
- **Estimate labels** — cost shows `~Rs` + grocery estimate hint; macros always labeled estimate vs hand-checked; fit badge / healthier / budget copy tightened

## 2.0.0 — 2026-08-02

### Profiles, modes, nutrition & calendar (phases 1–12)
- **Profiles** — IndexedDB household eaters (biometrics → Mifflin–St Jeor targets); TopBar switcher; manage drawer; optional NameGate steps
- **Modes (data presets)** — Reader (default, untouched book), My Plate, Mother, Budget, Quick, Beginner, Dawat, Ramadan, Toddler, diabetic/heart/fiber lenses, Couple — `ModeDef` registry + recommender
- **My Plate** — fit badges, **For You** leaf after Contents, estimated-macros hint
- **Make it healthier** — swap engine + before/after macros; curated swaps on 28 flagships
- **Log + Calendar** — log meals offline; month rings; planned vs eaten; streaks
- **Mother Mode** — cooking-for multi-select + allergen flags for selected eaters
- **Budget / Pantry** — PKR cost estimates, weekly grocery budget, pantry inventory + cook-from-what-you-have
- **+32 goal recipes** (`goal-*`) with `macrosVerified: true` (breakfast / high-protein / light / budget)
- SW → `cookcap-v3`; docs + gallery updated

### Honest labels
- Macros/costs = estimates unless `macrosVerified`; health modes carry “not medical advice”
- Reader mode stays the pure book when lenses ignored


## 1.5.1 — 2026-08-02

### Fix (mobile + GitHub Pages)
- **Recipe photos 404 on Pages** — `unoptimized` Next Image ignored `basePath`; all hero/step/preload URLs now use `withBase()` (`/CookCap/recipes/...`)
- Manifest + icons metadata prefixed for `/CookCap/`
- SW → `cookcap-v2` (cache bust)
- **Phone reader** — full-bleed leaf (no crushed `aspect-[5/7]` + leather case); hide fore-edge/page-stack on `<640px`; Tabs FAB fixed above footer (no overlap on book)
- Phone chrome: Search + ··· only (Favorites / theme in menu); Tabs in footer (no FAB); header/footer `z-30` so ··· menu not covered by book; install banner at top
- Recipe hero / padding tuned for narrow screens
- Flip: lower horizontal intent (8px), `touch-pan-y` + lock `touch-action:none` while curling

### Honest scope (MASTER_PROMPT)
- Phase **0 stabilize** only this ship (mobile/images/flip/Pages). Profiles / modes / nutrition / calendar (phases 1–12) **not** built yet — still planned in `docs/plan-profiles-modes.md` + `MASTER_PROMPT.md`.

## 1.5.0 — 2026-08-02

### Rebrand
- Product name → **CookCap** (Cap family)
- First-run **name gate** → book title `{Name} Cooks`; ··· → Change book name
- Share links use `?for=Name`; migrates legacy `jia-edition` / theme keys

### Hosting
- Next `output: 'export'` + GitHub Pages workflow (same model as PulseCap/VaultCap)
- SW `cookcap-v1` basePath-aware for `/CookCap/`
- Live target: https://shamikhahmed.github.io/CookCap/

### Docs
- README / HANDOVER / USER_GUIDE / PRESENTATION / gallery synced; `npm run gallery` includes name gate

## 1.4.1 — 2026-08-01

### Fix
- **Mobile book stage** — stop subtracting 10rem width on phone (tabs sheet, no fat rail); book was crushed / looked “not opening”
- **Missing `@sm` heroes** — generated 69 thumbnails (mostly FoodFusion); kills preload 404 storm
- Dialog a11y: shared `useDialogA11y` (focus trap + Escape + restore) on search/drawers/cook/import/tabs sheet
- Cook mode: concurrent timers across steps; reduced-motion springs
- Dead 2P/`spread` API removed from AppStore + BookController
- RecipeImage pulse skeleton while decode
- Lint clean

### Docs
- `PRESENTATION.md` + `docs/gallery/` screen gallery (desktop + mobile); `npm run gallery`
- README / HANDOVER / depth prompt synced to 1.4.1; GitHub repo public

## 1.4.0 — 2026-08-01

### Fixes
- **Page total** — footer waits on IndexedDB `ready`; documents that desktop/phone totals differ when `customs` imports exist (per-origin). Bundled book = **218** leaves (+ customs)
- **Desktop book grounded** — vertically centered, aspect-locked stage using available height; fat right margin for tabs kept
- Safe-area insets for notch / home bar

### Features
- **Meal planner** — week view (IndexedDB meta); assign recipes; “Add week to shopping”
- **Shopping** — aisle grouping (Produce / Proteins / Dairy / Pantry / Other); merge duplicate ingredients
- **⌘K quick actions** — Surprise me, toggle theme, shopping, this week, jump Pakistani
- **Haptic** on successful page turn (`navigator.vibrate`, guarded)
- Drop-cap on Jia’s story; print stylesheet polish; offline.html + SW `jia-v7`
- Private robots.txt; richer OG / icons metadata

### Verified
- Recipe data: **0** duplicate ids, **0** broken `related`, all chapters valid (**203** recipes)
- Favorites chapter already lists live hearts
- `npm run typecheck` green

## 1.3.3 — 2026-08-01

### 3D book depth (physical realism)
- **Fore-edge thickness now scales with remaining pages** — `.book-edge` width is driven by an inline `--edge-w` var computed from reading position (thick block near the start, thinning toward the back cover). CSS transition; instant under reduced-motion.
- **Chapter tabs sit at real depths tied to where you are** — the chapter you're reading extrudes and brightens; already-read chapters recess into the block (`.sticker-tab--recessed`, dimmer/desaturated); upcoming chapters tuck deeper into the remaining stack. Extrusion/tuck/z/elevation derived from `chapterStart` vs `index`; spring eased, instant under reduced-motion. Replaced the old static `DEPTH`/`ELEV` arrays.
- **Page-curl presence** — turning sheet gains a visible paper-thickness edge on the lifting side (`edgeThickness`/`edgeOpacity`) plus a faint bend squash (`bendSquash` scaleX). One curl at a time preserved; chapter hops still curl; no flip-storm.
- **Tablet touch targets** — rail tabs raised to 44px on tablet (rail is finger-driven there).

### Unchanged (guardrails held)
- No scroll-to-turn; scrollbar chrome still hidden; WarmLeafPool neighbor window + AssetPreloader intact; device split (phone sheet / tablet softer edge / desktop fat margin) preserved; no new deps.

## 1.3.2 — 2026-08-01

### Content honesty
- **Step photos rematched** — killed Foodish/LoremFlickr junk (latte→cupcake, bread→dosa, gulab→samosa, KFC→stir-fry)
- Curated Unsplash + MealDB via `scripts/rematch-step-images.mjs`; `fetch-step-images.mjs` disabled
- **Removed** dishonest packs when no honest stock: balushahi, gulab-jamun, kheer, cupcakes, chocolate-orange-swirl, nihari-*, pakistani-stew, simple-buns
- Kept **45** CORE recipes with dish-correct step photos (~120 files); map paths verified on disk
- All **54** CORE family recipes still in catalog; **203** total recipes

### UX
- Scrollbar chrome fully hidden (scroll still works)

### Docs
- `docs/photos.md`, HANDOVER, README; Claude Code depth prompt: `docs/claude-code-depth-prompt.md`

## 1.3.1 — 2026-08-01

### Performance
- **Flip warm** — on enter, idle-preload every recipe hero (`webp` + `@sm`) and step photos into browser + SW (`CACHE_URLS`)
- **Neighbor leaf pool** — keep ±3 pages mounted off-screen (`passive`) so next flip does not cold-mount React + images
- Heroes use `unoptimized` so preload URLs match what the leaf paints

## 1.3.0 — 2026-08-01

### Experience
- **3D chapter tabs** — elevation bands (some above / some below), depth peek, paper slits, fat fore-edge with leather lip
- **Bookmark flips** — tapping a chapter tab curls 1–2 pages toward that section (not an instant cut)
- **Journal desk** — parchment vignette, grain, soft lamp mask; Contents “Today’s kitchen” cook ideas
- **Quiet kitchen standard** — pork / wine / gelatin swapped for chicken, stock/juice, agar (no badge; family knows)
- **Responsive** — phone sheet with flip copy; tablet softer edge angle; desktop wider book + deep right margin
- SW → `jia-v6`

### New
- `src/lib/recipes/ideas.ts` — time-of-day recipe picks for the contents page

## 1.2.3 — 2026-08-01

### Content perfection
- All **31** FoodFusion cards rewritten Jia voice (taste/texture/story/times/nutrition); Roman Urdu tips kept; no FF promo
- Hero rematch: drinks → Unsplash (chai/latte/lassi…); Alfredo → Fettuccine Alfredo; nihari stand-in Massaman; omelette → Bread omelette; no more steak-for-chai
- Short drinks thickened to 3 clear steps (affogato, golden latte, espresso tonic, mango lassi)

### Product
- Cover fades in after edition resolve — no Jia→Ali flash
- SW → `jia-v5`; sticker touch targets ≥44px; collections store marked reserved (UI unused)

## 1.2.2 — 2026-08-01

### Fix
- Hydration crash (`a[d] is not a function`): edition always starts as Jia on SSR; resolve `?for=` / localStorage only after mount
- Overwrote `karahi-chicken` hero with fresh MealDB plate
- Stickers attached to book case edge (not floating in empty margin); heroes backfilled — all non-tip recipes have webp + blur manifest (Saag Gosht etc.)

### Family cookbook leaf
- All 54 core recipes verified (biryanis ×9, iced lattes ×8, curries, baking, KFC…)
- Titles aligned to family list; heroes + **162** step photos wired (first/mid/last)
- Recipe leaf: “From our family kitchen”, protein/carbs/fat up front, rating prompt, softer nutrition copy
