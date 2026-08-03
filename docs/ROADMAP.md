# CookCap roadmap

Master phase map. **Icebox ≠ promise.** One phase per train.

Live: https://shamikhahmed.github.io/CookCap/

## Pillar scorecard (after 3.0.0)

| Pillar | Score 1–5 | Note |
|--------|-----------|------|
| First minute | 4 | Splash + name gate + what’s new |
| Book object | 4 | Desk + motion |
| Recipe clarity | 5 | Serve with + cook ritual + print + swaps |
| Personal kitchen | 5 | Photos, fork, collections, merge backup, guest PIN |
| Quiet craft | 4 | Tokens |
| Trust | 5 | Local-only + SECURITY hard nos |
| Speed & calm | 4 | Dynamic drawers / offline chip |
| Discoverability | 5 | Occasions + smart search + PWA shortcuts |

**Next slice:** polish only — or revisit hard nos if product asks.

## Phases

| ID | Name | Status |
|----|------|--------|
| **P0–P4** | Craft → perf | **Shipped ≤2.6.0** |
| **P5** | Cook ritual | **Shipped 2.7.0** |
| **P6** | Data power | **Shipped 2.7.0** |
| **P7** | Content (pickles / related) | **Shipped 3.0.0** |
| **P8** | PWA (shortcuts, share-target, print) | **Shipped 3.0.0** |
| **P9** | Smart Assistant (search + swaps + party scale) | **Shipped 3.0.0** |
| **P10** | Occasions | **Shipped 3.0.0** |
| **P11** | i18n stub (EN / Roman Urdu) | **Shipped 3.0.0** |
| **P12** | Print / chapbook CSS | **Shipped 3.0.0** |
| **P13** | Multi-device (merge backup + guest PIN) | **Shipped 3.0.0** |
| **P14** | Harden (EXIF strip + SECURITY) | **Shipped 3.0.0** |
| **P15** | Hard nos | **Documented only** — see below |

## P15 — Hard nos (do not build)

1. **Cloud sync / accounts** — encrypted multi-device sync stays out unless product reopens.
2. **Real LLM** — no generative chef; rules-based Smart Assistant only.
3. **AR cook mode** — no camera overlays.

See `docs/SECURITY.md`.

## Guardrails

local-only · offline-first · honest food photos · no fake AI · book-first · WarmLeafPool · hero lock · user media in IDB only
