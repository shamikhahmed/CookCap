# CookCap v3.3.0 — QA Matrix

**Live:** https://shamikhahmed.github.io/CookCap/ · **SW:** `cookcap-v34`  
**Evidence:** `docs/gallery/` · **Review:** `docs/REVIEW-PACK.md`

> Prove by gates + smoke against served `out/` under `/CookCap`. Gallery ≠ live alone.

---

## Automated gates

| Check | Expected | Pass |
|-------|----------|------|
| `npm run typecheck` | 0 errors | Required |
| `npm run gate:recipes` | **790** recipes linked | Required |
| `npm run gate:anti-2d` | 3D + wood + paper tabs | Required |
| `npm run gate:wood` | Stage wood DOM + 4 skins + phone | Required |
| `npm run smoke:product` | S1–S7 + viewports | Required |
| CI Pages deploy | success after push | Required |

### Smoke IDs

| ID | Expected |
|----|----------|
| S1 | Footer `n / total` |
| S2 | `.book-frame` present |
| S3 | Search control ≥44×44 |
| S4 | Shopping before Change book name |
| S5 | About & data last in ··· |
| S6 | Phone Search ≥44×44 |
| S7 | No third-party runtime fetch |

---

## Feature verification (3.0 → 3.2)

| Area | Expected | Status |
|------|----------|--------|
| Guacamole hero | Guacamole photo, not samosas | Shipped 3.0.1 |
| Footer Home | Goes to leaf 0 | Shipped 3.1.0 |
| ±5 jump | Moves index ±5 clamped | Shipped 3.1.0 |
| Scrub slider | `input[type=range].page-scrub` | Shipped 3.1.0 |
| Go-to page | Tap count → dialog → Go | Shipped 3.1.0 |
| Wooden stage | `backgroundImage` gradient/url | Shipped 3.2.0 |
| Paper tabs on wood | Cream face + ink AA | Shipped 3.2.0 |
| Phone wood frame | Desk/chrome wood tint | Shipped 3.2.0 |
| World table | ~790 catalog, chapters restored | Shipped 3.2.0 |
| Even paper wash | Dark leaves one tone, no band | Shipped 3.3.0 |
| Smart search | “30 min yogurt” hint | Shipped 3.0.0 |
| Guest PIN | Locks writes | Shipped 3.0.0 |
| Merge restore | Checkbox in About | Shipped 3.0.0 |
| Print | Recipe + Favorites Print | Shipped 3.0.0 |

---

## Manual / persona

| Persona | Flow |
|---------|------|
| First-run | Dresser → name → cover |
| Cook | Start cooking → mise → timer → done |
| Host | Guest PIN → browse → Exit |
| Planner | Occasions rail → week template |
| Searcher | Smart phrase + ★ filter |

---

## Gallery regen

```bash
npm run pages:build
mkdir -p /tmp/gal-root && ln -sfn "$PWD/out" /tmp/gal-root/CookCap
python3 -m http.server 3456 --directory /tmp/gal-root
GALLERY_URL=http://127.0.0.1:3456/CookCap npm run gallery
```
