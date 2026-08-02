# CookCap — Reveal keyframes + cross-device safe-area chrome (build spec)

Two jobs. PART A = the dresser book-reveal, frame-by-frame, matching the rebuilt
accordion dresser (question lives INSIDE the drawer; wood front + handle below;
velvet interior). PART B = header/footer done right on phone / Dynamic-Island
iPhones / iPad / desktop / landscape / foldables. Hand to Cursor; keep guardrails.

---

# PART A — Book reveal (drawer → book rises → lands as the cover)

The last (deep) drawer opens; the cookbook rises **out of that drawer's interior**,
turns to face the reader, then descends and lands exactly on the real app cover box
(`.book-frame`), crossfading with no jump. Total ≈ **2.36s**, skippable.

## Element origin (important)
`.dresser-book` must start **at the open reveal-drawer's interior**, not floating
mid-screen. On reveal start, measure the reveal drawer interior rect and the target
`.book-frame` rect; drive the book with those as CSS custom props so it reads as
lifting from the drawer and settling into the app:
```
--book-from-x, --book-from-y   // center of reveal drawer interior
--book-to-x,   --book-to-y      // center of app cover (.book-frame)
--book-to-w,   --book-to-h      // app cover size
```
Position `.dresser-book` fixed, transform-origin center; animate transforms only
(GPU). If measuring is skipped, the fallbacks below still read well.

## Timeline (t=0 at final answer / mode pick)
| t (ms) | phase | `.dresser-book` transform / state | easing |
|--------|-------|-----------------------------------|--------|
| 0–140 | drawer | reveal drawer finishes opening; warm glow `opacity 0→1` inside it; book hidden | out-soft |
| 140–1040 | **rise** | from lying in drawer → up: `translateY: 30px→-90px`, `scale .62→1`, `rotateX 42deg→6deg`, `opacity 0→1` | out-soft |
| 700–1450 | foil | one `foil-sweep` shimmer across `{Name} Cooks` | linear |
| 1040–1740 | **turn** | face the reader: `rotateX 6→0`, `rotateY -10→0`, `translateY -90→-108` | out-soft |
| 1400 | sfx | soft stamp (if soundOn); dresser begins recede | — |
| 1400–2100 | recede | dresser `.dresser-body`: `translateY 0→22px, scale 1→.955, opacity 1→0` | out-soft |
| 1740–2300 | **settle** | descend + land on cover box: `translateY -108→0`, spring overshoot `stiffness 90 damping 18` (tiny 1.02 bump at ~70%) | spring |
| 2100–2360 | **handoff** | book == `.book-frame` geometry; crossfade `opacity` 260ms; unmount portal; real cover live | ease |

## Exact @keyframes (drop-in; replaces the current dresser-book-* rules)
```css
.dresser-book {
  position: fixed;
  left: 50%; top: 50%;
  width: clamp(190px, 34vw, 300px);
  aspect-ratio: 5 / 7;
  transform: translate(-50%, -50%);
  transform-origin: center;
  transform-style: preserve-3d;
  z-index: 40;
  will-change: transform, opacity;
}
.dresser-book--rise   { animation: db-rise   900ms var(--ease-out-soft) both; }
.dresser-book--turn   { animation: db-turn   700ms var(--ease-out-soft) both; }
.dresser-book--settle,
.dresser-book--done   { animation: db-settle 620ms cubic-bezier(.34,1.3,.64,1) both; }

@keyframes db-rise {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 30px)) scale(.62) rotateX(42deg); }
  to   { opacity: 1; transform: translate(-50%, calc(-50% - 90px)) scale(1)   rotateX(6deg);  }
}
@keyframes db-turn {
  from { transform: translate(-50%, calc(-50% - 90px))  rotateX(6deg) rotateY(-10deg); }
  to   { transform: translate(-50%, calc(-50% - 108px)) rotateX(0)    rotateY(0);      }
}
@keyframes db-settle {
  0%   { transform: translate(-50%, calc(-50% - 108px)) scale(1); }
  70%  { transform: translate(-50%, calc(-50% + 6px))   scale(1.02); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .dresser-book--rise, .dresser-book--turn,
  .dresser-book--settle, .dresser-book--done {
    animation: none; opacity: 1; transform: translate(-50%, -50%);
  }
}
```
Component timings already match (rise→turn at 700, settle+stamp at 1400, done at
2360); keep them. On `done`, set the edition name and unmount so the real
`.book-frame` cover is what remains — ideally FLIP/crossfade the two so the swap is
invisible (match rect + 260ms opacity).

## Polish
- The rising book's cover = same art as the app cover (linen on light skins, leather
  on dark) so the handoff matches the active skin.
- Gold name emboss can reveal letter-by-letter during `rise` (stagger 40ms).
- Keep ONE curl/animation at a time; no other page motion during the reveal.

---

# PART B — Header / footer chrome across every device

Root cause of most "ugly chrome": missing `viewport-fit=cover`, using `vh` not
`dvh`, and no `env(safe-area-inset-*)`. Fix once, correctly, with tokens.

## 1. Enable safe-area insets (required — else env() is 0)
`src/app/layout.tsx` viewport:
```ts
export const viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [ /* light+dark */ ],
};
```
(Next.js: put `viewportFit: 'cover'` in the `viewport` export, not a raw meta.)

## 2. Chrome tokens (globals.css)
```css
:root {
  --safe-t: env(safe-area-inset-top, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
  --header-h: 3.25rem;   /* content height, excl. safe inset */
  --footer-h: 3rem;
}
```

## 3. Header (fixed/top bar)
```css
.app-header {
  padding-top: max(0.5rem, var(--safe-t));
  padding-left: max(0.75rem, var(--safe-l));
  padding-right: max(0.75rem, var(--safe-r));
  min-height: calc(var(--header-h) + var(--safe-t));
}
```
- **Dynamic Island / notch:** `--safe-t` already reserves the space (portrait ≈47–59px).
  No control may sit inside the top inset — the brand + icon buttons live BELOW it.
  In landscape the island moves to a side → `--safe-l/-r` padding keeps buttons clear.
- All header buttons ≥44×44px hit target (visual can be smaller, pad the tap area).

## 4. Footer (bottom bar: prev / progress / next / Tabs on phone)
```css
.app-footer {
  padding-bottom: max(0.5rem, var(--safe-b));
  padding-left: max(0.75rem, var(--safe-l));
  padding-right: max(0.75rem, var(--safe-r));
  min-height: calc(var(--footer-h) + var(--safe-b));
}
```
- **Home indicator** (Face-ID iPhones + iPads): `--safe-b` lifts controls above it.
- Phone footer holds the **Tabs** control — ensure it's ≥44px and not overlapped by
  the home indicator or the book.

## 5. Full-height math (no clipped book, no double scrollbars)
Use **dvh** and subtract chrome + insets so the book never hides under a bar:
```css
.app-shell { height: 100dvh; display: flex; flex-direction: column; }
:root {
  --chrome-total: calc(var(--header-h) + var(--footer-h) + var(--safe-t) + var(--safe-b));
  --book-h: clamp(320px, calc(100dvh - var(--chrome-total) - 2rem), 860px);
}
```
Width from height (`--book-h * 5/7`) as today. This replaces the current
`calc(100dvh - 7.5rem)` which ignores safe areas.

## 6. Per-device checks (verify LIVE / DOM, not the pane)
- **iPhone SE / mini (no island):** `--safe-t` small; header not too tall; footer clear of indicator.
- **iPhone 14–16 Pro/Max (Dynamic Island):** brand + icons below island portrait; in
  landscape, island on the leading side → `--safe-l` keeps them clear; nothing under the island.
- **iPad Mini / Air / Pro:** no notch, but home indicator on Face-ID models → `--safe-b`.
  Header/footer proportionate (don't look phone-stretched); center the book; portrait + landscape.
- **Desktop / laptop:** insets are 0 → tokens fall back to the `max()` minimums; chrome
  is compact; fat right rail for tabs unaffected.
- **Ultrawide:** cap composition (already 1400px); chrome spans full width but content centered.
- **Landscape phone:** shorter header/footer (`--header-h`/`--footer-h` can shrink at
  `(orientation: landscape) and (max-height: 480px)`); side insets applied.
- **Foldables:** dvh + flex column handles fold/unfold; no fixed vh; re-check at the
  narrow (280px) and unfolded widths.

## 7. Acceptance (prove by DOM geometry — pane is unreliable)
For each device: header content top ≥ `--safe-t`; footer bottom padding ≥ `--safe-b`;
no control intersects the top inset (island) or bottom inset (home bar); book stage
height == `--book-h` and fully visible (top ≥ header bottom, bottom ≤ footer top); all
tap targets ≥44px; no horizontal scroll; light+dark+all skins hold contrast. Update
`QA-MATRIX.md`, regenerate gallery, bump version/SW/CHANGELOG together, commit + push,
confirm deployed `sw.js` cache constant bumped so installed PWAs update.
