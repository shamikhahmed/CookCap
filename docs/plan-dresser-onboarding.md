# CookCap — The Dresser: 3D onboarding (build spec)

The owner hates the current small-card onboarding. Replace the first-run flow with
a **wooden dresser** ceremony: the welcome sits on top of the dresser; you open a
drawer → answer one question → the drawer closes → the next drawer opens → the last
drawer opens to reveal **your cookbook, embossed with your name**, which rises out,
turns to face you, and settles onto the desk — seamlessly becoming the real book.
Fully 3D, warm, quiet, unforgettable.

Repo `/Users/shamikhahmed/CookBook Website`. Next 15 · React 19 · Tailwind v4 ·
Motion · TS strict. Keep the book metaphor + guardrails. This is first-run ONLY;
the `···` "Rename" stays the compact card.

## PREREQUISITES (from Cursor's plan — must land first)
- **P0b desk z-stack fix** — nothing is clickable until this ships. The dresser is
  a portal at `z-[100]`; the app's `.journal-desk > *` z-index war must be fixed so
  overlays/inputs receive clicks. Do P0b before wiring the dresser.
- **P0 Jia-wipe** — the reveal cover shows `{Name} Cooks` and the app shows the
  owner's name, not "Jia". Wipe user-facing "Jia" (favorites label, `♥ Jia`,
  "A note from Jia", `e.g. Jia` → `e.g. Ayesha`) before the reveal, or the magic
  moment prints the wrong name.

## ONE flow, TWO presentations
Build the **flow logic once**, render it two ways:
- **Dresser** (default, motion on) — the 3D ceremony below.
- **Simple** (reduced-motion, or low-power / `prefers-reduced-motion: reduce`) — the
  clean stacked-card sequence (Cursor's `OnboardingFlow`), each question a calm
  centered step. Same inputs, same handlers, same result. No 3D, no loss of function.

Steps (identical in both): **Welcome → Name → Profile (optional) → Mode → Reveal → App**.
Wiring reuses `sanitizeOwnerName`, `upsertProfile`, mode set; `useDialogA11y` for
focus. Persist exactly as `OnboardingFlow` would. Skippable throughout ("Set up
later" on welcome → book with defaults).

## STORYBOARD (dresser)
0. **The dresser stands on the desk.** Warm wood, brass handles, a small lamp on top
   casting a soft pool. On the dresser top: an engraved plate / framed card —
   `CookCap · a living family cookbook` — one headline, one line, **Begin**. Book not
   visible yet. Editorial-Cream tokens (no purple/AI look). Opaque warm scrim.
1. **Begin** → the **top drawer slides open** toward you (3D pull), a soft wood
   *shhk*. Inside on velvet: a card — **"What should we call this cookbook?"** with a
   live serif preview `{typed} Cooks`. Continue.
2. Answer → drawer **slides shut** (soft thunk) → **next drawer opens**:
   **"Who eats from this book?"** (optional household eater; Skip/Back). Little
   utensil-friend icons on the velvet.
3. Close → **next drawer**: **"How do you like to cook?"** — three folded cards:
   **Reader / My Plate / Mother** (an apron/hat motif). Skip = Reader.
4. Close → a beat → the **bottom (largest) drawer opens slowly**, light spilling out,
   and **THE COOKBOOK rises** from it: cover embossed `{Name} Cooks`, gold foil
   catching a shimmer sweep. It floats up, **rotates to face you**, the dresser dims
   and recedes, and the book **descends onto the desk** — crossfading/FLIP-morphing
   into the real `.book-frame` cover. Onboarding unmounts; you're in the app, book
   already yours. Optional soft "stamp" + page-settle sound (respect `soundOn`).

## MOTION / 3D APPROACH (CSS transforms, no WebGL needed)
- Scene: a `perspective: 1400px` container; dresser + drawers use
  `transform-style: preserve-3d`.
- Drawer open = `translateZ`/`translateY` toward camera + a slight `rotateX` as the
  front tilts; inner shadow deepens; velvet + question card fade/scale in. Close =
  reverse. **One drawer animates at a time** (state machine gates it).
- Wood = layered gradients + low-opacity grain (data-URI noise), `background-blend`;
  brass handles = small gradient pills with a highlight. Lamp = radial warm glow +
  vignette. Dust motes (a few GPU-cheap divs) only when motion is on.
- Reveal = the book element shares geometry with the app cover so a Motion `layout`/
  FLIP crossfade hands off with no jump. Gold shimmer = a moving linear-gradient
  mask over the embossed title (the existing `foil-sweep`).
- One easing family (`--ease-out-soft`); durations from tokens; nothing bouncy.
- **Reduced-motion:** skip the dresser entirely → Simple presentation; the reveal is
  a gentle cross-fade to the cover. No 3D, no motion dependency.

## ACCESSIBILITY (non-negotiable)
- It's a **dialog sequence**, not just decoration. Each step: role=dialog, labelled by
  the question, focus moved to the question/input, `aria-live` announces the step,
  progress announced ("Step 2 of 4"). The dresser/drawer visuals are `aria-hidden`.
- Back reopens the previous drawer (and restores its answer — never lose input).
- Keyboard: Enter advances, Shift+Tab/Back to previous, Escape offers "Set up later".
- Targets ≥44px; visible focus rings; contrast AA on the velvet cards (dark ink on
  light card, not text on busy wood).

## PERFORMANCE
- The book must still be reachable fast: **Begin → Reveal in a few taps**, each drawer
  transition ≤ ~500ms, whole ceremony skippable. Preload only the cover art. GPU
  transforms only; no layout thrash; no long blocking. Measure the ms and report.

## HANDOFF TO THE APP
- On reveal-complete, set edition name (→ `{Name} Cooks`), any profile/mode, mark
  onboarding done (localStorage flag), unmount the portal, and let the real Shell/book
  paint. The floating cookbook's final transform should match the app cover's box so
  the transition is invisible. Never show the dresser again for returning users.

## FILE MAP
- `src/components/app/DresserOnboarding.tsx` — NEW (portal, 3D scene, state machine).
- `src/components/app/OnboardingFlow.tsx` — the Simple presentation + shared step
  logic/hooks (name/profile/mode); Dresser imports the same hooks.
- `src/components/book/Shell.tsx` — first-run: `prefers-reduced-motion` → OnboardingFlow,
  else DresserOnboarding; `···` Rename → compact NameGate (unchanged).
- `src/app/globals.css` — dresser/wood/brass/lamp classes + `foil-sweep` reuse; all
  tokened, Editorial-Cream defaults.

## MORE IDEAS (optional, pick what earns delight)
- **Lamp pull-chain** on the dresser top toggles a light/dark preview of the coming book.
- Each drawer **themed to its question** (nameplate/label-maker for Name; tiny
  utensil-friends for Profile; folded aprons for Mode) — same cast as the Kitchen Friends.
- **Progress = the drawers** (which one is open) + tiny dots; no separate bar.
- Gold **name-emboss** animates letter-by-letter as it's revealed.
- **Reuse the dresser as the Settings metaphor** later: open a drawer = a settings
  group (Identity / Appearance / Privacy). One asset, two uses — cohesive.
- Micro-sound design (drawer slide, soft thunk, stamp, page-settle) gated on `soundOn`.
- A quiet "**Set up later**" everywhere so no one is trapped in the ceremony.
- Returning-user Easter egg: opening `···` → "Rename" briefly shows the top drawer
  sliding, not the full dresser — a callback, cheap.

## GUARDRAILS
Never "Family Cooks". First-run only. Skippable. Reduced-motion parity with no lost
function. a11y AA. Offline. Book reachable fast. Reuse Editorial-Cream tokens (no AI
purple). After build: `typecheck`+`lint`+`build` green; QA desktop 1280 + phone 390 +
reduced-motion; regenerate gallery (`00-welcome` → dresser stills + reveal); bump
`APP_VERSION`/SW/CHANGELOG/HANDOVER/README together; commit + push; update Capricorn
note `~/Capricorn-Brain/01 Projects/Jia-Cooks.md`.

---

# PART 2 — Frame-by-frame timings, per-device / per-skin values, QA matrix

Perfection is in the numbers. Build to these; tune only if a live measure says so.
All easing from tokens: `--ease-out-soft: cubic-bezier(.22,1,.36,1)`,
`--ease-in-out-soft: cubic-bezier(.65,0,.35,1)`. Springs where noted. One drawer
animates at a time; the state machine forbids overlap.

## Motion constants (tokens)
```
--dr-open: 480ms      --dr-close: 380ms     --card-in: 260ms   --card-out: 160ms
--reveal-rise: 900ms  --reveal-turn: 700ms  --reveal-settle: 600ms
--dresser-recede: 700ms   --handoff-fade: 260ms
scene perspective: desktop 1400px · iPad 1200px · phone 900px
```

## Drawer question cycle (repeat for Name, Profile, Mode)
| t (ms) | Element | From → To | Easing |
|--------|---------|-----------|--------|
| 0–480 | drawer box | `translateZ(0)` → `translateZ(Zopen)`, `translateY 0→6px`, inner shadow 0→.28 | out-soft |
| 0–480 | brass handle | highlight sweep (bg-position) | out-soft |
| 240–500 | question card | `opacity 0→1`, `translateY 10→0`, `scale .98→1` | out-soft |
| — | (user answers / Back) | — | — |
| 0–160 | question card | `opacity 1→0`, `translateY 0→8` | in-out-soft |
| 120–500 | drawer box | `translateZ(Zopen)` → `0`, shadow → 0; *thunk* at 500 (if soundOn) | in-out-soft |
`Zopen` = desktop 150px · iPad 120px · phone 90px. Next drawer's open starts at
close-end + 80ms beat.

## Reveal timeline (final drawer → app), t=0 at last answer
| t (ms) | Element | Keyframe |
|--------|---------|----------|
| 0–480 | bottom drawer | opens `translateZ(Zopen+20)`; warm glow div `opacity 0→1` |
| 300–1200 | cookbook | rise: `translateY +40→-120`, `scale .70→1`, `rotateX 30→0`, `opacity 0→1` (out-soft) |
| 700–1400 | title foil | `foil-sweep` shimmer once across `{Name} Cooks` |
| 1000–1700 | cookbook | `rotateY -8→0` face-to-camera; dresser `scale 1→.96`, `translateY 0→20`, `opacity 1→0`; scrim warms |
| 1500–2200 | cookbook | descend to app-cover box; land with spring `stiffness 90 damping 18` (tiny overshoot) |
| 2100–2360 | handoff | onboarding book geometry == `.book-frame`; crossfade `--handoff-fade`; unmount portal; app cover live; optional page-settle sound |
Total ≈ **2.36s**, skippable at any time. Book cover ends exactly where the real
`.book-frame` sits (measure it; match `left/top/width/height`) so there is no jump.

## Reduced-motion / low-power fallback
No dresser, no 3D. Render the Simple card sequence; the reveal is a single
`opacity`/`scale .98→1` cross-fade (200ms) from the last card to the app cover.
Every question still reachable; no function lost. Trigger on
`prefers-reduced-motion: reduce` OR `navigator.hardwareConcurrency <= 4` (optional).

## Per-skin dresser wood (derive from tokens, don't hardcode)
| Skin | Wood | Velvet card | Lamp glow |
|------|------|-------------|-----------|
| Editorial Cream | light oak = `color-mix(--color-paper 70%, #b08a5a)` | `--color-paper-raised` | `--color-accent` @ 22% |
| Candlelit | walnut = `color-mix(--color-leather 70%, #2a1810)` | `--color-paper-raised` | `--color-gold` @ 28% |
| Light Book | warm oak = `color-mix(--color-paper 65%, #a9793f)` | `--color-paper-raised` | `--color-accent` @ 24% |
| Modern | pale ash = `color-mix(--color-paper 80%, #b9a98f)` | `#fff` | `--color-accent` @ 16% |
Card ink = `--color-ink` (AA on the card, never text on busy wood). Verify contrast
in every skin + light/dark.

## Per-device layout
- **Phone 390** — dresser full-bleed; drawers span width; perspective 900; `Zopen 90`;
  rise `translateY -80`; safe-area top+bottom insets; one-thumb Continue at bottom.
- **iPad 768 / 834** — centered `max-w-[640px]`; perspective 1200; portrait = taller
  dresser (4 drawers stacked), landscape = shorter + wider drawers; verify both.
- **Desktop 1280 / 1440** — centered `max-w-[560px]`; perspective 1400; larger lamp pool.
- **Ultrawide ≥1920** — cap scene 1400px, center; desk fills, dresser doesn't stretch.

## EXHAUSTIVE QA MATRIX (fill QA-MATRIX.md; verify LIVE by DOM + screenshot)
Run the FULL onboarding + first book paint for every cell:
- Devices: **390, 834 (portrait+landscape), 1280, 1920**.
- Skins: **editorial, candlelit, lightbook, modern**.
- Theme: **light + dark** (candlelit/modern have dark; editorial/lightbook light-only — confirm toggle sane).
- Motion: **full + reduced**.
Per cell assert: welcome legible + Begin works; each drawer opens/closes once, no
overlap, card centered, input above keyboard (phone), Back restores answer; name
preview `{typed} Cooks` correct; reveal book shows the **right name**, no "Jia", no
"Family Cooks"; book lands exactly on `.book-frame` (no jump); ≥44px targets; focus
ring visible; `aria-live` announces steps; ≤2.4s ceremony; 60fps (no long frames);
offline works; returning user never sees the dresser.
Also click-test after handoff: Appearance/Search/Mode/drawers/every chapter tab
respond (proves P0b). One row per cell + per element; every fail fixed + re-verified.

## SHIP
`typecheck`+`lint`+`build` green; bump `APP_VERSION` (2.2.5→ set to the onboarding
release), SW cache, CHANGELOG/README/HANDOVER/VERSION/package.json together;
regenerate gallery (dresser stills per skin: welcome, each drawer, reveal, plus the
reduced-motion cards); commit in groups; push `main` (GH Pages). Confirm the deployed
`sw.js` cache constant actually bumped (installed PWAs must update — the v10/v-mismatch
trap seen before). Capricorn note + `~/.cursor/plans/…` updated.
