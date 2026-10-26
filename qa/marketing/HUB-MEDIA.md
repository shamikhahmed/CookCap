# Hub media sync — CookCap 3.7.8

Copy these files into `shamikhahmed.github.io/apps/cookcap/` (hub). Paths below are **source → hub destination**.

## Gallery webps (108 hub + 3 iPad demos)

Copy the entire tree (same relative paths under `shots/`):

| Source (this repo) | Hub path |
| --- | --- |
| `qa/marketing/shots/{dark,light}/{iphone,ipad,mac}/*.webp` | `apps/cookcap/shots/{dark,light}/{iphone,ipad,mac}/*.webp` |

Hub shot names (single hyphen), e.g. `book-cover-default.webp`, `cook-recipe-default.webp`, `plan-shopping-list-default.webp`.

iPad light demos also present: `book-cover-demo.webp`, `book-contents-demo.webp`, `book-recipe-demo.webp`.

> Phase A live capture failed (SUMMARY FAIL rows). Phase B seeded hub shots from `docs/screenshots/gallery/` (iphone/mac full set; ipad demos + iphone fallbacks). Re-run `bash qa/marketing/capture.sh` when the app shell is healthy to refresh pixels.

## App Store PNGs (16) — Connect upload / archive

| Source | Notes |
| --- | --- |
| `qa/marketing/appstore/iphone-6.9-{light,dark}-0{1..5}-*.png` | 1320×2868 |
| `qa/marketing/appstore/ipad-13-{light,dark}-0{1..3}-*.png` | 2064×2752 |

Not required on the hub HTML page; keep for App Store Connect.

## Walkthrough (marketing site + optional hub)

| Source | Hub / Pages path |
| --- | --- |
| `public/site/walkthrough.mp4` | `apps/cookcap/walkthrough.mp4` (or leave on app Pages `CookCap/site/`) |
| `public/site/walkthrough.webm` | same basename beside the mp4 |
| `public/site/walkthrough-poster.webp` | same basename beside the mp4 |
| `public/site/walkthrough.vtt` | captions beside the mp4 |

Landing wires: `<video preload="none" poster="site/walkthrough-poster.webp">` + VTT track.

## Site hero seeds (app Pages `CookCap/site/`)

Already updated in-repo (display-sized webp ≈560×1212 phones / 1200×834 iPad):

- `public/site/cover.webp`
- `public/site/contents.webp`
- `public/site/recipe.webp`
- `public/site/cook.webp`
- `public/site/shopping.webp`
- `public/site/search.webp`
- `public/site/ipad-contents.webp`
- `public/site/walkthrough-poster.webp`
- `public/site/site.css`

## Screen gallery (app repo)

Mirrored for `screen-gallery.html`:

- `docs/screenshots/gallery/{dark,light}/{iphone,ipad,mac}/*--*--{default,demo}.webp`
- `docs/screenshots/gallery/gallery-manifest.json`

## Lighthouse note (landing)

Phase A captured: performance **94**, accessibility **95**. Phase B: resized site heroes, underlined muted links, `scroll-behavior:auto`, real walkthrough mp4/webm. Re-run `bash qa/marketing/lighthouse.sh` outside the sandbox; gate is performance ≥95 and accessibility ≥95.
