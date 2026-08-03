# CookCap v3.3.1 — Performance Budgets

**Version:** 3.3.1 · **SW:** `cookcap-v35` · **Deploy:** GitHub Pages `/CookCap/`  
**Catalog:** **790** recipes

---

## Budgets + measured

| Metric | Budget | Status |
|--------|--------|--------|
| First Load JS (route `/`) | monitor | Drawer code-split OK; catalog larger — watch |
| Recipe DOM mount | **≤12** `data-leaf-scroll` | WarmLeafPool **PASS** |
| Never mount all recipes | Hard | **PASS** |
| Chapter list rows | **≤24** + more | OK |
| Search debounce | **120 ms** | OK |
| CookingMode timers | 1 interval / open | OK |
| Longtask flip (headless) | advisory ≤50 / soft ≤170 | Advisory |
| Longtask flip (real device) | **≤50 ms** | Target |
| Anti-2D + wood + linkage + smoke | Must PASS | CI Required |

---

## Architecture guards

```ts
const FULL_OFFSETS = [-1, 1];
const SHELL_OFFSETS = [-3, -2, 2, 3, 4];
```

`remapLeafIndex` on mode/leaves change.  
Shell drawers/modals = `next/dynamic` (ssr:false).  
SW update: toast → Reload (no silent skipWaiting while browsing).  
Footer scrubber calls `goToLeaf` — keep WarmLeafPool; do not expand mount window.

```bash
npm run measure:perf   # hard fail if mountedLeaves > 12
```
