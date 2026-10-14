# CookCap — Perfection v3 MATRIX
Columns: {light, dark} × {iPhone SE 375, iPhone 390, iPad P 820, iPad L 1180, Mac 1440, wide 1920} × {WebKit, Chromium}  
Cells: ✅ path · ⏳ pending · N/A reason · ❌ fail  

Wave A focus rows (P0/P1). Full matrix filled in phases C–F.

## Priority — demo home (`/?demo=1`)

| Screen | State | L·iPhone·WK | L·iPhone·Cr | D·iPhone·WK | Notes |
|---|---|---|---|---|---|
| S-cover | demo | ⏳ device/ | ⏳ | ⏳ | CK-V3-1 hydration gate |
| S-contents | demo | ⏳ | ⏳ | ⏳ | Ideas after mount |
| S-recipe | demo | ⏳ | ⏳ | ⏳ | LH route |
| S-cooking | demo | ⏳ | ⏳ | ⏳ | LH route |
| S-namegate | first-run | ⏳ | ⏳ | ⏳ | CK-V3-2 inputs |

## Device-qa rollup (local `out/` @ `/CookCap/?demo=1`, 2026-10-14)
| Run | Path | Hard | tap&lt;32 | text&lt;11 | pageerrors |
|---|---|---|---|---|---|
| Baseline | `qa/perfection/baseline/` | **0**/7 | 0 | 0 | **0** |
| Post-fix | `qa/perfection/device/` | **0**/7 | 1 soft (chromium android INPUT; flaky under socket resets) | 0 | **0** |

Chromium soft console = `ERR_CONNECTION_RESET` from local static server under parallel load — not app pageerrors. WebKit 5/5 clean both runs.

Full inventory × theme × device grid expands after Auditor verifies Wave A.
