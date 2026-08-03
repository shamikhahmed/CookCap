# CookCap — Screen gallery

Version **3.1.0**. Regen: `GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery`.

Demo edition: **Ayesha**. Recipes: **223** (family editorial; hero-only).

**Claude entry:** [`../REVIEW-PACK.md`](../REVIEW-PACK.md)

## Layout

| Path | What |
|------|------|
| `{desktop,mobile}/00*.png` | Simple onboarding |
| `{desktop,mobile}/01–19*.png` | Book chrome, drawers, appearance, **page nav** |
| `{desktop,mobile}/scroll/` | Scroll depths — recipe / contents / chapter / mode chooser / search |
| `{desktop,mobile}/modes/` | Every cooking mode on same recipe |
| `{desktop,mobile}/appearance/` | Skin × tab matrix |
| `{desktop,mobile}/tabs/` | Tab-style picks |
| `{desktop,mobile}/dresser/` | 3D dresser stills |

## Modes (13)

`reader` · `plate` · `mother` · `budget` · `quick` · `beginner` · `dawat` · `ramadan` · `toddler` · `diabetic` · `heart` · `fiber` · `couple`

## Spot-check (3.1.0)

- `05-recipe.png` — one hero, no step photos  
- `19-page-nav.png` — footer Home / scrub / page count (if captured)  
- Guacamole leaf — honest green dip (not samosas)  

## Gates

```bash
npm run gate:anti-2d
npm run gate:recipes
```

Checkpoints: `docs/gallery/checkpoints/`.
