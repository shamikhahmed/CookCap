# CookCap — Design system (HIG 3)

Heirloom family cookbook. Content first (the book); chrome stays quiet.
Copper terracotta accent (`--tint` / `--tint-text`) — Jia Cooks brand lock, not Capricorn teal.
Source of truth: `src/design/{tokens,system,cookcap}.css` and `src/components/kit`.

## Principles

1. **Book first.** The hardcover + leaf pages carry the product; UI chrome is glass and copper.
2. **One accent.** Copper (`--tint` fills, `--tint-text` for AA text on light) marks primary actions, selection, links.
3. **System type.** SF (`--font-ui`) for chrome at 17pt body; Fraunces / Source Serif stay for recipe editorial voice.
4. **Native patterns.** Large titles where screens allow, floating glass page bar, sheets with grabber + Cancel / Title / Done.
5. **Accessible by default.** 44pt targets, AA contrast, reduced motion + transparency honoured.
   Theme always resolves to `data-theme=light|dark` (including System) so chrome `--label` /
   `--glass` never stay on light defaults under OS dark. Cover foil uses solid deep gold on
   cream parchment and brighter stops on dark leather; page-bar text uses `--label` on warm glass.

## Tokens (`src/design/tokens.css`, unlayered)

| Token | Use |
|---|---|
| `--bg`, `--surface`, `--surface-2`, `--fill` | Grouped surfaces / controls |
| `--separator`, `--label(-2/-3/-4)` | Hairlines + text hierarchy |
| `--tint`, `--tint-text`, `--tint-soft`, `--on-tint` | Copper accent (fill vs AA text) |
| `--t-large` … `--t-caption2` | iOS text styles (34 → 11pt) |
| `--hit`, `--gutter`, `--tabbar-h` | 44pt targets, gutters, page-bar height |
| `--glass-material` | Floating chrome |

Legacy `--color-*` / editorial paper tokens are bridged so existing leaves inherit the copper tint without a rewrite.

## Shell

- **Phone:** floating glass page bar (prev / scrub / next) — `bottom: max(14px, safe+6)`.
- **≥700px:** same glass page bar (wider); chapter bookmark rail keeps the right-side tools dock.
- **Sheets / drawers:** grabber + Cancel / Title / Done (Favorites, Shopping); `ScrollLock` pins `body` with `position:fixed; top:-scrollY`.
- **Book leaves** keep `[data-leaf-scroll]` inner scrollers (intentional — page metaphor). Documented in `qa/hig/REPORT.md`.

## Cascade

```
@layer legacy, components;
@import brand tokens (unlayered hex)
@import src/design/tokens.css          ← HIG semantic + iPhone recipe (unlayered)
@import ios-tokens.css layer(legacy)
@import src/design/system.css          ← ui-* (@layer components)
@import src/design/cookcap.css         ← journal chrome reskin
```

## Verify

```bash
npm run build
npx --yes serve out -l 8830
node scripts/ios-behaviour-check.mjs http://127.0.0.1:8830/
npm run test:e2e
```
