# CookCap v2.3.0 — Performance Budgets

**Version:** 2.3.0 · **SW:** `cookcap-v16` · **Deploy:** GitHub Pages `/CookCap/`  
**Catalog:** **782** recipes · no pork · max chapter share desserts

---

## Budgets

| Metric | Budget | Status (2026-08-02) |
|--------|--------|---------------------|
| Recipe DOM mount | **≤12** `data-leaf-scroll` | **9** (1 active + 2 full prefetch + 5 shell + misc) |
| Never mount all 956 | Hard | WarmLeafPool + deferred recipe body |
| Chapter list rows | **≤24** + “and N more” | `ChapterLeaf.tsx` |
| Search | Indexed haystack + **120 ms** debounce | `search.ts` / `SearchOverlay` |
| Longtask (real device) | **≤50 ms** on flip / hop / search | Target; verify on phone GPU |
| Longtask (headless probe) | Advisory | Max ~128 ms Motion curl — see `docs/perf-956.json` |
| First Load JS | Catalog-in-bundle | **~818 kB** — recipes are data, not code-split JSON |
| Asset warm | SW full list + decode **±12** leaves | Not all-956 main-thread decode |
| Anti-2D + linkage | Must PASS | `gate:anti-2d` · `gate:recipes` |

---

## Architecture guards (do not regress)

### WarmLeafPool

```ts
const FULL_OFFSETS = [-1, 1];      // full RecipeContent (prefetch, silent)
const SHELL_OFFSETS = [-3, -2, 2, 3, 4]; // WarmRecipeShell (hero only)
```

### AssetPreloader

- Service worker: queue all hero URLs (`CACHE_URLS`)
- Main thread: decode only ±12 around current index, concurrency 3, yield between loads

### Search

- Precomputed title / haystack / ingredients index (no per-keystroke joins)
- UI debounce 120 ms; results capped at 24

### Bundle honesty

First Load JS ~818 kB includes the full recipe catalog in the client graph. Tree-shaking does not split recipe arrays. Acceptable for offline-first PWA; future escape hatch = chunked `fetch` JSON if Pages budget tightens.

---

## Measure

```bash
NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
npm run measure:perf956   # → docs/perf-956.json
```

Hard fail = `mountedLeaves > 12`. Longtasks logged as advisory under headless Chromium.

### Memory

DOM node count stays flat across long flip sessions — pool size bounded; shells replace full neighbors outside ±1.

---

## Chapter balance (post-rebalance)

| Chapter | Count | Share |
|---------|------:|------:|
| desserts | 188 | 19.6% |
| snacks | 124 | 12.9% |
| world | 119 | 12.4% |
| vegetarian | 96 | 10.0% |
| chinese | 90 | 9.4% |
| european | 87 | 9.1% |
| pakistani | 64 | 6.7% |
| meals | 62 | 6.5% |
| italian | 34 | 3.6% |
| breads | 25 | 2.6% |
| baking | 20 | 2.1% |
| breakfast | 16 | 1.7% |
| tips | 15 | 1.6% |
| coffee | 8 | 0.8% |
| favorites | 8 | 0.8% |

`meals` = fallback only. Mapper: `src/lib/recipes/chapterMap.ts` · re-run: `npm run rebalance:mealdb`

---

*Perf is a guardrail, not a vanity metric. Regressions block ship.*
