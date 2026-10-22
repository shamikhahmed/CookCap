# CookCap — iOS simulator pass (v7 §7.4)

Date: 2026-10-22 · Capacitor/PWA · Safari via simctl openurl

## Devices (one at a time)

| Device | Light | Dark | Larger Text AX3 | VoiceOver (10 controls) |
|---|---|---|---|---|
| iPhone SE (3rd gen) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPhone 16 Pro | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPad Air 11" (M2) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |

## Evidence (gitignored)

Screenshots: `CookCap/build/qa/v7/sim/*.png` (9 PNGs)
Run log: `CookCap/build/qa/v7/sim/sim-run.jsonl`
Script: `capricorn-tooling/scripts/v7-sim-pass.mjs` + `run-v7-sim-fleet.sh`

## VoiceOver spot-check (honest — live page a11y tree / aria labels)

Native VoiceOver not automated in CI; labels pulled from live demo via Playwright accessibility tree (https://shamikhahmed.github.io/CookCap/).

| # | Role | Label |
|---|---|---|
| 1 | `button` | Got it |
| 2 | `button` | Mode — Reader |
| 3 | `button` | Search recipes |
| 4 | `button` | Appearance |
| 5 | `button` | Shopping list |
| 6 | `button` | More |
| 7 | `button` | Cook thisCrispy Spring RollsMidday plate that won’t put you to sleep. |
| 8 | `button` | Or thisRisotto alla MilaneseMidday plate that won’t put you to sleep. |
| 9 | `button` | Or save for SundayZaffarani Biryani (Chicken)Midday plate that won’t put you to |
| 10 | `button` | Fruit Chaat |

## Notes

- Demo URL: `https://shamikhahmed.github.io/CookCap/`
- Matrix: 3 devices × light / dark / Larger Text AX3 (`--larger-text`).
- Dynamic Type AX3 via Simulator Accessibility prefs; appearance via `simctl ui`.
