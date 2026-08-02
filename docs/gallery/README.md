# CookCap — Screen gallery

Version **2.2.8**. Regen: `GALLERY_URL=http://127.0.0.1:3456 npm run gallery` (static `out/` preferred).

Demo edition: **Ayesha**.

## Dresser World (shipped)

- **Wooden table** — reading desk grain + lamp; book contact shadow
- **Paper tabs** — `{desktop,mobile}/tabs/paper-{editorial|candlelit}.png`
- Phone: book full-bleed; Tabs sheet = paper tabs on wood strip
- Anti-2D checkpoints: `docs/gallery/checkpoints/`

## Legacy tab styles (code kept, not shipped default)

`{desktop,mobile}/tabs/{cloth|index|top|pills}-{editorial|candlelit}.png`

## Dresser / reveal

`{desktop,mobile}/dresser/` — welcome, open drawers (carved Q), reveal→table, handoff, skin welcomes.

## Core + appearance

See prior index (`00`–`18`, `appearance/`).

## Regen

```bash
npm run build && python3 -m http.server 3456 --directory out
GALLERY_URL=http://127.0.0.1:3456 npm run gallery
GATE_URL=http://127.0.0.1:3456 npm run gate:anti-2d
```
