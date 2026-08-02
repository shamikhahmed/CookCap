# CookCap — A Family Cookbook

A premium, offline-first cookbook **Progressive Web App** in the Cap family.
Gold-foil cover, kitchen friends, 3D page turns, laminated chapter tabs — with
light (parchment) and dark (candlelit) themes.

> Formerly **Jia Cooks** / “Grimoire”. Product name is **CookCap**. The physical
> book title is **`{YourName} Cooks`** from a first-run name prompt.

## Live (GitHub Pages)

Same hosting model as PulseCap / VaultCap / ScentCap:

**https://shamikhahmed.github.io/CookCap/**

No Vercel required — static export + Actions → Pages.

## Stack

- **Next.js 15** (App Router, `output: 'export'` for Pages)
- **React 19 + TypeScript**
- **Tailwind CSS v4** — design tokens in `src/app/globals.css`
- **Motion** — book/page physics
- **IndexedDB** (`idb`) — favorites, notes, shopping, meal plan
- **Service Worker** — `cookcap-v1`

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static → out/
npm run pages:build  # with NEXT_PUBLIC_BASE_PATH=/CookCap
npm run typecheck
npm run gallery      # screen gallery (dev server required)
```

## Name → book title

1. First visit → **Whose cookbook is this?**
2. Cover / title become **`{Name} Cooks`**
3. Chrome product label stays **CookCap**
4. ··· → **Change book name** anytime
5. Share links can use `?for=Jia` (or any name)

## Docs

- [HANDOVER.md](./HANDOVER.md)
- [CHANGELOG.md](./CHANGELOG.md) — `VERSION` is `1.5.0`
- [USER_GUIDE.md](./USER_GUIDE.md)
- [PRESENTATION.md](./PRESENTATION.md)
- [docs/gallery/README.md](./docs/gallery/README.md)
- [docs/photos.md](./docs/photos.md)
- [docs/adding-recipes.md](./docs/adding-recipes.md)

## Architecture

Feature-based under `src/` — book leaves, drawers, IndexedDB, SW. See HANDOVER.
