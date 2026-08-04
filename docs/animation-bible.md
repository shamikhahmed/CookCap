# CookCap — Animation Bible (v3.4)

Every motion, physically modeled. The goal: it should feel like real wood, real
paper, real weight — not CSS sliding. Build to these numbers; tune only against a
live measure. All GPU transforms/opacity only; `will-change` on the animating
element then remove it; **one heavy animation at a time**; 60fps or it's not done.
Every entry has a **reduced-motion** fallback (instant/opacity, no loss of function).
Sound cues gated on `soundOn`, quiet, short.

## Easing vocabulary (tokens — use these, no ad-hoc curves)
```
--e-wood-out:   cubic-bezier(.16,.84,.3,1);     /* drawer glides out, friction settle */
--e-wood-in:    cubic-bezier(.5,0,.75,.2);      /* drawer pushed in, accelerates to thunk */
--e-soft:       cubic-bezier(.22,1,.36,1);      /* general ease-out */
--e-inout:      cubic-bezier(.65,0,.35,1);      /* symmetric */
--spring-land:  spring(stiffness 90, damping 18, mass 1);   /* book settling on table */
--spring-pop:   spring(stiffness 420, damping 16);          /* micro pop (heart/star) */
--e-page:       cubic-bezier(.36,.66,.04,1);    /* page turn, paper snap at end */
```
Durations: micro 140–220ms · UI 240–320ms · drawer 460–560ms · book/reveal 700–1000ms
per beat. Nothing longer than ~1s per beat; whole reveal ≤ ~2.6s, skippable.

---

## 1. DRESSER — idle (before interaction)
Physical: a heavy wooden dresser under a warm lamp; barely alive.
- Lamp pool **breathes**: `opacity .85↔1`, `scale 1↔1.02`, 6s ease-in-out infinite.
- **Dust motes**: 5–7 tiny divs, `translateY(-30px)` + `opacity 0→.4→0` drift, 8–14s,
  random delays; blur(.5px). Motion-only.
- **Mouse parallax**: whole dresser tilts toward cursor ≤ ±4° (`rotateX/rotateY`),
  spring `stiffness 60 damping 14`; returns to 0 on leave. Touch: none.
- Brass handles catch a faint specular shimmer on hover.
Reduced-motion: static lamp, no motes, no tilt.

## 2. DRAWER — OPEN (3D pull-out)
Physical: you pull a drawer; it resists, glides out on runners, decelerates, taps the
stop. Real drawers don't ease symmetrically — quick break-free, long friction glide.
Scene `perspective: 1100–1200px`; dresser `rotateX(16deg)` (camera looks down in).
Drawer = box (front + 2 side walls + back + floor), `preserve-3d`.

Timeline (t=0 on trigger):
| t (ms) | property | from → to | easing |
|--------|----------|-----------|--------|
| 0–60 | drawer | `translateZ 0→18px` (break-free jerk) | --e-soft |
| 60–520 | drawer | `translateZ 18→150px`, `translateY 0→10px` (weight droop) | --e-wood-out |
| 500–560 | drawer | tiny stop bounce `translateZ 150→146→150` | --e-inout |
| 120–520 | mouth AO | inset shadow at cabinet opening `0→.4` (drawer leaves shadow behind) | --e-soft |
| 140–560 | contact shadow | under drawer front `0→1` scale/opacity | --e-soft |
| 90–560 | side walls | become visible as it clears (they were inside) | — |
Sound: low wood **slide** (whoosh) 0–500ms, soft **thunk** at ~530ms.
Only one drawer open; opening a new one **closes** the current first (§3) then opens.

## 3. DRAWER — CLOSE (push in)
Physical: shove closes faster than a pull; ends in a firm thunk; contents jiggle.
| t (ms) | property | from → to | easing |
|--------|----------|-----------|--------|
| 0–300 | drawer | `translateZ 150→0`, `translateY 10→0` | --e-wood-in |
| 300–340 | drawer | thunk recoil `translateZ 0→6→0` | --e-inout |
| 300–420 | contents | jiggle `translateY 0→2→0`, `rotate .3° → 0` | --spring-pop |
| 0–260 | contact shadow / mouth AO | fade to 0 | --e-soft |
Sound: quick **slide-in** + firm **thunk** at 300ms.

## 4. DRAWER INSIDES (contents settle + depth parallax)
Physical: as the drawer opens, what's inside comes into view and settles; near items
move more than far items (parallax on the tilted floor).
- Interior (velvet/paper label with the question) starts hidden (below the front lip);
  as drawer passes ~40% open: content `opacity 0→1`, `translateY 12→0`, `scale .98→1`,
  delay 180ms, 260ms `--e-soft`.
- **Depth parallax**: front-most item translateZ +8 vs back item +2 → they separate as
  the drawer moves (sell 3D). Question carved into floor gets a **letterpress** look:
  ink text + `text-shadow: 0 1px 0 rgba(255,255,255,.35)` (raised-cut).
- The recessed input = a paper label set into wood: inner shadow, brass rim; focus =
  the paper brightens + rim glows (no layout shift, keyboard-safe).
Reduced-motion: content fades in, no parallax.

## 5. BOOK — COMING OUT of the last drawer (reveal)
Physical: the bottom drawer opens, light spills, the book **lifts with weight**
(slow to break inertia, eases as it clears), rotates to face you, then **descends
under gravity** and settles with a damped bounce onto the table.
Element `.dresser-book` fixed, `preserve-3d`, transform-origin center.
| t (ms) | phase | transform | easing |
|--------|-------|-----------|--------|
| 0–140 | drawer opens | `translateZ 0→150`, inner glow `0→1` | --e-wood-out |
| 140–520 | break inertia | `translateY 40→10`, `scale .62→.7`, `rotateX 44→30`, `opacity 0→1` (slow, heavy) | --e-inout |
| 520–1040 | clear + lift | `translateY 10→-92`, `scale .7→1`, `rotateX 30→6` | --e-wood-out |
| 700–1450 | foil | light **sweep** across `{Name} Cooks`; gold letters emboss stagger 40ms | linear |
| 1040–1740 | turn to face | `rotateX 6→0`, `rotateY -10→0`, `translateY -92→-108` | --e-soft |
| 1400 | dresser recedes | drawers `translateZ→0`; body `translateY 0→60`, `rotateX 16→22`, `opacity 1→0` (sinks into table) | --e-soft |
| 1740–2360 | gravity settle | `translateY -108→0`, **--spring-land** (1.02 overshoot ~70%); contact shadow `0.4→1` | spring |
| 2100–2620 | handoff | book == real `.book-frame` rect; FLIP crossfade `opacity` 260ms; unmount portal | --e-soft |
| 2360–2760 | tabs stick | paper tabs fade + **peel-in** beside the book, 40ms stagger | --e-soft |
Sound: drawer thunk (140), soft **stamp** (1400), paper **settle** (2360).
Reduced-motion: skip 3D → 200ms cross-fade last card → cover; tabs appear, no peel.

## 6. BOOK — OPENING (cover → first spread)
Physical: the front cover swings open on the spine hinge; a shadow sweeps under the
lifting cover; the first page is revealed; a faint page-fan on the right edge.
- Cover = a face pivoting on the LEFT (spine): `transform-origin: left center`,
  `rotateY 0 → -160°` over 620ms `--e-page` (paper snap at end). Backface hidden; a
  paper "inside cover" shows past -90°.
- **Cast shadow**: a soft gradient under the swinging cover, its opacity peaks at -90°
  then fades (the cover shadows the page as it passes overhead).
- **Page fan**: the right-edge page stack riffles — 3–4 thin sheets each `rotateY`
  small staggered (20ms) as the cover opens, settling flat.
- Spine gutter shadow deepens as the book opens (inner margin darkens).
Trigger: tap the cover / "open" — then it's the first content leaf.
Reduced-motion: cross-fade cover → first spread, 200ms.

## 7. PAGE — FLIP (the core reading interaction)
Physical: paper doesn't rotate rigidly — it **bends**. Sell the bend with shading +
a curl highlight + a visible paper-thickness edge; track the finger 1:1; release by
velocity + distance; settle with a paper snap.
- Sheet pivots on the spine edge, `rotateY` driven by drag (0 → ±168°), NOT to 180 (keep
  a sliver of thickness). Grab anywhere; `touch-action: pan-y` so vertical scroll lives.
- **Bend fake**: overlay a moving linear-gradient on the turning sheet whose position
  follows the angle → looks like the page curving, not a flat plane. Add `scaleX .985`
  mid-turn (squash) for bend.
- **Fold shadow** on the page being revealed: strongest mid-turn (`opacity 0→.3→.05`).
- **Sheet self-shade**: darkens as it faces away (`opacity 0→.42→.62` at -90→-168).
- **Curl highlight**: bright band rides the leading edge (`opacity 0→.55→0`).
- **Thickness edge**: a 2–7px dark strip on the lifting edge, widening mid-turn — the
  paper's cut edge; the cue that makes it read as a real leaf.
- **Release**: flick (`|v|>.35 px/ms`) OR past 55% → complete; else spring back.
  Momentum-biased spring (`velocity * 120`). Paper **snap** sound at settle.
- **No flip-storm**: one sheet at a time; lock during animation. Chapter hops curl 1–2
  pages then land (`animateJump`), never animate all leaves.
Reduced-motion: instant page swap, no curl.

## 8. TABS — peel / stick / select
- **Stick-in** (after reveal): each paper tab `rotateX 40→0` (flops down onto wood),
  `opacity 0→1`, hairline shadow grows; 40ms stagger; tiny "tick" at end.
- **Hover/press**: lift `translateY -2px` + `rotate .5°` (corner peel), shadow softens.
- **Select**: tab peels up briefly, book does a 1–2 page **curl toward** that chapter
  (§7 hop), active tab brightens + stays lifted. Others settle.
Reduced-motion: opacity only; instant hop.

## 9. MICRO-INTERACTIONS (subtle, tokenized)
- **Favorite heart**: outline → fill, `--spring-pop` (scale 1→1.25→1), a soft radial
  glow pulse; unfav = quick shrink.
- **Rating stars**: fill sweeps left→right, 40ms/star; a tiny bounce on the tapped star.
- **Step check**: circle → ✓ pop (`--spring-pop`), text **strikes** (width-clip 180ms),
  row dims to .5.
- **Add to shopping**: the ingredient row **clones**, flies along a slight arc to the
  cart icon (`translate + scale .4`, 380ms `--e-soft`), fades; cart **count badge**
  bumps (`--spring-pop`).
- **Servings stepper**: number rolls (odometer, 160ms); ingredient quantities re-count
  with a subtle flash.
- **Spice pips / quick-facts**: on first view, count-up / fill stagger 40ms.
- **Buttons**: press = `scale .96` + settle (`--spring-pop`); focus-visible = ring.
Reduced-motion: state changes instantly, no fly/pop.

## 10. SCREEN / SHEET / MODAL transitions
- Drawers (favorites/shopping/meal/calendar/appearance): backdrop `opacity 0→.45` +
  `backdrop-blur 0→2px` 200ms; panel slides from edge (`translateX/Y 100%→0`) or
  bottom-sheet on phone, `--e-soft` 280ms; focus moves in; Escape/back reverses.
- Cook mode: fullscreen scale-fade in (`scale .98→1`, 260ms), screen-wake on.
- Search (⌘K / tap): center dialog `scale .96→1` + fade 200ms; results stagger 24ms.
Reduced-motion: fade only.

## 11. AMBIENT / MATERIAL detail (always on, cheap)
- Lamp pool breathing (§1) on the reading table too, very subtle.
- Book **contact shadow** on the wood; **page-edge shading** on the fore-edge stack;
  spine gutter inner-shadow; fore-edge thickness scales with pages remaining.
- Gold foil title: a slow light sweep every ~8s (or on open), motion-only.

## 12. LOADING / IMAGES
- Hero **blur-up**: 20px blur placeholder → full image cross-fade 300ms on decode; NO
  layout shift (aspect-locked box).
- List **skeleton**: shimmer sweep (`background-position`) 1.2s, only while data pending.
- First paint: book + wood paint immediately; heavy leaves warm behind (WarmLeafPool).

## Global rules
- `prefers-reduced-motion: reduce` → all of the above become instant/opacity; the app
  loses zero function.
- GPU only (transform/opacity); no animating layout props; `will-change` added then
  cleared; `PerformanceObserver('longtask')` shows no >50ms during any of these.
- One easing/duration system (top of file); no stray beziers or magic ms in components.
- Sound: short, warm, gated on `soundOn`; never autoplay on load.

## Acceptance
Record each on a real device: drawer open/close feel, book reveal, cover open, a page
flip, tab stick + select, and 3 micro-interactions. Confirm 60fps (no long frames),
correct reduced-motion, and that no animation blocks reaching the book quickly.

**Proof (3.4.1):** `docs/gallery/recordings/onboard-flip.webm` +
`onboard-flip-metrics.json` — ceremony window after `book-ready`: avg frame **16.66ms
(≈60fps)**, `longTasksOver50: 0`. Regen: `npm run record:onboard-flip` (serve `out` under
`/CookCap`). BrowserStack Live (iPhone 15 Pro / iOS Safari) for tactile real-device check.
