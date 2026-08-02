# CookCap — The Dresser World (unified scene: table + book + paper-tab notes)

One coherent world. You're hungry → you go to your **dressing table** → open its
drawers (the onboarding questions) → the last drawer holds *your* cookbook → you lift
it out and set it on the **table** → the chapter bookmarks are **paper tabs stuck to
the table** beside the book → you find something to cook. The onboarding dresser and
the reading table are the **same wooden world** — continuous, never two different UIs.

Supersedes the 4 abstract tab styles (owner rejected all). Extends the pending
keyboard fix + Dresser v3 (`docs/cursor-dresser-v3-and-fixes.md`). Guardrails hold.
Verify by DOM geometry + real-device screenshots (pane paints desynced).

## Owner decisions (locked)
- **Phone:** book stays full-bleed + readable; paper-tab notes live in a **pull-tab
  sheet** (restyle the existing tabs sheet as paper tabs). Immersive wooden table on
  tablet/desktop.
- **Wood + skins:** wood is the **world frame around all 4 skins**. The desk/table +
  paper tabs render in warm wood; the **book & pages keep their skin colors**
  (Editorial Cream / Candlelit / Light Book / Modern still work). Wood tone derives
  per-skin from tokens (light oak for light skins, walnut for Candlelit).
- **Bookmarks:** **paper tab bookmarks** adhered to the table edge — thin index tabs,
  one tonal family, printed chapter name. Not sticky notes, not string.

## Build order
**P0 keyboard fix** (from the other brief — do first). Then:

### P1 — Wooden reading world (biggest visible win)
- Replace the flat `--desk` background with a real **wooden table surface**: layered
  warm-wood gradients + fine grain (data-URI noise, low opacity, `background-blend`) +
  subtle plank seams + a soft overhead **lamp pool** + gentle vignette. GPU-cheap,
  reduced-motion safe. Per-skin wood tone via `--dr-wood` tokens (already exist).
- The **book rests ON the table**: grounded contact shadow beneath it; keep the pure-CSS
  `--book-h` grounding. Optional very slight table perspective, but never at the cost of
  page readability — pages stay flat/legible.
- **Paper-tab bookmarks** replace the right rail on desktop/tablet: thin paper index
  tabs adhered to the table beside the book's fore-edge. One tonal family (chapter color
  mixed toward paper ~40%), printed name, a hairline + soft single shadow so each tab
  looks *stuck to the wood* (tiny lift + peel on hover/press). Even edges, aligned to a
  gutter — no jagged overlap. Active tab lifts + brightens. Depth-by-reading-position
  can stay subtle. Targets ≥44px (tablet is touch).
- **Phone:** book full-bleed as today; the footer **Tabs** control opens a **pull-tab
  sheet** styled as paper tabs on a wood strip. No rail on phone.
- Retire `data-tabs` cloth/index/top/pills as the default → the paper-tab-on-wood becomes
  the one nav. (Keep the code path if trivial, but default + only-shipped look = paper tabs.)

### P2 — Onboarding → reading continuity
- The onboarding **dresser is the lower half of the same table**; its wood == the reading
  table wood (same tokens). Welcome sits on the table top.
- Dresser v3 (real 3D pull-out drawers, question carved/recessed inside — see other
  brief) plays out on this wood.
- Reveal: book rises from the last drawer → **the dresser lowers/recedes into the table
  surface** while the book **settles onto the table top** and FLIP-hands-off to the real
  `.book-frame`. Then the **paper tabs fade in, stuck to the table** beside it. One world,
  no cut to a different screen.

### P3 — Polish
- Lamp warmth + faint dust motes (motion only); wood contact shadows; tab peel micro-
  interaction; per-skin wood + tab contrast all AA in light + dark.
- Regenerate gallery: reading table (each skin, desktop + phone), paper tabs, onboarding
  dresser drawers, reveal→table handoff. Update `docs/gallery/README.md`.

## Architecture notes (keep it clean)
- Wood world = a **frame layer** (`.journal-desk`/scene background + `.book-table`
  surface + `.paper-tab` components) driven by `--dr-wood`/skin tokens. Book, pages,
  chrome keep reading from the existing skin `--color-*` tokens — nothing about the
  Appearance system breaks.
- Reader mode stays the pure book on the table (no lens chrome). WarmLeafPool +
  AssetPreloader unchanged; never mount all recipes. No scrollbar chrome. Offline holds.
- a11y: paper tabs are real buttons (role, `aria-current`, keyboard, ≥44px); wood is
  `aria-hidden` decoration; reduced-motion → no 3D/parallax, instant reveal cross-fade.

## Ship
Phase P0→P3 as separate commits. `typecheck`+`lint`+`build` green each. Bump version +
SW, CHANGELOG/HANDOVER/QA-MATRIX/Capricorn together, push `main`. Confirm live on a real
phone + desktop: type a name (no keyboard drop), open a drawer (question inside), reveal
lands the book on the wooden table, paper tabs stuck beside it, all 4 skins hold.
Report per-phase with DOM + real-device evidence.

---

# PART 2 — Reveal→table handoff (frame-by-frame) + anti-2D gate + no-lag + linkage

Perfection is in the numbers and the proof. Build to these; a build that can't prove
real 3D + no-lag by DOM/measurement is NOT done. Easing tokens: `--ease-out-soft
cubic-bezier(.22,1,.36,1)`, `--ease-in-out-soft cubic-bezier(.65,0,.35,1)`.

## A. Reveal → table timeline (t=0 at final mode pick)
| t (ms) | element | keyframe |
|--------|---------|----------|
| 0–140 | reveal drawer | pulls out `translateZ(0→150px)`; warm glow inside `opacity 0→1` |
| 140–1040 | book | rises from the drawer mouth: `translateY 40→-92`, `scale .62→1`, `rotateX 44→6`, `opacity 0→1` |
| 700–1450 | title foil | one `foil-sweep` across `{Name} Cooks`; gold emboss letters stagger 40ms |
| 1040–1740 | book | turns to face: `rotateX 6→0`, `rotateY -10→0`, `translateY -92→-108` |
| 1400 | dresser | begins **receding into the table**: drawers `translateZ→0`; body `translateY 0→60px`, `rotateX 16→22`, `opacity 1→0` (sinks into surface) |
| 1400 | sfx | soft wood stamp (if soundOn) |
| 1740–2360 | book | descends onto the table: `translateY -108→0`, spring `stiffness 90 damping 18` (1.02 bump ~70%); **contact shadow** scales `0.4→1` |
| 2100–2620 | handoff | book == `.book-frame` rect; FLIP crossfade `opacity` 260ms; unmount portal; real cover live |
| 2360–2760 | paper tabs | fade + peel in, **stuck to the table** beside the book, stagger 40ms per tab; tiny "stick" settle |
| 2760 | done | reading world live: book on wood, tabs adhered, dresser gone |

Reduced-motion: skip 3D → 200ms cross-fade from last card to the cover; tabs appear
without peel. No function lost.

## B. ANTI-2D ACCEPTANCE GATE (must pass or the build is rejected)
Prove REAL 3D by DOM, not by eye. Assert live (unit or a puppeteer/manual DOM check):
1. Scene container `getComputedStyle(el).perspective` is a px value **> 0** (not `none`).
2. Dresser body computed `transform` is a **`matrix3d(...)`** with a non-trivial Z /
   rotateX component (NOT a flat `matrix(...)`).
3. An OPEN drawer's computed transform has a **non-zero translateZ** (m43 in matrix3d).
4. Drawer box has real walls: interior element sits **behind** the front panel in Z
   (front `translateZ` > interior).
5. Book-on-table has a **contact-shadow element** rendered under it (non-zero size).
6. Reveal book element has `transform-style: preserve-3d`.
If any assertion fails → it's the flat 2D version again → do not ship; fix.

## C. Images available + preload + behind-the-scenes (NO LAG, NO POP)
- **Availability:** every recipe has hero `.webp` + `@sm.webp` + blur manifest entry on
  disk; a missing/mismatched image falls back to generated art — never a broken image,
  never a wrong-dish photo. Run the image audit; fix gaps before ship.
- **Preload:** `AssetPreloader` warms the current chapter + neighbors' heroes during
  `requestIdleCallback`; `<link rel="preload">` (or `priority`) on the currently-open
  recipe hero. Blur placeholder shows instantly; full image swaps in with no layout shift.
- **Behind-the-scenes leaves:** `WarmLeafPool` keeps ±3 neighbor leaves mounted +
  decoded so a flip never cold-starts React or images. Prefetch next/prev hero before
  the turn. Never mount all ~250 recipes.
- **Proof (measure, don't guess):** flipping to a neighbor shows **no image pop / no
  layout shift**; a `PerformanceObserver('longtask')` records **no >50ms task** during a
  flip or the reveal; steady ~60fps (no dropped frames) on a mid device. Put numbers in
  `PERF.md`.

## D. Everything linked + Settings (front + back)
- **Reachable ≤2 taps, all working:** Search, Appearance, Favorites, Shopping, Meal
  planner, Calendar, Profiles/mode switch, Pantry, Budget, About/export/delete. Click
  every one live; none dead, none double-homed (one feature = one home).
- **Settings home** ordered maturely (identity/most-used top → destructive/legal bottom;
  Appearance · Accessibility · Privacy&Data(export/delete, confirm) · About(version)).
- **Back end (device):** IndexedDB profiles/diary/pantry/shopping/meal-plan migrate
  forward safely (no data loss on version bump); SW cache bumps so installed PWAs update;
  offline works end-to-end (load, read, log) with the network off — prove it.
- **Numbers correct** (Appendix G): every kcal/protein/cost/streak/total computed value
  matches the underlying data exactly; estimates labeled.

## E. Ship
Phase P0(keyboard)→P1(wood table+paper tabs)→P2(dresser continuity+reveal)→P3(polish)
as separate commits; `typecheck`+`lint`+`build` green each. Bump version + SW +
CHANGELOG/HANDOVER/QA-MATRIX/PERF/Capricorn together; push `main`. Regenerate gallery
(reading table per skin desktop+phone, paper tabs, drawers, reveal→table). Final report:
per-phase, with the anti-2D DOM assertions passing, the perf numbers, and real-device
screenshots. It must feel like a world-class team shipped it — a place people want to
come back to.
