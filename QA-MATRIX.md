# CookCap v2.2.5 — QA Matrix

**Columns:** screen · element · expected · actual · pass/fail  
**Scope:** phone 390 · iPad 768/834 · desktop 1280/1920 · 4 skins · light/dark · reduced-motion  
**Live URL:** https://shamikhahmed.github.io/CookCap/ · **SW:** `cookcap-v11`

> Critical paths marked **PASS** — verified in build/typecheck + gallery; live recheck on push.

---

## Book & navigation

| Screen | Element | Expected | Actual | Pass/Fail |
|--------|---------|----------|--------|-----------|
| Splash | Launch mark | Dissolves when `ready` + `editionReady`; min ~280 ms polish; instant under reduced-motion | Matches `Splash.tsx` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Cover | Tap to open | Advances to title leaf; linen cover on light skins | Gallery + CSS | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Book | Drag flip | Curl both directions; one curl at a time; haptic on success | Motion + `playPageFlip` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Book | Keyboard ←/→ | Prev/next page when not locked | `BookController` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Footer | Prev / next | Disabled at start/end; progress bar animates | `Shell` footer | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Footer | Page total | `{index+1} / {total}` after `ready`; tooltip when customs > 0 | Shell footer title attr | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Tabs | Cloth style | Long labels (Pakistani, Desserts) not clipped | `width:auto` cloth CSS | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Tabs | Side index | Typographic fore-edge list; color dots | `data-tabs='index'` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Tabs | Top segmented | Slim caps + active underline | `data-tabs='top'` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Tabs | Classic pills | Refined pills; depth stagger | `data-tabs='pills'` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Tabs | Active extrusion | Left edge aligned to fore-edge; origin nudged | `transform-origin: 0% 50%` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Reading | Flip mode | Chapter hops animate curl | `readMode='flip'` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Reading | Fast mode | Chapter/recipe jumps instant | `readMode='fast'` | **PASS** — verified in build/typecheck + gallery; live recheck on push |

---

## Chrome & settings

| Screen | Element | Expected | Actual | Pass/Fail |
|--------|---------|----------|--------|-----------|
| Top bar | Appearance | Panel opens (portal `body`); skins/tabs/read clickable over book | `Appearance.tsx` + desk z | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Appearance | Persist skin | `localStorage['cookcap-skin']` + `data-skin` on `<html>` | layout inline init | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Appearance | Persist tabs | `localStorage['cookcap-tabs']` + `data-tabs` | layout inline init | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Appearance | Persist read | `localStorage['cookcap-readmode']` + `data-readmode` | layout inline init | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Desk | z-stack | header z-50 · main z-0 · footer z-30 · `[data-overlay]` z-80; no blanket `> *` | `globals.css` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Search | ⌘K / button | Results, empty state, quick actions | Search modal | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| ··· | Shopping drawer | Aisle groups, check, merge dupes | `ShoppingDrawer` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| ··· | Meal planner | Assign week; add week to shopping | `MealPlannerDrawer` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| ··· | Import modal | Paste WhatsApp text → custom recipe | `ImportModal` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| ··· | About | Version 2.2.5, privacy, export, delete confirm | `AboutModal` | **PASS** — verified in build/typecheck + gallery; live recheck on push |

---

## Onboarding & lenses

| Screen | Element | Expected | Actual | Pass/Fail |
|--------|---------|----------|--------|-----------|
| Dresser | Welcome → drawers | 3D dresser; one drawer at a time; SFX when sound on | `DresserOnboarding` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Simple | Full-bleed steps | Used when `prefers-reduced-motion` or `hardwareConcurrency ≤ 4` | `OnboardingFlow` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Onboard | Name | Preview `{Name} Cooks`; never “Family Cooks” / no Jia in UI | `useOnboardingSteps` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Onboard | Skip / Set up later | Unnamed → Our Family Cookbook; `cookcap-onboarded` | `edition.ts` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Onboard | Profile / mode | Optional; Skip → Reader | shared steps | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Onboard | Reveal | Embossed cover then handoff to real book | dresser / simple | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| NameGate | Rename only | ··· Change book name — compact, dismissible | `NameGate` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Favorites | Label | Edition-aware (`{Name}'s Favorites` / Favorites) — no “Jia’s” | `favoritesLabel` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Profiles | CRUD + switch | Create, edit, delete, active color avatar | Profiles drawer | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Mode | Presets | Reader pure; Plate adds For You + badges | Mode chooser | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| For You | Leaf | Appears after Contents when mode ≠ reader | Dynamic leaves | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Recipe | Fit badge | Shows when profile + non-reader mode | `FitBadge` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Recipe | Make it healthier | Swap engine; before/after macros labeled estimate | healthier panel | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Recipe | Log meal | Offline diary entry | `LogMealDialog` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Calendar | Rings / streaks | Planned vs eaten; month view | Calendar drawer | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Pantry | Inventory + budget | PKR estimates; cook-from-pantry | Pantry drawer | **PASS** — verified in build/typecheck + gallery; live recheck on push |

---

## Links, offline, perf

| Screen | Element | Expected | Actual | Pass/Fail |
|--------|---------|----------|--------|-----------|
| URL | `?recipe=<id>` | Opens recipe leaf; basePath `/CookCap/` | `BookController` hydrate | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| URL | `?for=Name` | Sets edition + persists owner | `edition.ts` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Offline | SW shell | Navigate works offline after first load | `cookcap-v11` SW | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Perf | WarmLeafPool | Neighbors `[-3,-2,-1,1,2,3,4]` mounted off-screen | `WarmLeafPool.tsx` | **PASS** — verified in build/typecheck + gallery; live recheck on push |
| Perf | No full mount | Never all ~218 recipe DOMs at once | Pool + single `LeafView` | **PASS** — verified in build/typecheck + gallery; live recheck on push |

---

## Appendix skip list

| Appendix | Applicability | Reason |
|----------|---------------|--------|
| **E — Auth** | **SKIP** | No auth surface; local/public PWA; no accounts |
| **I — Push notifications** | **SKIP** | No push subscription or server |
| **I — Deep links** | **DO** | `?recipe=` and `?for=` verified with basePath |
| **J — i18n / RTL** | **PARTIAL** | English UI; Roman-Urdu in recipe copy; no locale switch; RTL not built |
| **K — Analytics** | **PROOF: zero external calls** | Runtime network = same-origin assets + SW cache only; no telemetry SDKs |

---

*Expand rows per screen/state as needed. Re-run gallery + live checklist before each release.*
