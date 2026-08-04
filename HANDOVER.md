# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **3.3.2**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v4 (`cookcap`, migrates `jia-cooks`) · SW `cookcap-v36`

Heroes locked: `src/lib/recipes/images.lock.json` — rematch/fill need `--force-unlock`.  
Gates: `gate:recipes` · `gate:anti-2d` · `gate:wood` · `smoke:product` (CI after build).  
Catalog: **790** recipes (`gate:recipes`) — family editorial + local **world table** (`data-world-table.ts`).  
User media: IDB `user-heroes` + `cover-image`; fork merge in `buildLeaves`.  
Serve with → `src/lib/recipes/serve-with.ts`. Phase map: `docs/ROADMAP.md`. Hard nos: `docs/SECURITY.md`.  
**Claude review entry:** `docs/REVIEW-PACK.md`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d && npm run gate:wood
npm run pages:build
# Gallery (base path):
mkdir -p /tmp/gal-root && ln -sfn "$PWD/out" /tmp/gal-root/CookCap
python3 -m http.server 3456 --directory /tmp/gal-root &
GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery
GATE_URL=http://127.0.0.1:3456/CookCap npm run gate:wood
```

## Chrome / safe areas

- `viewportFit: 'cover'` in `layout.tsx` (required for `env(safe-area-inset-*)`)
- Tokens: `--safe-t/b/l/r`, `--header-h`, `--footer-h`, `--chrome-total`
- `.app-header` / `.app-footer` carry insets; desk is `100dvh` flex column
- Footer nav: Home · ±5 · prev/next · **page scrubber** · tap page count → go-to #
- **v3.2.0** reading desk = real wood (`--dr-wood`), not cream; phone chrome wood-tinted
- **v3.3.1** dresser animation bible — idle (lamp/motes/parallax) + wood drawer open/close
- **v3.3.2** cover open hinge — leather swing, inside paper, page fan

## Dresser

- Dressing table onboard → book lands on **same** wooden table → paper tabs stuck to wood
- **v3.3.1** — lamp breathe, dust motes, ≤±4° mouse parallax; drawer break-free open + thunk close
- Escape during dresser confirms before skip
- Low CPU / reduced motion → Simple onboard (`OnboardingFlow`)

## Cover open

- **v3.3.2** — cover leaf tap / drag forward → hinge `rotateY 0→−160°` (620ms `--e-page`)
- Paper inside cover past −90°; cast shadow peaks mid-swing; 4-sheet right-edge fan
- Spine gutter deepens while open; reduced-motion = 200ms cross-fade
- Spec: `docs/animation-bible.md` §6 · impl: `src/components/book/Book.tsx`

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
