# CookCap — Screen gallery

Version **2.2.7**. Regen: `GALLERY_URL=http://127.0.0.1:3456 npm run gallery` (static `out/` preferred).

Demo edition: **Ayesha**.

## Tab style options (pick — default still Cloth)

`{desktop,mobile}/tabs/{cloth|index|top|pills}-{editorial|candlelit}.png`

**Default unchanged** until you choose.

**What's off with Cloth today:** active tab extrusion can kiss/overlap the fore-edge seam; long labels need `width:auto` (already); cloth faces can look jagged at deviceScale 2; spacing between tabs uneven vs Side Index.

**Proposal (wait for pick):** cleaner **Side Index** default — typographic list, tiny chapter color dots, hairline dividers, no 3D extrusion fight with the book edge.

## Dresser v3

`{desktop,mobile}/dresser/` — welcome, open drawers (carved Q), reveal, handoff, skin welcomes.

## Core + appearance

See prior index (`00`–`18`, `appearance/`).

## Regen

```bash
npm run build && python3 -m http.server 3456 --directory out
GALLERY_URL=http://127.0.0.1:3456 npm run gallery
```
