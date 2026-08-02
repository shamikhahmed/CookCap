# Cursor — v2.2.7: keyboard fix + Dresser v3 (real 3D, carved wood) + bookmark options

Repo `/Users/shamikhahmed/CookBook Website`. Live v2.2.6 / SW `cookcap-v12`. Ship
**v2.2.7 / cookcap-v13**. Guardrails hold. **Verify by DOM geometry + real-device
screenshots — the preview pane paints desynced.**

---

## 1. P0 — Keyboard dismisses on every keystroke (CONFIRMED bug, fix first)
Typing a letter in the onboarding name input closes the mobile keyboard; user must
re-tap each time.

Root cause: `useDialogA11y` effect deps include `onClose`, and `DresserOnboarding`
passes `() => setupLater()` — a **new function every render**. Each keystroke →
re-render → new fn → effect cleanup+re-run → `requestAnimationFrame(focusFirst)`
focuses the FIRST control (header button, not the input) → input blurs → keyboard
closes.

Fix (do all three):
1. `src/lib/a11y/dialog.ts`: keep `onClose` in a ref; update it in a layout effect;
   drop it from the main effect deps → `[open, panelRef, initial]`. (Protects every
   dialog from this class of bug.)
2. `DresserOnboarding`: pass stable `setupLater` (already `useCallback`) — not
   `() => setupLater()`. Same for any other `useDialogA11y` callers passing inline fns.
3. Name/Profile steps: `initialFocus: 'none'` and let the input's `autoFocus` hold
   focus (don't grab "first"). Verify on a real phone: type a full name without the
   keyboard closing.

---

## 2. Dresser v3 — real 3D pull-out + question carved in wood
Owner: current accordion "isn't real 3D", the question should be "engraved INTO the
drawer", timing is off, and wood/brass/lighting "look cheap". Rebuild the presentation
(keep the step logic + the reveal from 2.2.6).

### 2a. True 3D pull-out (not accordion)
- Scene container: `perspective: 1200px` (900 phone, 1100 tablet).
- Dresser body: `transform-style: preserve-3d; transform: rotateX(16deg)` — camera
  looks slightly DOWN so an open drawer shows its interior.
- Each drawer = a real box: a **front panel** (wood + brass handle) + **left/right/back
  walls** + **floor**, assembled with `translateZ`/`rotateX` faces (preserve-3d).
- Closed: `translateZ(0)`. Open: `translateZ(140px) translateY(10px)` — the drawer
  slides toward the viewer; the top-down tilt reveals the interior floor. One drawer
  open at a time.
- Depth cues: contact shadow under the pulled drawer, ambient occlusion at the cabinet
  mouth (inset shadow), the drawer casts onto the ones below.

### 2b. Question engraved in the wood
- The question heading is **carved into the interior floor**: dark-on-wood text with a
  letterpress emboss — `color: color-mix(--dr-wood, #000 45%)`,
  `text-shadow: 0 1px 0 color-mix(#fff 40% / transparent), 0 -1px 1px rgba(0,0,0,.35) inset-feel`.
  It sits on the (tilted) floor; keep it readable by placing content on a subtly
  counter-rotated plane (`rotateX(-16deg)`) so it faces the reader while resting in the
  drawer — engraved look, still legible.
- The **input** = a recessed slot in the wood: inset shadow, thin brass rim, cream
  writing surface (a little paper label set into the drawer). Big tap target (≥44px).
- Profile / mode choices = small **wooden tags / brass-edged cards** resting in the
  drawer, not flat web buttons.
- Ink/paper contrast on the label must pass AA in every skin.

### 2c. Premium materials
- Wood: 3–4 layered gradients + fine grain (data-URI noise, low opacity, blended) +
  darker edges/bevels; per-skin tone (oak/walnut/ash from tokens, already present).
- Brass handles: gradient + specular highlight + soft drop shadow (not a flat pill).
- Lamp: warm radial pool from top, gentle vignette, a faint dust-mote drift (motion
  only). Grounded contact shadow so the dresser sits on the desk.

### 2d. Timing (tune, don't leave default)
- Drawer open **520ms** `--ease-out-soft`; interior content settle **260ms** delay
  **180ms**; close **380ms** `--ease-in-out-soft`; **120ms** beat before next opens.
- Reveal = keep the 2.2.6 `db-rise/turn/settle` + FLIP (book rises from the open reveal
  drawer → lands on `.book-frame`). Re-time so the book clearly emerges from the drawer
  mouth, not mid-air.
- Reduced-motion: no 3D → the Simple card flow; reveal = 200ms cross-fade.

### 2e. A11y unchanged
Dialog sequence: focus per step (input via autoFocus, not focus-trap grab), `aria-live`
step announce, Back restores answers, targets ≥44px, wood is `aria-hidden` decoration.

---

## 3. Bookmarks — show all options, don't guess
Owner wants to rethink them AND see options first. Do NOT change the default yet.
- Capture all four tab styles (`cloth`, `index`, `top`, `pills`) on a **real device**
  (desktop 1280 + phone 390), light + Editorial and Candlelit skins, into
  `docs/gallery/*/tabs/{style}-{skin}.png`; index them in `docs/gallery/README.md`.
- Report what looks off in the current default (alignment, spacing, jagged edges,
  overlap on the fore-edge seam) with specifics.
- Owner will pick a style or ask for a new concept. Leave a one-paragraph proposal for
  a cleaner "Side Index" default (typographic list, tiny color dot, hairline dividers)
  as the likely best — but wait for the pick.

---

## 4. Ship
`typecheck` + `lint` + `build` green. Commit in groups (`fix: onboarding keyboard`,
`feat: dresser v3`, `chore: gallery tabs`). Bump `VERSION`/`package.json`/`version.ts`
→ 2.2.7, SW → `cookcap-v13`, CHANGELOG/HANDOVER/QA-MATRIX/Capricorn note. Push `main`.
Confirm live: type a full name with no keyboard drop; a drawer physically pulls out and
shows the carved question inside; reveal lands as the cover. Report per-item with DOM /
real-device evidence.
