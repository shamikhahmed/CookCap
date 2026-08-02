# CookCap v2.4.3 — Performance Budgets

**Version:** 2.4.3 · **SW:** `cookcap-v22` · **Deploy:** GitHub Pages `/CookCap/`  
**Catalog:** **215** recipes · family editorial only

---

## Budgets

| Metric | Budget | Status |
|--------|--------|--------|
| Recipe DOM mount | **≤12** `data-leaf-scroll` | WarmLeafPool (1 active + 2 full prefetch + shells) |
| Never mount all recipes | Hard | WarmLeafPool + deferred recipe body |
| Chapter list rows | **≤24** + “and N more” | `ChapterLeaf.tsx` |
| Search | Indexed haystack + **120 ms** debounce + star filters | `search.ts` / `SearchOverlay` |
| Longtask (real device) | **≤50 ms** on flip / hop / search | Target; verify on phone GPU |
| Asset warm | SW manifest heroes only + decode **±12** | Skip missing files |
| Anti-2D + linkage | Must PASS (CI) | `gate:anti-2d` · `gate:recipes` |

---

## Architecture guards (do not regress)

### WarmLeafPool

```ts
const FULL_OFFSETS = [-1, 1];
const SHELL_OFFSETS = [-3, -2, 2, 3, 4];
```

### Mode ↔ index

`remapLeafIndex(prev, index, next)` when leaves change (For You insert/remove).

### AssetPreloader

- Service worker: queue hero URLs present in `images.generated.json` only
- Main thread: decode ±12 around current index

---

## Measure

```bash
NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
npm run measure:perf
```

Hard fail = `mountedLeaves > 12`.

---

*Perf is a guardrail, not a vanity metric. Regressions block ship.*
