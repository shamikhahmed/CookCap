# CookCap — Screen gallery

Version **2.2.5**. Regen: `GALLERY_URL=http://127.0.0.1:3456 npm run gallery` (static `out/` preferred).

Demo edition in shots: **Ayesha** (not a hard-coded product name).

## Desktop (1440×900)

| # | Screen | File |
|---|--------|------|
| 00 | Simple welcome | `desktop/00-welcome.png` |
| 00b–00e | Simple name → profile → mode → reveal | `desktop/00b`…`00e` |
| 01–12 | Core book + tabs | `desktop/01`…`12` |
| 13–17 | Modes / profiles / calendar / pantry / plate | `desktop/13`…`17` |
| 18 | Appearance panel | `desktop/18-appearance.png` |

### Dresser (full-motion path)

| # | Screen | File |
|---|--------|------|
| 00 | Welcome plate on dresser | `desktop/dresser/00-welcome.png` |
| 00b–00d | Name / profile / mode drawers | `desktop/dresser/00b`…`00d` |
| 00e | Rising embossed book | `desktop/dresser/00e-reveal.png` |
| 01 | Cover after handoff | `desktop/dresser/01-cover-handoff.png` |

## Appearance matrix

`desktop/appearance/{skin}-{tabs}-cover.png` + `panel.png`  
Skins: editorial · candlelit · lightbook · modern  
Tabs: cloth · index · top · pills

## Mobile (390×844)

Same under `mobile/` (+ `mobile/dresser/`).

## Regen

```bash
npm run build && python3 -m http.server 3456 --directory out
GALLERY_URL=http://127.0.0.1:3456 npm run gallery
# device-only: GALLERY_DEVICE=desktop|mobile
```

Prefer `python3 -m http.server` over `npx serve` (EMFILE under heavy recipe prefetch).  
Simple stills use `prefers-reduced-motion: reduce`. Dresser stills force `no-preference` + `hardwareConcurrency > 4`.
