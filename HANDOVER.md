# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **3.7.8**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v4 (`cookcap`, migrates `jia-cooks`) · SW `cookcap-v378`

Heroes locked: `src/lib/recipes/images.lock.json` — rematch/fill need `--force-unlock`.  
Gates: `gate:recipes` · `gate:anti-2d` · `gate:wood` · `smoke:product` (CI after build).  
Catalog: family editorial + local **world table** (`data-world-table.ts`).  
User media: IDB `user-heroes` + `cover-image`; fork merge in `buildLeaves`.  
Serve with → `src/lib/recipes/serve-with.ts`. Phase map: `docs/ROADMAP.md`. Hard nos: `docs/SECURITY.md`.  
**Claude review entry:** `docs/REVIEW-PACK.md`

## Appearance (v3.7.6)

- Default skin **Editorial** supports light cream paper **and** night paper dark (`#17140f` / cream ink `#efe6d6` / muted gold rules)
- Appearance → Dark / Auto / System: boot + `applyTheme` always set resolved `data-theme=light|dark` (HIG `--label` / `--glass` stay coherent under OS dark)
- Tokens: `src/design/tokens.css` (HIG) + `src/app/globals.css` skins; cover foil AA via `--color-gold-text` / `--foil-*`
- Photos unchanged across themes
- Prod-ready evidence: `qa/prod-ready/REPORT.md`

## Run

```bash
cd "/Users/shamikhahmed/Projects/Cap/Cap-Apps/CookCap"
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d && npm run gate:wood
npm run pages:build
# Gallery (base path):
mkdir -p /tmp/gal-root && ln -sfn "$PWD/out" /tmp/gal-root/CookCap
python3 -m http.server 3456 --directory /tmp/gal-root &
GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery
# Dark v3 webp (same ids as light):
GALLERY_URL=http://127.0.0.1:3456/CookCap node scripts/capture-gallery-v3-dark.mjs
GATE_URL=http://127.0.0.1:3456/CookCap npm run gate:wood
```

## Chrome / safe areas

- `viewportFit: 'cover'` in `layout.tsx` (required for `env(safe-area-inset-*)`)
- Tokens: `--safe-t/b/l/r`, `--header-h`, `--footer-h`, `--chrome-total`
- `.app-header` / `.app-footer` carry insets; desk is `100dvh` flex column
- Footer nav: Home · ±5 · prev/next · **page scrubber** · tap page count → go-to #
- Reading desk = real wood (`--dr-wood`); phone chrome wood-tinted
- Dresser animation bible — idle + wood drawer open/close
- Cover open hinge — leather swing, inside paper, page fan

## Recipes

- One hero only (no step photos); honest photos or generated art
- Local-only catalog — **no live TheMealDB fetch / branding**; world table is scrubbed local data
- Chapters: pakistani / chinese / italian / european / world / desserts / coffee / breakfast / breads / baking / snacks / vegetarian / meals / favorites / tips
- WarmLeafPool ≤9 DOM; chapter lists ≤24 rows
- Contents = single scroll (Today’s kitchen + occasions + chapters)

## Lenses (additive — Reader = pure book)

| Mode | What |
|------|------|
| Reader | Default. No badges/tracking |
| Kitchen | Pantry / shop / plan / diary |
| Mother | Allergen watch for cooking-for |
| Chef | Timers, mise, glove |
| Occasions | Ramadan / Eid / rainy rails |

## Guardrails

local-only · offline-first · honest heroes · no fake AI · book-first · WarmLeafPool · hero lock · never “Family Cooks”
