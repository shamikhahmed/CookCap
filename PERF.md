# CookCap v2.4.5 — Performance Budgets

**Version:** 2.4.5 · **SW:** `cookcap-v24` · **Deploy:** GitHub Pages `/CookCap/`  
**Catalog:** **215** recipes

---

## Budgets + measured

| Metric | Budget | Measured (this pass) | Status |
|--------|--------|----------------------|--------|
| First Load JS (route `/`) | monitor | **328 kB** shared+page | OK |
| Recipe DOM mount | **≤12** `data-leaf-scroll` | **5** (`measure:perf`) | **PASS** |
| Never mount all recipes | Hard | WarmLeafPool | **PASS** |
| Chapter list rows | **≤24** + more | ChapterLeaf | OK |
| Search debounce | **120 ms** | search.ts | OK |
| Longtask flip (headless) | advisory ≤50 / soft ≤170 | 61–152 ms Motion curl | Advisory |
| Longtask flip (real device) | **≤50 ms** | verify phone GPU | Target |
| Anti-2D + linkage + smoke | Must PASS | CI | Required |

---

## Architecture guards

```ts
const FULL_OFFSETS = [-1, 1];
const SHELL_OFFSETS = [-3, -2, 2, 3, 4];
```

`remapLeafIndex` on mode/leaves change. AssetPreloader skips missing heroes.

```bash
npm run measure:perf   # hard fail if mountedLeaves > 12
```
