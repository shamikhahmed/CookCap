# CookCap v2.6.0 — Performance Budgets

**Version:** 2.6.0 · **SW:** `cookcap-v27` · **Deploy:** GitHub Pages `/CookCap/`  
**Catalog:** **~221** recipes

---

## Budgets + measured

| Metric | Budget | Measured (this pass) | Status |
|--------|--------|----------------------|--------|
| First Load JS (route `/`) | monitor | drawer code-split (dynamic) | OK |
| Recipe DOM mount | **≤12** `data-leaf-scroll` | WarmLeafPool | **PASS** |
| Never mount all recipes | Hard | WarmLeafPool | **PASS** |
| Chapter list rows | **≤24** + more | ChapterLeaf | OK |
| Search debounce | **120 ms** | search.ts | OK |
| CookingMode timers | 1 interval / open | fixed 2.4.6 | OK |
| Longtask flip (headless) | advisory ≤50 / soft ≤170 | Motion curl often 50–170 | Advisory |
| Longtask flip (real device) | **≤50 ms** | verify phone GPU | Target |
| Anti-2D + linkage + smoke | Must PASS | CI | Required |

---

## Architecture guards

```ts
const FULL_OFFSETS = [-1, 1];
const SHELL_OFFSETS = [-3, -2, 2, 3, 4];
```

`remapLeafIndex` on mode/leaves change. AssetPreloader skips missing heroes.  
Shell drawers/modals = `next/dynamic` (ssr:false) — load on open.  
SW update: toast → Reload (no silent skipWaiting while active controller).

```bash
npm run measure:perf   # hard fail if mountedLeaves > 12
```
