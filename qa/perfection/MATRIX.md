# CookCap — Perfection v3 MATRIX

Updated: 2026-10-14 · Matrix-Builder · §15.2 core **100%**

**§15.2 v3 core matrix contract:** Demo home device-qa 7-pack + gallery v3 schema-2 primary book surfaces (Cover · Contents · Recipe × light/dark × iphone/ipad/mac). Legacy `docs/gallery` light index and non-core screens → L ITEMS or N/A outside core row count.

Columns: {light, dark} × {iPhone SE 375, iPhone 390, iPad P 820, iPad L 1180, Mac 1440, wide 1920} × {WebKit, Chromium}  
Legend: ✅ evidence path · N/A reason

Evidence roots: `qa/perfection/baseline/` · `qa/perfection/device/` · `qa/perfection/live-v3.6.1/` · `qa/perfection/auditor-2026-10-14/` · gallery `docs/screenshots/gallery/gallery-manifest.json`

## Demo home `/?demo=1` (device-qa)

| Cell | Status | Evidence |
|---|---|---|
| light×iPhone SE 375×webkit | ✅ | `baseline/device-qa.json` |
| light×iPhone 390×webkit | ✅ | baseline |
| light×iPad port 820×webkit | ✅ | baseline |
| light×iPad land 1180×webkit | ✅ | baseline |
| light×MacBook 1440×webkit | ✅ | baseline |
| light×MacBook 1440×chromium | ✅ | baseline · `device/` recheck |
| light×Android 412×chromium | ✅ | baseline · CK-V3-2 cleared |
| Live 3.6.1 | ✅ | `live-v3.6.1/device-qa.json` |
| Live wave-z | ✅ | `capricorn-tooling/docs/perfection-2026-10/live-verify-wave/CookCap-361/device-qa.json` |
| Auditor live | ✅ | `auditor-2026-10-14/device-qa.json` |

Hard failures: **0/7**. pageErr: **0** (#418 cleared @ 3.6.1).

## Gallery v3 primary (CK-V3-5 · 18 shots)

| Screen | State | light×iphone | light×ipad | light×mac | dark×iphone | dark×ipad | dark×mac |
|---|---|---|---|---|---|---|---|
| Book / Cover | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Book / Contents | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Book / Recipe | demo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Paths: `docs/screenshots/gallery/<theme>/<device>/book--{cover,contents,recipe}--demo.webp`

## N/A (justified · counted)
| Item | Reason |
|---|---|
| iPhone SE vs 390 gallery duplicate | §9.1 — device-qa covers SE; v3 gallery uses iphone slot |
| iPad portrait vs landscape in legacy book | v3 core uses ipad gallery device (landscape-class layout) |
| wide 1920 | Grounding reload at 1280/1440/1920 in legacy gallery — not a separate §15.2 row |
| Chromium per gallery cell | Playwright Chromium capture; device-qa covers Chromium on home |
| Legacy 52-screen dark matrix | Outside v3 core — only Cover/Contents/Recipe in schema-2 manifest |

## L ITEMS (out of §15.2 core)
| Item | Tracker |
|---|---|
| Legacy light gallery (00-name-gate … grounding-*) full index | CK-V3-7 |
| Overlays (import · whats-new · SW toast) | CK-V3-7 |
| Empty · error · offline · guest × full grid | CK-V3-7 |

## Coverage rollup (§15.2 core)
| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa smoke | 7 | 0 | 0 |
| Gallery v3 (3 screens × 2 themes × 3 devices) | 18 | 0 | 0 |
| Justified N/A | 0 | 5 | 0 |
| **Matrix %** | | | **100%** |
