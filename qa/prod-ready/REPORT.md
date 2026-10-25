# CookCap — Production-readiness A–Z (`design/hig-3`)

**Date:** 2026-10-25  
**App version:** 3.7.6 · **SW:** `cookcap-v376`  
**Browser under test:** Chromium with iPhone 15 Pro device metrics (WebKit not launched in this environment; reviewer re-runs WebKit).  
**Server:** `python3 -m http.server` on ports 8920–8922 serving `out/` (no network installs).

## Summary table

| | Area | Status | Evidence |
|---|---|---|---|
| A | Build & gates | **PASS** | `npm run build` green; lint warnings only (pre-existing hooks); `tsc --noEmit` green; `test:e2e` 1 passed; VERSION.json ↔ public ↔ out ↔ `version.ts` ↔ `sw.js` coherent at 3.7.6 / v376 |
| B | Screen inventory | **PASS** | `qa/prod-ready/INVENTORY.md` from Shell / BookController / drawers (not guesses) |
| C | Visual pass | **FIXED** | Reviewer dark chrome / cover foil / cuisine fixed; shots `shots/after-contrast-*.png`, `leaf-*-light.png`, `ipad-cover-light.png`, `desktop-cover-light.png`. Leaf `[data-leaf-scroll]` intentional |
| D | Interaction | **PASS*** | Search overlay OK; shop/about open (audit close locator was ambiguous — Escape/Done work in UI). 0 console / page errors in audit |
| E | Core flows | **PASS*** | Demo path + fresh dresser first-run shot; e2e name→contents→recipe→shop; persistence via existing IDB suite. Full 500-item edge not re-run this pass |
| F | iPhone behaviour | **PASS** | `scripts/ios-behaviour-check.mjs` → **15 PASS / 0 FAIL** (`qa/prod-ready/ios-check.txt`) |
| G | Accessibility | **FIXED** | axe serious/critical → **0** on cover (was page-bar 4.49:1). Dark recipe axe 0. Hero cuisine lifted. Cover foil AA measured |
| H | PWA / offline | **PASS** | Manifest name/icons/maskable/theme; SW no auto skipWaiting/claim; offline reload showed desk (`audit-log.json` offline.ok) |
| I | Performance | **PASS*** | Tokens unlayered render-blocking; no double giant CSS found; cold LCP not Lighthouse-scored this pass (no fake scores) |
| J | Robustness / privacy | **PASS*** | Local-only; themeInit / no secrets in repo; `dangerouslySetInnerHTML` only theme boot + SVG hero generator (seeded, not user HTML). No unexpected hosts in shell (recipe media same-origin) |
| K | Content | **PASS*** | Demo labelled via `?demo=1`; no lorem in chrome; WhatsNew 3.7.6 notes |
| L | Docs | **PASS** | README / HANDOVER / CHANGELOG / DESIGN.md synced to 3.7.6 |

\* Spot-checked with automated sweep + existing e2e; not every drawer × every viewport manually photographed (shot budget ≤40).

## Reviewer defects (priority) — fixed

| Severity | Screen | Cause | Fix commit |
|---|---|---|---|
| High | Dark header + page bar | Theme=`system` left `data-theme` unset; unlayered light HIG tokens (`:not([data-theme=dark])`) forced black `--label` / ink onto night paper | `c216866` `fix(a11y): dark chrome + cover foil + hero cuisine contrast` |
| High | Cover foil small text | Opacity 0.55–0.7 + bright champagne stops on cream parchment (~2:1) | same + solid `--color-gold-text` on light |
| Medium | Recipe cuisine on scrim | Raw chapter.tab green `#4f7a4a` on photo | `color-mix(… 28%, white)` + text-shadow |
| Medium | Page bar Tabs / 1÷N (light) | `--label-2` on warm glass = **4.49:1** (axe serious) | footer chrome → `--label` (this commit) |

## Other defects found

| Severity | Screen | Cause | Fix / status |
|---|---|---|---|
| High | `out/VERSION.json` stale 3.7.4 | `public/VERSION.json` not synced with root | Synced; bump 3.7.6 |
| Low | Audit script shop close | `/done/i` matched “Mark step 1 done” behind sheet | Script issue; app Done/Cancel OK — noted, not an app FAIL |

## Test counts

| Suite | Before (branch start) | After |
|---|---|---|
| Playwright e2e `finish.spec.ts` | 1 passed | 1 passed |
| ios-behaviour-check | 15 PASS (post HIG height fix) | 15 PASS |
| axe serious/critical (cover light) | 2 (page bar) | **0** |

## Commits on `design/hig-3` (this audit)

1. `c216866` — dark chrome + cover foil + hero cuisine contrast  
2. *(pending)* — page-bar AA, VERSION 3.7.6, docs, REPORT

## Remaining FAIL / gaps

- WebKit not executed here (Chromium iPhone metrics only).  
- Not every inventory overlay photographed at every breakpoint.  
- Lighthouse not run (no fabricated scores).  
- Leaf inner scrollers remain (documented intentional PASS).

## Shots (`qa/prod-ready/shots/`)

Representative after-fix + audit set (compressed ≈780px wide). Prefer `after-contrast-*` for reviewer defects.
