# CookCap — Screen gallery

Version **3.4.1**. Regen: `GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery`.

Demo edition: **Ayesha**. Recipes: **790** (family + world table; hero-only).

**Claude entry:** [`../REVIEW-PACK.md`](../REVIEW-PACK.md)

## Motion proof

| Path | What |
|------|------|
| `recordings/onboard-flip.webm` | Onboarding → cover open → 3 flips (390×844 @3x) |
| `recordings/onboard-flip-metrics.json` | rAF + longtask gate (`npm run record:onboard-flip`) |

## Layout

| Path | What |
|------|------|
| `{desktop,mobile}/00*.png` | Simple onboarding |
| `{desktop,mobile}/01–19*.png` | Book chrome, drawers, appearance, **page nav**, **wood desk** |
| `{desktop,mobile}/scroll/` | Scroll depths — recipe / contents / chapter / mode chooser / search |
| `{desktop,mobile}/modes/` | Every cooking mode on same recipe |
| `{desktop,mobile}/appearance/` | Skin × tab matrix |
| `{desktop,mobile}/tabs/` | Tab-style picks |
| `{desktop,mobile}/dresser/` | 3D dresser stills |
| `checkpoints/wood-reader-*.png` | DOM wood gate shots |

## Modes (13)

`reader` · `plate` · `mother` · `budget` · `quick` · `beginner` · `dawat` · `ramadan` · `toddler` · `diabetic` · `heart` · `fiber` · `couple`

## Spot-check (3.4.1)

- Reading body ≥16px; chrome labels ≥12px  
- Interactive hits ≥44px (heart / stars / steps / footer)  
- WhatsNew = small top-right toast (not over hero)  
- `05-recipe.png` — title clear of heart; strong scrim  
- Paper tabs — World / Europe fully visible  
- Reading screen shows **wood**, not cream desk  
- Guacamole leaf — honest green dip (not samosas)  

## Gates

```bash
npm run gate:anti-2d
npm run gate:wood
npm run gate:recipes
npm run smoke:product
```

Checkpoints: `docs/gallery/checkpoints/`.