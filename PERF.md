# CookCap v2.2.9 — Performance Budgets

**Version:** 2.2.9 · **SW:** `cookcap-v15` · **Deploy:** GitHub Pages `/CookCap/`

---

## Budgets

| Metric | Budget | Rationale |
|--------|--------|-----------|
| Cold-start splash | Real load + **~280 ms min** polish | `Splash.tsx`; **0 ms** under `prefers-reduced-motion` |
| Recipe DOM mount | **≤7 neighbors** off-screen | `WarmLeafPool` — never mount all ~956 leaves |
| Page flip | One curl; **no >50ms longtask** target | Heroes prewarmed; no step-image requests |
| Recipe count | **956** (218 prior + 738 MealDB) | Honest photo-bundled; `gate:recipes` |
| Onboarding reveal | **2760 ms** Part 2 timeline | Reduce → 200 ms |
| Anti-2D + linkage | Must PASS | `gate:anti-2d` · `gate:recipes` |
| Runtime network | **Zero external origins** | Privacy; same-origin + cache only |

---

## Architecture guards (do not regress)

### WarmLeafPool

```ts
const OFFSETS = [-3, -2, -1, 1, 2, 3, 4] as const;
```

Off-screen `LeafView` instances (`passive`) warm DOM + images for flip neighbors without mounting the full book.

### No full recipe mount

- Visible page: one active `LeafView`
- Pool: ±3–4 neighbors
- Images: lazy + `AssetPreloader` for near indices
- **Never** map all recipes to mounted components

### Flip motion

- Physical curl via Motion springs; `--dur-base: 280ms` easing family
- `readMode='fast'` skips animation on long jumps (power-user path)
- `prefers-reduced-motion`: zero-duration transitions; splash skip

### Bundle notes (last Next build)

- App Router static export (`output: 'export'`)
- First Load JS **~316 kB** — acceptable for offline-first PWA with IndexedDB + Motion
- Recipe data tree-shaken per leaf; no single giant import in hot path
- Images `unoptimized` + `withBase()` — trade Next image optimizer for Pages compatibility

---

## Measure guidance

### Splash duration

```js
// After first load, in DevTools console:
sessionStorage.getItem('cookcap-splash-ms')
```

Target: ≥280 ms on fast devices (polish floor); on slow devices = actual ready time (no extra delay beyond floor).

### Flip FPS

1. Chrome DevTools → Performance → record drag flip
2. Expect stable 60 fps on desktop; ≥30 fps on mid Android
3. Fail if long tasks >50 ms during curl

### Bundle size

```bash
npm run build
# Read "First Load JS" line for main route
```

Flag any increase >10 kB without explicit feature justification.

### Lighthouse

```bash
# Desktop + mobile against live URL after push
npx lighthouse https://shamikhahmed.github.io/CookCap/ \
  --preset=desktop --output=json --output-path=docs/lighthouse-desktop.report.json
npx lighthouse https://shamikhahmed.github.io/CookCap/ \
  --output=json --output-path=docs/lighthouse-mobile.report.json
```

Accept SEO <100 while `robots: noindex` remains.

### Memory

1. Chrome → Memory snapshot at cover, mid-book, after 20 flips
2. DOM node count should stay flat (pool size bounded)
3. Fail if detached nodes grow unbounded

### Offline cold cache

1. Load once online → Application → SW `cookcap-v6` active
2. Offline reload — shell + book data from IndexedDB
3. Flip 10 pages — no network waterfall

---

## Prior Lighthouse (live Pages, 2026-08-02)

| Category | Desktop | Notes |
|----------|---------|-------|
| Performance | 96 | Reports: `docs/lighthouse-desktop.report.json` |
| Accessibility | 100 | Dialog focus traps, live regions |
| Best Practices | 96 | HTTPS, no deprecated APIs |
| SEO | 63 | **Intentional** — private family book, `noindex` |

Re-run after v2.2.5 push; update this table if scores shift >3 points.

---

*Perf is a guardrail, not a vanity metric. Regressions block ship.*
