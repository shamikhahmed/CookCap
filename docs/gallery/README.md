# CookCap — Screen gallery

Version **2.2.0**. Regen: `GALLERY_URL=http://127.0.0.1:3456 npm run gallery` (static `out/` preferred).

## Desktop (1440×900)

| # | Screen | File |
|---|--------|------|
| 00 | Welcome value | `desktop/00-welcome.png` |
| 00b | Name gate | `desktop/00b-name-gate.png` |
| 01–12 | Core book + tabs | `desktop/01`…`12` |
| 13–17 | Modes / profiles / calendar / pantry / plate | `desktop/13`…`17` |

## Appearance matrix

`desktop/appearance/{skin}-{tabs}-cover.png` + `panel.png`  
Skins: editorial · candlelit · lightbook · modern  
Tabs: cloth · index · top · pills

## Mobile (390×844)

Same under `mobile/`.

## Regen

```bash
npm run build && python3 -m http.server 3456 --directory out
GALLERY_URL=http://127.0.0.1:3456 npm run gallery
# or device-only: GALLERY_DEVICE=desktop|mobile
```
