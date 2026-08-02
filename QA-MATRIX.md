# CookCap v2.4.1 — QA Matrix

**Columns:** screen · element · expected · actual · pass/fail  
**Scope:** phone 390 · iPad 768/834 · desktop 1280/1920 · skins · light/dark · reduced-motion  
**Live URL:** https://shamikhahmed.github.io/CookCap/ · **SW:** `cookcap-v20`

> Prove chrome by **DOM geometry**; 3D by anti-2d gate; recipes by `gate:recipes`; keyboard by typing full name on phone. Re-check live after each push — gallery ≠ live proof.

---

## Book & navigation

| Screen | Element | Expected | Pass/Fail |
|--------|---------|----------|-----------|
| Splash | Launch mark | Dissolves when ready + editionReady | VERIFY live |
| Contents | Today’s kitchen + chapters | **One** scroll; kitchen not stuck | VERIFY |
| Mode toggle | Leaf index | Same recipe/chapter after For You insert | VERIFY |
| Search | ★5…★1 chips | Filter by local ratings; empty copy if none | VERIFY |
| Favorites | mdb-* orphans | Scrubbed on load | VERIFY |
| Export | JSON | Includes `mealPlan` | VERIFY |
| Profile delete | Diary | Rows for profile removed | VERIFY |
| IDB fail | Banner | storageError dismissible | VERIFY (simulate) |
| Dresser Escape | Confirm | Confirm before skip | VERIFY |
| CI | Gates | typecheck + gate:recipes + gate:anti-2d | **PASS** in workflow |

---

## Gates (local / CI)

```bash
npm run typecheck
npm run gate:recipes   # 215 recipes
npm run gate:anti-2d
```

---

*Do not rubber-stamp PASS without live DOM or gate output.*
