# CookCap — Handover

Heirloom family cookbook PWA (Cap family). Version **3.1.0**.

## Live

https://shamikhahmed.github.io/CookCap/

Next `output: 'export'` + Actions Pages. `NEXT_PUBLIC_BASE_PATH=/CookCap` on CI.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · Motion · IndexedDB v4 (`cookcap`, migrates `jia-cooks`) · SW `cookcap-v31`

Heroes locked: `src/lib/recipes/images.lock.json` — rematch/fill need `--force-unlock`.  
Gates: `gate:recipes` · `gate:anti-2d` · `smoke:product` (CI after build).  
Catalog: **223** recipes (`gate:recipes`).  
User media: IDB `user-heroes` + `cover-image`; fork merge in `buildLeaves`.  
Serve with → `src/lib/recipes/serve-with.ts`. Phase map: `docs/ROADMAP.md`. Hard nos: `docs/SECURITY.md`.  
**Claude review entry:** `docs/REVIEW-PACK.md`

## Run

```bash
cd "/Users/shamikhahmed/CookBook Website"
npm install && npm run dev
npm run typecheck && npm run gate:recipes && npm run gate:anti-2d
npm run pages:build
# Gallery (base path):
mkdir -p /tmp/gal-root && ln -sfn "$PWD/out" /tmp/gal-root/CookCap
python3 -m http.server 3456 --directory /tmp/gal-root &
GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery
```

## Chrome / safe areas

- `viewportFit: 'cover'` in `layout.tsx` (required for `env(safe-area-inset-*)`)
- Tokens: `--safe-t/b/l/r`, `--header-h`, `--footer-h`, `--chrome-total`
- `.app-header` / `.app-footer` carry insets; desk is `100dvh` flex column
- Footer nav (3.1.0): Home · ±5 · prev/next · **page scrubber** · tap page count → go-to #

## Dresser

- Dressing table onboard → book lands on wooden table → paper tabs beside book
- Escape during dresser confirms before skip
- Low CPU / reduced motion → Simple onboard (`OnboardingFlow`)

## Recipes

- One hero only (no step photos); honest photos or generated art
- Family editorial only — **no TheMealDB**
- Chapters: pakistani / chinese / italian / desserts / coffee / breads / baking / snacks / meals / favorites / tips
- WarmLeafPool ≤9 DOM; chapter lists ≤24 rows
- Contents = single scroll (Today’s kitchen + occasions + chapters)

## Lenses (additive — Reader = pure book)

| Mode | What |
|------|------|
| Reader | Default. No badges/tracking |
| My Plate | Fit badges, For You leaf, log, healthier |
| Mother | Cook-for multi + allergen flags |
| Budget | Cost estimates + weekly budget + pantry |
| Quick / Beginner / Dawat / Ramadan / Toddler / health / Couple | Scoring presets |

Profiles + diary + pantry + heroes + cover = device-local IndexedDB. Export includes meal plan + photo blobs. Guest PIN = browse-only (not crypto). Merge or replace on restore.

## Gotchas

- `unoptimized` Image needs `withBase()` on Pages
- Phone = full-bleed leaf; **Tabs** in footer
- Mode switch remaps leaf index (`remapLeafIndex`)
- First-run: Dresser unless reduced-motion or `hardwareConcurrency ≤ 4`
- Never `.journal-desk > * { z-index: 1 }` (kills Appearance)
- Shipped tabs = `paper` only
- Hero rematch: `node scripts/rematch-heroes.mjs --force-unlock --only=id` (human approval)

## Key paths

`Shell.tsx` (footer nav) · `BookController.tsx` · `DresserOnboarding.tsx` · `CookingMode.tsx` · `serve-with.ts` · `smart-query.ts` · `occasions/templates.ts` · `GuestMode.tsx` · `docs/SECURITY.md` · `docs/gallery/`
