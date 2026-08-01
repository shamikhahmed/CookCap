# Jia Cooks — A Family Cookbook

A premium, offline-first cookbook **Progressive Web App** that opens like a real
leather-bound heirloom. Jia’s personal storybook of recipes: gold-foil cover,
kitchen friends, 3D page turns, laminated chapter tabs, textured paper, and an
editorial recipe layout — with light (parchment) and dark (candlelit) themes.

> Formerly scaffolded under the working name “Grimoire”; the shipped product is
> **Jia Cooks**. See [HANDOVER.md](./HANDOVER.md) and [CHANGELOG.md](./CHANGELOG.md).

## Stack

- **Next.js 15** (App Router, single static route — the "one physical object")
- **React 19 + TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** — the entire design system lives in `@theme` in
  `src/app/globals.css` (typography, color, spacing, radius, elevation, motion)
- **Motion (Framer Motion v12)** — book/page physics, transitions
- **IndexedDB** (`idb`) — favorites, notes, ratings, history, collections,
  shopping list; fully functional with no account and no network
- **Service Worker** — network-first shell + stale-while-revalidate assets;
  installable PWA (`jia-v7`)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
```

## Architecture

Feature-based, everything under `src/`:

```
src/
  app/                 layout, page, globals.css (design tokens)
  components/
    app/               AppStore (theme + favorites context), ServiceWorker
    book/              BookController, Book (flip engine), Shell, rails, drawers
      leaves/          Cover, Title, Friends, Contents, Chapter, Recipe
    art/               Kitchen-friend character art
    search/            SearchOverlay
    ui/                Icon set, RecipeImage
  lib/
    recipes/           types, chapters, data (+ data-extra, data-fill), hero, images
    book/              pages (leaf sequence)
    friends/           kitchen friends roster
    search/            fuzzy search engine
    db/                IndexedDB store
public/                manifest, sw.js, generated icons, recipe photos
docs/adding-recipes.md One-object-per-recipe guide for Jia
```

### Key decisions

- **The book is a linear sequence of leaves** (`lib/book/pages.ts`). The
  controller only moves indices, so bookmarks, search, "cook next", and
  continue-reading all jump by page number and share one flip animation.
- **Recipes scale forever** — flagship objects in `data.ts`; compact builders in
  `data-extra.ts` / `data-fill.ts`. Index, tabs, search, related all auto-update.
- **Procedural hero art** (`lib/recipes/hero.ts`) — deterministic SVG per
  recipe seed when no photo exists. Offline-safe.
- **Turn lock** in `BookController` prevents interrupting a flip mid-flight.
  Reduced-motion (and far jumps) use an **instant cut**, not a cross-fade.
- **All user state in IndexedDB**, mirrored optimistically into React context.
- **Stock photos are placeholders** — many recipe heroes come from free stock
  (MealDB / similar), not Jia’s kitchen. Replace with real photos via
  `docs/photos.md` when ready.

## Accessibility

WCAG-minded: semantic landmarks, `aria-current`/`aria-pressed`, visible focus
rings, keyboard navigation (←/→, PageUp/Down, Esc), 40px+ touch targets, and a
full `prefers-reduced-motion` path (instant page cut).

## Docs

- [HANDOVER.md](./HANDOVER.md) — stack, architecture, editions, deploy
- [CHANGELOG.md](./CHANGELOG.md) — release history (`VERSION` is `1.4.1`)
- [USER_GUIDE.md](./USER_GUIDE.md) — plain-language how-to
- [docs/photos.md](./docs/photos.md) — hero + step photo drop-in
- [docs/claude-code-depth-prompt.md](./docs/claude-code-depth-prompt.md) — Claude Code brief for 3D book/tabs
- [docs/adding-recipes.md](./docs/adding-recipes.md) · [docs/photos.md](./docs/photos.md)

## Roadmap (architecture is in place for)

Shopping list & meal planner UI polish, own photography pipeline, print layout.
