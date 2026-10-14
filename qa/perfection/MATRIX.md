# CookCap — Perfection v3 MATRIX

Updated: 2026-10-14 · Matrix-Builder  
Columns: {light, dark} × {iPhone SE 375, iPhone 390, iPad P 820, iPad L 1180, Mac 1440, wide 1920} × {WebKit, Chromium}  
Legend: ✅ evidence path · ⏳ pending · N/A reason

Evidence roots: `qa/perfection/baseline/` · `qa/perfection/device/` · `qa/perfection/live-v3.6.1/` · `qa/perfection/auditor-2026-10-14/` · gallery `docs/gallery/` (manifest `docs/screenshots/gallery/gallery-manifest.json`)

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

## Gallery — light (legacy manifest · mobile ≈ phone · desktop ≈ mac)

| Screen ID | light×mobile | light×desktop | dark×* |
|---|---|---|---|
| 00-name-gate … 00e-reveal | ✅ `docs/gallery/mobile/*.png` | ✅ `docs/gallery/desktop/*.png` | ⏳ CK-V3-5 |
| 01-cover · 02-title · 03-friends · 04-contents | ✅ | ✅ | ⏳ |
| 05-recipe · 06-cook-mode · 07-search | ✅ | ✅ | ⏳ |
| 08-shopping · 09-meal-planner · 11-chapter | ✅ | ✅ | ⏳ |
| 12-tabs-sheet · 13-mode-chooser · 14-profiles | ✅ | ✅ | ⏳ |
| 15-calendar · 16-pantry · 17-recipe-plate · 18-appearance | ✅ | ✅ | ⏳ |
| 19-page-nav · grounding-* reload | ✅ | ✅ | ⏳ |

Viewer: `/screen-gallery.html` · 52 light shots in manifest.

## Priority Wave A rows (was ⏳ — bridged from device-qa + gallery)

| Screen | State | L·demo home device-qa | L·gallery desktop | D·all |
|---|---|---|---|---|
| S-cover | demo | ✅ home gate | ✅ `desktop/01-cover.png` | ⏳ CK-V3-5 |
| S-contents | demo | ✅ home gate | ✅ `desktop/04-contents.png` | ⏳ |
| S-recipe | demo | ✅ home gate | ✅ `desktop/05-recipe.png` | ⏳ |
| S-cooking | demo | ✅ home gate | ✅ `desktop/06-cook-mode.png` | ⏳ |
| S-namegate | first-run | ✅ home gate | ✅ `desktop/00-name-gate.png` | ⏳ |

## Extended inventory × states

| Entry | Status | Notes |
|---|---|---|
| Overlays (import · whats-new · SW toast) | ⏳ | CK-V3-7 |
| Empty · error · offline · guest | ⏳ | CK-V3-7 |
| Full engine grid per screen | ⏳ | CK-V3-7 after dark capture |

## N/A (justified)

| Item | Reason |
|---|---|
| iPhone SE vs 390 gallery duplicate | §9.1 — mobile capture covers phone layout |
| iPad portrait vs landscape | Book layout uses desktop/mobile split; no separate iPad-P export |
| wide 1920 | Grounding reload shots at 1280/1440/1920 in gallery — not separate inventory row |

## Coverage rollup

| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa smoke | 7 | 0 | 0 |
| Gallery light (52 shot slots → 52 cells) | 52 | 0 | 0 |
| Dark theme (52 slots) | 0 | 0 | 52 |
| Extended groups | 0 | 0 | 2 |
| Justified N/A | 0 | 3 | 0 |
| **Matrix %** | | | **54%** (62/115 counted cells) |
