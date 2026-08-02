# CookCap — Screen gallery

Version **2.4.5**. Regen: `GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery`.

Demo edition: **Ayesha**. Recipes: **215** (family editorial; hero-only).

## Layout

| Path | What |
|------|------|
| `{desktop,mobile}/00*.png` | Simple onboarding |
| `{desktop,mobile}/01–18*.png` | Book chrome, drawers, appearance |
| `{desktop,mobile}/scroll/` | Scroll depths — recipe / contents / chapter / mode chooser / search |
| `{desktop,mobile}/modes/` | **Every** cooking mode on the same recipe (`{id}-recipe.png`) |
| `{desktop,mobile}/appearance/` | Skin × tab matrix |
| `{desktop,mobile}/tabs/` | Tab-style picks |
| `{desktop,mobile}/dresser/` | 3D dresser stills |

## Modes (13)

`reader` · `plate` · `mother` · `budget` · `quick` · `beginner` · `dawat` · `ramadan` · `toddler` · `diabetic` · `heart` · `fiber` · `couple`

Extra mid-scroll for plate / budget / mother / diabetic (`*-recipe-scroll.png`).

## Dresser World

Wooden table + paper tabs + dresser stills — see `{desktop,mobile}/`.

## Recipe (redesign)

One hero, quick facts, no step photos. Spot-check `05-recipe.png` + `scroll/recipe-*.png`.

## Gates

```bash
npm run gate:anti-2d
npm run gate:recipes
```

Checkpoints: `docs/gallery/checkpoints/`.
