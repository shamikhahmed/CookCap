# CookCap — Screen gallery

Version **2.0.0**. Regen: `GALLERY_URL=http://localhost:3456 npm run gallery` (static `out/` preferred).

## Desktop (1440×900)

| # | Screen | File |
|---|--------|------|
| 00–12 | Core book + tabs | `desktop/00`…`12` |
| 13 | Mode chooser | [desktop/13-mode-chooser.png](./desktop/13-mode-chooser.png) |
| 14 | Profiles | [desktop/14-profiles.png](./desktop/14-profiles.png) |
| 15 | Calendar | [desktop/15-calendar.png](./desktop/15-calendar.png) |
| 16 | Pantry & budget | [desktop/16-pantry.png](./desktop/16-pantry.png) |
| 17 | Recipe (My Plate) | [desktop/17-recipe-plate.png](./desktop/17-recipe-plate.png) |

## Mobile (390×844)

Same set under `mobile/`.

## Regen

```bash
npm run build && npx serve out -l 3456
GALLERY_URL=http://localhost:3456 npm run gallery
```
