# CookCap v2.4.5 — QA Matrix

**Live:** https://shamikhahmed.github.io/CookCap/ · **SW:** `cookcap-v24`  
**Evidence dirs:** `docs/gallery/checkpoints/`

> Prove by gates + smoke against served `out/`. Gallery ≠ live alone.

---

## Automated gates (this pass)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| `npm run typecheck` | 0 errors | clean | **PASS** |
| `npm run lint` | 0 warnings | clean | **PASS** |
| `npm run gate:recipes` | 215 recipes linked | 215 / 5 files | **PASS** |
| `npm run gate:anti-2d` | 3D + wood + paper tabs | GATE PASS | **PASS** |
| `npm run smoke:product` | S1–S7 | SMOKE PASS | **PASS** |
| `npm run measure:perf` | mountedLeaves ≤12 | mountedLeaves=5 | **PASS** |
| CI Pages | build+deploy | workflow | VERIFY after push |

### Smoke detail (`smoke-product-report.json`)

| ID | Expected | Result |
|----|----------|--------|
| S1 | Footer `n / total` | PASS |
| S2 | `.book-frame` present | PASS |
| S3 | Search control ≥44×44 | PASS 44×44 |
| S4 | Shopping before Change book name | PASS |
| S5 | About & data last in ··· menu | PASS |
| S6 | Phone Search ≥44×44 | PASS |
| S7 | No third-party runtime fetch | PASS none |

---

## Manual / persona (spot)

| Persona | Flow | Status |
|---------|------|--------|
| First-timer | Splash → dresser/simple → cover → flip | VERIFY on device after SW update |
| Power user | ⌘K ★ filter · mode switch · planner | VERIFY |
| Reduced-motion | Simple onboard, no dresser SFX | VERIFY (`prefers-reduced-motion`) |
| Offline | Load once, kill network, read/fav | VERIFY |

---

## Appendix skips

| Appendix | Status |
|----------|--------|
| E Auth | SKIP — no accounts |
| I Push notifications | SKIP — none |
| J i18n/RTL | SKIP — English UI |

---

```bash
NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
# serve out under /CookCap
GATE_URL=… npm run gate:anti-2d
GATE_URL=… npm run smoke:product
npm run measure:perf
```
