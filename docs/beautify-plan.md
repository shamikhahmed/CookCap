# CookCap — Beautification & Appearance System (build spec)

Owner reviewed the current build and it feels "ugly" on mobile + desktop. Root
causes diagnosed below, plus the owner's direction: **make the look customizable**
— keep multiple moods, offer multiple chapter-tab styles, support both a refined
flip-book and fast browsing, and show brand "both cleanly" (CookCap mark + personal
"{Name} Cooks" cover). Implement all of it as a proper **Appearance system**, with
tasteful **defaults** so it looks beautiful before anyone touches a setting.

Hand to Cursor. Keep the guardrails from `MASTER_PROMPT.md`. Verify on desktop
1280, tablet 768, phone 390, light + dark, reduced-motion. Restart dev clean first
(`rm -rf .next && npm run dev`) — the previous local server had wedged (frozen nav);
the deployed site works, so that was a dev-server issue, not a code bug.

---

## A. Diagnosed problems (fix these regardless of theme)
1. **Candy-pill chapter tabs** — over-saturated, glossy, jagged/uneven left edges,
   heavy cartoon shadows. The single biggest eyesore; clashes with the paper mood.
2. **Muddy dark desk** — near-black background + murky leather = gloomy, low
   contrast. Reads unfinished, not "warm heirloom".
3. **Desktop book floats small** in a large empty desk; first impression is weak
   (worse with the onboarding modal over a tiny book).
4. **Identity muddle** — header "CookCap" but cover says "Family Cooks" (owner name
   defaulted to "Family"). Double-branding reads unpolished.
5. **First run** = a form on a dark void. The name gate should sit over a beautiful,
   already-inviting book, or be a warm full-screen welcome.

## B. Appearance system (the core new feature)

Add a single **Appearance** panel (gear/paint icon in the top bar → popover on
desktop, sheet on mobile). Everything persists to `localStorage` (and mirror into
the existing settings store if present). Three independent axes:

### B1. Skin (palette + mood) — `data-skin` on `<html>`
Ship these presets as **CSS token overrides** in `globals.css` (override the
existing `--color-*`, shadows, textures). Default = **Editorial Cream**.

- **Editorial Cream** (default, light) — Kinfolk/Magnolia: warm cream paper
  (`#f6f1e7`), soft ink (`#2c2622`), one restrained terracotta accent, airy
  whitespace, refined serif. This is the "cure for ugly" — make it the default.
- **Candlelit** (dark, refined) — the current cozy idea but fixed: raise contrast,
  warmer (not muddy) leather, softer vignette, gold used sparingly.
- **Light Book** — bright desk, warm paper, friendly; book metaphor intact.
- **Modern** — cleaner, less texture, bigger photography, minimal chrome (still warm).

Each skin = ~15 CSS custom-property overrides under `:root[data-skin="..."]` and a
`prefers-color-scheme` fallback. No component changes needed — tokens flow through.
Keep the existing light/dark toggle working *within* a skin where it makes sense.

### B2. Chapter-tab style — `data-tabs` on the book root
Build all four; owner will compare and keep favorites (all remain selectable):

- **Cloth Tabs** (new default) — muted, desaturated laminated tabs in one tonal
  family (chapter color at ~35–45% mixed toward paper), soft single shadow, clean
  even left edge, subtle fabric texture, tiny embossed label. No gloss, no candy.
- **Side Index** — no pills: a clean typographic list down the fore-edge, tiny
  color dot per chapter, hairline separators. Very Apple-Books.
- **Top Segmented** — slim segmented control across the top; chapters as small caps
  text; active underlined. App-like; great on mobile.
- **Classic Pills** — the current colorful concept, but refined (lower saturation,
  consistent geometry, one soft shadow) so it's premium, not toy.

Keep the depth stagger only on Cloth/Pills; Side/Top are flat by design. Phone keeps
a tabs **sheet** regardless of style (the style theming applies inside the sheet).

### B3. Reading mode — `readMode: 'flip' | 'fast'`
- **Flip** (default) — the refined page-turn stays the hero.
- **Fast** — page-turn still exists for neighbors, but chapter/recipe jumps cut
  instantly and search feels immediate; good for power users / long sessions.
Both already mostly exist (`animateJump`, instant `goToLeaf`); expose the choice.

## C. Brand hierarchy ("both, cleanly")
- **Top bar**: small `CookCap` wordmark (the app), with a thin divider and the
  personal line beneath in tiny caps: `— AYESHA'S KITCHEN` (or none if no name yet).
- **Cover**: the BIG title is the **personal** one — `Ayesha` / `Cooks` (or
  `{Name} Cooks`). A tiny `CookCap` foil mark sits at the very bottom of the cover
  as the "publisher". Never show "Family Cooks" — if no name yet, cover reads a
  graceful default like `Our Family / Cookbook` and the gate invites a name.
- Fix the default owner: empty/"Family" should not produce "Family Cooks"; use a
  designed fallback and prompt for the real name.

## D. Layout grounding (desktop + big screens)
- Center the book vertically; scale it to use available height (min 560, max ~820px
  tall) within the reserved tab margin. No more tiny book in a void.
- Give the desk intentional depth: a soft radial "lamp" pool behind the book, gentle
  grain, a grounded contact shadow. In Editorial Cream this is light and airy, not dark.
- Ultrawide (≥1920): cap the composition width and center; don't stretch.
- First run: render the book first (animated in), then the name gate as a warm,
  centered welcome card over a blurred-but-beautiful book — not a form on black.

## E. Typography & spacing polish (all skins)
- One type scale; headings balanced (`text-wrap: balance`), no widows on titles.
- Generous, consistent rhythm; a tasteful drop-cap on Jia's story; smart quotes.
- Buttons/controls share one radius + one shadow token per skin.
- Icons one weight; remove any mismatched glyphs.

## F. Motion (all skins)
- One easing family; nothing too fast/slow; page-turn eased and quiet.
- Micro-interactions: favorite heart, rating, step-check, add-to-shopping — subtle.
- Everything instant under `prefers-reduced-motion`.

## G. Acceptance
- Editorial Cream default looks beautiful with zero settings touched, on phone + desktop.
- Appearance panel switches skin / tab style / read mode live; choices persist; a11y +
  reduced-motion safe; no scrollbar chrome; book never fully mounted.
- No "Family Cooks"; brand hierarchy clean; first run is inviting.
- `typecheck` + `build` + `lint` green; Lighthouse stays ~100; deployed build updated.
- Regenerate `npm run gallery` for every skin + tab style (name files by skin) so the
  owner can compare; update `docs/gallery/README.md`.

## H. Suggested order (see PART 2 for exact implementation)
1. Skin token system + **Editorial Cream default** (biggest instant win, low risk).
2. Cloth Tabs restyle (kill the candy) + `data-tabs` switch with all four styles.
3. Desktop grounding/size + first-run welcome.
4. Brand hierarchy + owner-name fallback.
5. Appearance panel (skin / tabs / read mode) + persistence.
6. Type/motion polish pass; gallery per skin; docs + version bump + deploy.

---

# PART 2 — Implementation detail (engineer-grade, minimal guessing)

## 1. Skin token blocks (drop into `globals.css`)
Each skin overrides the existing `--color-*` custom properties. Put these AFTER the
base `@theme`/`:root` so they win. Apply via `data-skin` on `<html>` (see §4). Keep
the in-skin light/dark toggle for Candlelit/Modern only; Editorial Cream + Light Book
are light-only (hide the dark toggle or make it a no-op there).

```css
/* Editorial Cream — DEFAULT (light, airy) */
:root[data-skin='editorial'] {
  --color-paper: #f6f1e7;        --color-paper-raised: #fbf7ee;  --color-paper-sunk: #ece4d5;
  --color-ink: #2c2622;          --color-ink-soft: #5c5248;      --color-ink-faint: #8a7d6e;
  --color-line: #e2d8c6;         --color-accent: #c2683c;        --color-gold: #b8934e;
  --desk: #efe7d7;               /* page-behind desk, light */
  --shadow-book: 0 24px 60px -24px rgba(90,60,35,.35);
  --paper-grain-opacity: .35;
}
/* Candlelit — dark, warm, de-muddied (raise contrast, warmer leather) */
:root[data-skin='candlelit'] {
  --color-paper: #2a2320;        --color-paper-raised: #322a25;  --color-paper-sunk: #201a16;
  --color-ink: #f0e7db;          --color-ink-soft: #c4b6a6;      --color-ink-faint: #93867a;
  --color-line: #40352d;         --color-accent: #e6934f;        --color-gold: #d3b26b;
  --desk: #17120f;
  --shadow-book: 0 34px 70px -22px rgba(0,0,0,.7);
  --paper-grain-opacity: .5;
}
/* Light Book — bright desk, creamier paper, friendly */
:root[data-skin='lightbook'] {
  --color-paper: #f3ecdb;        --color-paper-raised: #f9f3e6;  --color-paper-sunk: #e8dcc6;
  --color-ink: #33291f;          --color-ink-soft: #63564a;      --color-ink-faint: #94826d;
  --color-line: #ded1b8;         --color-accent: #b5622c;        --color-gold: #b28a44;
  --desk: #e7dcc6;
  --shadow-book: 0 26px 58px -24px rgba(90,60,30,.4);
  --paper-grain-opacity: .45;
}
/* Modern — clean, flatter, big photography */
:root[data-skin='modern'] {
  --color-paper: #faf7f2;        --color-paper-raised: #ffffff;  --color-paper-sunk: #f0ebe3;
  --color-ink: #1e1b17;          --color-ink-soft: #55504a;      --color-ink-faint: #8b8580;
  --color-line: #e9e3da;         --color-accent: #d06a3a;        --color-gold: #b9954f;
  --desk: #f3efe9;
  --shadow-book: 0 18px 44px -22px rgba(30,20,10,.28);
  --paper-grain-opacity: .18;   /* less texture */
}
```
Wire `--desk` into `journal-desk`/`journal-stage` backgrounds, `--shadow-book` into
the book case, and `--paper-grain-opacity` into `.paper-grain::before`/`.leather::before`.

## 2. Cloth Tabs (kill the candy) — `[data-tabs='cloth']`
Rework `.sticker-tab`/`.sticker-face` (BookmarkRail CSS) for the cloth style:
- Face bg: `color-mix(in srgb, var(--sticker) 38%, var(--color-paper))`.
- Border: `1px solid color-mix(in srgb, var(--sticker) 45%, var(--color-ink))`.
- Label ink: `color-mix(in srgb, var(--sticker) 72%, #2a1a10)` (NOT white on pastel).
- ONE soft shadow: `0 2px 6px rgba(40,24,12,.18)`; remove gloss gradients + the
  `sticker-slit`/`sticker-pin` highlights (or hide them under `[data-tabs='cloth']`).
- Even left edge: keep depth via the existing `x` translate spring only; set
  `marginLeft` constant (e.g. 0) so edges don't jag. Depth stagger stays subtle.
- Optional fabric: a 4–6% opacity noise `background-blend-mode: multiply`.
Active tab: `--sticker` at 55% mix + `--color-gold` hairline + slightly larger.

## 3. Other tab styles
- `[data-tabs='pills']` — current look but: saturation −25%, uniform geometry, single
  shadow, no jagged margins.
- `[data-tabs='index']` — BookmarkRail renders a `<nav>` list instead of pills: each
  row = `• Chapter` (color dot = `--sticker`, label = `--color-ink`), hairline divider,
  active = accent text + left rule. No depth block; the fore-edge stays as a thin page stack.
- `[data-tabs='top']` — render a slim segmented bar in `Shell` header area (desktop)
  / above the book (mobile): small-caps chapter text, active underlined with `--color-accent`.
  Hide the right rail when this is active.
Phone: always the existing tabs **sheet**; the chosen style themes the sheet's chips.

## 4. Appearance state + no-flash apply
New `src/components/app/Appearance.tsx`:
```ts
type Skin = 'editorial'|'candlelit'|'lightbook'|'modern';
type TabStyle = 'cloth'|'index'|'top'|'pills';
type ReadMode = 'flip'|'fast';
// context: { skin, tabStyle, readMode, setSkin, setTabStyle, setReadMode }
// persist: localStorage 'cookcap-skin' | 'cookcap-tabs' | 'cookcap-readmode'
// apply: document.documentElement.dataset.skin/tabs/readmode on change
```
Defaults: `skin='editorial'`, `tabStyle='cloth'`, `readMode='flip'`.
In `src/app/layout.tsx`, add a tiny inline script (like the existing theme script) to
set `data-skin/tabs/readmode` from localStorage BEFORE paint → no flash.
`BookController` reads `readMode`: `fast` → `goToChapter`/`goToRecipe` cut instantly
(skip the 1–2 page hop), neighbor flips still animate.

## 5. Appearance panel UI
Top-bar button (paint-roller icon) → popover (desktop) / bottom sheet (mobile) with 3
groups: **Theme** (4 swatch cards), **Chapter tabs** (4 mini previews), **Reading**
(Flip / Fast segmented). Live apply on select. Reuse existing dialog a11y
(`useDialogA11y`), focus-trap, Escape, reduced-motion. No scrollbar chrome.

## 6. Brand hierarchy + name fallback
- `src/lib/edition.ts`: if owner name is empty/"Family"/"Our", cover title →
  `Our Family` / `Cookbook` (two lines) and eyebrow `A FAMILY COOKBOOK`; header shows
  `CookCap` only. Never emit "Family Cooks".
- Cover: big personal title (`{Name}` / `Cooks`), tiny `CookCap` gold mark bottom-center
  as publisher. Top bar: `CookCap` wordmark + faint `— {NAME}'S KITCHEN` when named.
- First run: mount the book (animate in), THEN the name gate as a centered welcome card
  over a softly blurred book; not a form on black.

## 7. Desktop grounding
`Shell` stage: center the book vertically; height = `clamp(560px, 82vh, 820px)`, width
from aspect. Add a radial lamp pool behind the book using `--desk` + a warm center; a
grounded contact shadow under the book. Cap composition at ~1400px on ultrawide, center.

## 8. File map (where each change lands)
- `src/app/globals.css` — skin blocks (§1), tab variants (§2, §3), lamp/desk vars.
- `src/app/layout.tsx` — no-flash inline script for data-skin/tabs/readmode.
- `src/components/app/Appearance.tsx` — NEW provider + panel.
- `src/components/app/AppStore.tsx` — optional: expose appearance if you prefer one store.
- `src/components/book/Shell.tsx` — Appearance button, brand hierarchy, stage grounding.
- `src/components/book/BookmarkRail.tsx` — read `data-tabs`; render index/top variants;
  cloth/pills are mostly CSS.
- `src/components/book/BookController.tsx` — honor `readMode='fast'`.
- `src/components/book/leaves/CoverLeaf.tsx` + `src/lib/edition.ts` — brand + fallback.
- `scripts/capture-gallery.mjs` — loop skins × tab styles; name files `{skin}-{tabs}-…`.

## 9. Review checklist (what I'll verify after Cursor)
- [ ] Editorial Cream default looks beautiful, phone + desktop, zero settings changed.
- [ ] No candy pills; Cloth tabs cohesive; all 4 tab styles switch cleanly.
- [ ] All 4 skins readable, AA contrast, no muddy dark; light/dark toggle sane per skin.
- [ ] Book grounded/centered on desktop + ultrawide; warm first-run welcome.
- [ ] No "Family Cooks"; CookCap + personal name hierarchy clean.
- [ ] Nav works (flip + tab hop + fast mode); reduced-motion instant; no scrollbar chrome.
- [ ] `typecheck` + `build` + `lint` green; Lighthouse ~100; gallery per skin committed.
