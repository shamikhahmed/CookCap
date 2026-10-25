# CookCap UI inventory (production audit)

Generated from source under `src/` and `next.config.mjs`. Navigation is **in-book** (leaf index), not URL routes, except deep links and query hooks on `/`.

---

## Entry points & routing

- [ ] **Next.js static export** — `output: 'export'` in `next.config.mjs`; optional `NEXT_PUBLIC_BASE_PATH` for GitHub Pages
- [ ] **App Router pages**
  - [ ] `/` — `src/app/page.tsx` → `<Shell />` (single interactive surface)
  - [ ] `not-found` — `src/app/not-found.tsx` (“Missing leaf” → link home)
  - [ ] `error` — `src/app/error.tsx` (route error recovery)
  - [ ] `global-error` — `src/app/global-error.tsx` (layout failure)
- [ ] **Static public HTML** (not React shell)
  - [ ] `public/privacy.html`
  - [ ] `public/offline.html`
  - [ ] `public/changelog.html`
- [ ] **Root layout** — `src/app/layout.tsx`: fonts, theme init script, `<AppStore>`, `<ServiceWorker>`, `<ChunkRecovery>`
- [ ] **Provider stack** — `src/components/app/AppStore.tsx`: `AppearanceProvider` → `GuestProvider` → app context
- [ ] **URL query hooks** (same `/` document)
  - [ ] `?recipe=<id>` — open book at recipe leaf (`BookController.tsx`)
  - [ ] `?open=search|shop|plan` — open overlay/drawer (`Shell.tsx`)
  - [ ] `?share-target=1`, `?text=`, `?title=` — open import (`Shell.tsx`)
  - [ ] `?restore=1` — open About (`Shell.tsx`)
  - [ ] `?demo=1` — QA/demo edition, skip name gate (`lib/edition.ts`)
  - [ ] `?for=<name>` — personalize & persist owner (`lib/edition.ts`)
  - [ ] `?dt=` — dynamic type scale (layout inline script)
- [ ] **Keyboard** — ⌘/Ctrl+K → Search (`Shell.tsx`)
- [ ] **Custom events** — `cookcap-open-chapters` (footer “Tabs” → chapter sheet on phone, `BookmarkRail.tsx`)

---

## Book navigation (non-URL)

- [ ] **Controller** — `src/components/book/BookController.tsx` (index, prev/next, goToLeaf/Chapter/Recipe, turn lock, `readMode`-aware chapter hops)
- [ ] **Renderer** — `src/components/book/Book.tsx` (page turn, cover hinge, swipe; hosts `BookmarkRail`)
- [ ] **Leaf mapping** — `src/components/book/LeafView.tsx` + `src/lib/book/pages.ts` (`buildLeaves`)

### Front matter (fixed order)

- [ ] **Cover** — `src/components/book/leaves/CoverLeaf.tsx` (open, optional cover photo upload/clear)
- [ ] **Title** — `src/components/book/leaves/TitleLeaf.tsx`
- [ ] **Friends** — `src/components/book/leaves/FriendsLeaf.tsx` (kitchen cast)
- [ ] **Contents** — `src/components/book/leaves/ContentsLeaf.tsx` (today’s ideas, occasions rail, chapter grid)
- [ ] **For you** — `src/components/book/leaves/ForYouLeaf.tsx` — **only when app mode ≠ `reader`** (`buildLeaves(..., mode !== 'reader')`)

### Chapters (each: divider leaf + recipe leaves)

Source: `src/lib/recipes/chapters.ts` (tab order = turn order).

- [ ] `pakistani` — `ChapterLeaf` + recipes
- [ ] `chinese`
- [ ] `italian`
- [ ] `european`
- [ ] `world`
- [ ] `desserts`
- [ ] `coffee`
- [ ] `breakfast`
- [ ] `breads`
- [ ] `baking`
- [ ] `snacks`
- [ ] `vegetarian`
- [ ] `meals`
- [ ] `favorites`
- [ ] `tips`

- [ ] **Chapter divider UI** — `src/components/book/leaves/ChapterLeaf.tsx` (blurb, recipe list / favorites hearts)
- [ ] **Recipe page** — `src/components/book/leaves/RecipeLeaf.tsx` (see sub-areas below)

### Recipe leaf — in-page sections & flows (not separate routes)

- [ ] Hero, favorite, quick facts, allergens, mother-mode allergen watch
- [ ] Mode extras: healthier toggle, **Log this** → `LogMealDialog`
- [ ] Star rating, servings scaler, ingredient checklist, method steps + inline step timers
- [ ] **Cooking mode** fullscreen overlay (`CookingMode.tsx`): phases `mise` → `cook` → `done`; glove mode; nested `LogMealDialog`
- [ ] Actions: print, add to shopping list, cook along, share link (`?recipe=`)
- [ ] Sections: Nutrition, Your kitchen copy (fork/edit inline `editOpen`), Good to know, Your notes, Serve with, Goes well with, Cook next
- [ ] Passive/warm pool — `WarmLeafPool.tsx` + passive `RecipeLeaf` for flip performance

---

## App chrome (`src/components/book/Shell.tsx`)

### Persistent / ambient UI

- [ ] Skip link — `#book-main`
- [ ] **Offline chip** — `src/components/app/OfflineChip.tsx`
- [ ] **SW update toast** — `src/components/app/SwUpdateToast.tsx`
- [ ] **What’s new** — `src/components/app/WhatsNewSheet.tsx` (version-gated dialog)
- [ ] **Guest banner** — when guest mode active (`GuestMode.tsx` + `Shell.tsx`)
- [ ] **Storage error bar** — dismissible alert in `Shell.tsx`
- [ ] **Splash** — `src/components/app/Splash.tsx` (until `ready` + `editionReady`)
- [ ] **Install banner** — `src/components/app/InstallBanner.tsx`
- [ ] **Asset preloader** — `src/components/app/AssetPreloader.tsx`

### Header (`TopBar` in `Shell.tsx`)

- [ ] Brand + edition subtitle (≥600px)
- [ ] Profile avatar button (hidden in **reader** mode)
- [ ] **Mode** letter button → `ModeChooser`
- [ ] **Search**
- [ ] **Appearance** — `AppearanceButton` in `src/components/app/Appearance.tsx`
- [ ] Favorites, theme toggle (desktop; skin-dependent), shopping cart (+ badge / bump)
- [ ] **More** menu (dropdown, not modal): favorites, theme, sound, shop, meal plan, profiles, mode, calendar, pantry, import, rename, about; mother-mode hint

### Main stage

- [ ] **Top chapter bar** — `TopChapterBar` in `BookmarkRail.tsx` (only `data-tabs=top` + not narrow)
- [ ] **Book** — `Book.tsx`
- [ ] **Bookmark / chapter rail** — `BookmarkRail.tsx` (see rail variants below)

### Footer (`BottomBar` in `Shell.tsx`)

- [ ] Home (cover), ±5 jump (sm+), prev/next, page scrub range, page count + **Go to page** popover dialog, **Tabs** (sm:hidden) → chapter sheet event

---

## Bookmark rail & chapter navigation (`BookmarkRail.tsx`)

- [ ] **Shipped default** — `data-tabs=paper`: `PaperTabRail` beside book (sm+ layout padding in `Shell.tsx`)
- [ ] **Phone (`max-width: 639px`)** — rail hidden; **Chapter tabs sheet** (side dialog) via footer Tabs or `cookcap-open-chapters`
- [ ] **Legacy tab styles** (localStorage / Appearance; picker ships paper only): `cloth`, `index`, `pills`, `top` (top segmented bar + rail hidden)
- [ ] **Chapter targets** — all `CHAPTERS` ids via `goToChapter`

---

## Cooking / reading modes (`src/lib/modes/registry.ts`)

App **mode** (lens) — chosen in `ModeChooser`, stored in app state; affects scoring, For You leaf, UI chrome:

- [ ] `reader` — pure book (no profile button; no For You leaf)
- [ ] `plate` — My Plate
- [ ] `mother` — Mother Mode
- [ ] `budget` — Student / Budget
- [ ] `quick` — Quick
- [ ] `beginner` — First Kitchen
- [ ] `couple` — Couple / Just-me
- [ ] `dawat` — Dawat / Event
- [ ] `ramadan` — Ramadan
- [ ] `toddler` — Toddler
- [ ] `diabetic` — Diabetic-friendly
- [ ] `heart` — Heart-smart
- [ ] `fiber` — High-fiber

**Appearance read mode** (`flip` | `fast`) — `Appearance.tsx` / `data-readmode`; chapter jumps animate vs instant (`BookController`).

**Theme** — `light` | `dark` | `system` via app store + header / More menu (when skin supports toggle).

---

## Overlays: sheets, drawers, dialogs

| Surface | Type | File | Opened from |
|--------|------|------|-------------|
| Search | Full-screen overlay | `src/components/search/SearchOverlay.tsx` | Header, ⌘K, `?open=search`, smart filters |
| Favorites & history | Drawer | `src/components/book/FavoritesDrawer.tsx` | Header, More |
| Shopping list | Drawer | `src/components/book/ShoppingDrawer.tsx` | Cart, More, search shortcuts |
| This week’s meals | Drawer | `src/components/book/MealPlannerDrawer.tsx` | More, `?open=plan`; sub-view **Pick for {day}** |
| Import WhatsApp recipe | Modal | `src/components/app/ImportModal.tsx` | More, share-target query |
| Profiles | Drawer | `src/components/profiles/ProfilesDrawer.tsx` | Header avatar, More; **list / add-edit form / cooking-for** |
| Mode | Dialog | `src/components/profiles/ModeChooser.tsx` | Header, More |
| Calendar | Drawer | `src/components/profiles/CalendarDrawer.tsx` | More; month grid + **selected day** detail |
| Pantry & budget | Drawer | `src/components/profiles/PantryDrawer.tsx` | More; embeds `BudgetPanel.tsx` |
| About & data | Modal | `src/components/app/AboutModal.tsx` | More, `?restore=1`; export/import/merge/wipe/guest PIN/stats |
| Appearance | Dialog (portal) | `src/components/app/Appearance.tsx` (`AppearanceButton`) | Header palette |
| What’s new | Dialog | `src/components/app/WhatsNewSheet.tsx` | Auto after version bump |
| Name / rename | Dialog | `src/components/app/NameGate.tsx` | More “Change book name” (`dismissible`; steps welcome/name/profile/mode when not dismissible) |
| First-run onboarding | Dialog | `src/components/app/OnboardingFlow.tsx` **or** `DresserOnboarding.tsx` | `needsName` (simple if reduced motion / low CPU unless `cookcap-force-dresser=1`) |
| Log meal | Dialog | `src/components/profiles/LogMealDialog.tsx` | Recipe leaf, Cooking mode done flow |
| Cooking mode | Fullscreen dialog (portal) | `src/components/book/CookingMode.tsx` | Recipe leaf “Cook along” |
| Go to page | Popover dialog | `Shell.tsx` `BottomBar` | Footer page count |
| More menu | Dropdown menu | `Shell.tsx` `TopBar` | Header ⋯ |
| Chapter tabs (phone) | Side sheet dialog | `BookmarkRail.tsx` | Footer Tabs / event |
| Favorites: edit import | In-drawer panel | `FavoritesDrawer.tsx` `CustomEditor` | Imported recipe edit |
| Recipe: fork copy | In-leaf inline form | `RecipeLeaf.tsx` `editOpen` | “Your kitchen copy” |
| Wipe confirm | In-modal step | `AboutModal.tsx` `confirmWipe` | About |
| Guest PIN entry | In-modal | `AboutModal.tsx` + `GuestMode.tsx` | About; banner exit in `Shell.tsx` |

**Shared primitive (unused in app tree):** `Sheet` in `src/components/kit/index.tsx`.

---

## Onboarding & first-run

- [ ] **Gate condition** — `needsName` from `AppStore` / `resolveEdition` (`Shell.tsx` disables chrome until resolved)
- [ ] **Paths**
  - [ ] **Dresser** (3D) — `DresserOnboarding.tsx`; steps `welcome` → `name` → `profile` → `mode` → `reveal`; physical drawers `name|profile|mode|reveal`
  - [ ] **Simple** — `OnboardingFlow.tsx`; same step IDs via `useOnboardingSteps.ts`
- [ ] **Quick modes in onboard** — reader, plate, mother (`useOnboardingSteps.ts`)
- [ ] **Setup later** — unnamed edition, mode `reader`
- [ ] **Rename** — `NameGate` with `dismissible` (skips welcome when renaming)

---

## Search (`SearchOverlay.tsx`)

- [ ] Query + debounce; smart parse (`lib/assistant/smart-query.ts`)
- [ ] Chips: easy, ≤30 min, star ratings
- [ ] Empty state suggestions; jump to chapter (e.g. Pakistani)
- [ ] Result row → `goToRecipe`; optional handoff to shop/plan props from `Shell`

---

## Profiles drawer sub-screens (`ProfilesDrawer.tsx`)

- [ ] Profile list + active selector
- [ ] Add / edit profile form (goals, body stats, allergens, spice, manual vs auto targets)
- [ ] **Cooking for** multi-select (mother mode; also referenced in More menu copy)
- [ ] Delete profile

---

## Favorites drawer sub-screens (`FavoritesDrawer.tsx`)

- [ ] Favorites group
- [ ] Collections (create, add recipe, delete)
- [ ] Recently viewed
- [ ] Imported recipes (edit via `CustomEditor`, delete)
- [ ] Back-stack: edit / add-to-collection closes before drawer

---

## Meal planner sub-screens (`MealPlannerDrawer.tsx`)

- [ ] Week grid Mon–Sun assign/clear
- [ ] Occasion **templates** apply week
- [ ] Generate shopping (with sides toggle)
- [ ] **Pick for {day}** searchable recipe picker (nested; Escape/back closes picker first)

---

## Calendar drawer (`CalendarDrawer.tsx`)

- [ ] Month navigation
- [ ] Day cells: planned meal vs logged meals; streak
- [ ] **Selected day** panel: diary entries, remove log, open recipe

---

## Pantry drawer (`PantryDrawer.tsx`)

- [ ] Add/remove pantry items
- [ ] **Cook now** suggestions from pantry + mode ranking
- [ ] **Budget panel** — `src/components/profiles/BudgetPanel.tsx` (weekly cap vs shopping estimate)

---

## About & data (`AboutModal.tsx`)

- [ ] Version, catalog count, privacy link
- [ ] Local stats
- [ ] Export JSON backup
- [ ] Import backup (replace vs **merge** toggle)
- [ ] Clear all data (two-step confirm)
- [ ] Guest PIN set/clear/enter/exit
- [ ] SW cache label (`SW_CACHE`)

---

## Appearance dialog sections (`Appearance.tsx`)

- [ ] Theme skins: editorial, candlelit, lightbook, modern
- [ ] Chapter tabs: paper (only option in picker; legacy values in storage)
- [ ] Reading: flip vs fast
- [ ] Labels: English vs Roman Urdu (chrome strings stub)

---

## Guest mode (`GuestMode.tsx`)

- [ ] Read-only edits when active; banner in `Shell.tsx`
- [ ] PIN lifecycle in About (not strong security)

---

## PWA / system surfaces

- [ ] **Service worker** — `src/components/app/ServiceWorker.tsx`, `public/sw.js`
- [ ] **Chunk recovery** — `src/components/app/ChunkRecovery.tsx`
- [ ] **Manifest** — referenced from `layout.tsx` metadata

---

## Audit notes

- [ ] No tab bar or multi-route SPA; all product UI lives on `/` inside `Shell` except static HTML and Next error/404 pages.
- [ ] E2E matrix treats route **`home`** as `/?demo=1` only (`e2e/finish-matrix.spec.ts`).
- [ ] Imported/custom recipes extend leaf list via `AppStore` → `buildLeaves(customs, includeForYou)`.
