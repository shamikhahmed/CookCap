# CookCap — Perfection v3 STATE
**Agent:** Builder-CookCap  
**Updated:** 2026-10-14T11:20:00Z  
**Phase:** F (Verify hand-off) — Wave A P0/P1 fixes complete locally  
**Branch:** `perfection/cookcap-v3` @ `aa36490`  
**Base:** `main` @ `c43a70c` (finish/cookcap-stepR already merged — CK-V3-4)  
**Remote:** `origin/perfection/cookcap-v3` pushed (no force)

## What's running
Local prod: `out/` served under `/CookCap/` (basePath).  
`PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core`  
`PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright`

## Last builder commits
- `aa36490` fix(cookcap): Wave A perfection — hydration #418, VERSION.json, tap targets

## FIXED this wave (Builder — not Auditor-verified)
| ID | Fix |
|---|---|
| CK-V3-1 | Client-only kitchen ideas (C-37 retained) + Appearance portal mount gate + suppressHydrationWarning on ideas |
| CK-V3-2 | Remove 1×1 `sr-only` file inputs; NameGate `min-h-11`; page-scrub thumb 32px |
| CK-V3-3 | `public/VERSION.json` → exported to Pages `out/VERSION.json` |
| CK-V3-4 | Already on `main` via Phase 0 merge |
| CK-V3-5 | `screen-gallery.html` installed; manifest `v3` dark prep flag (capture = phase G) |

## Next 3 actions (Auditor)
1. Clean checkout of `perfection/cookcap-v3`; `npm ci`; `NEXT_PUBLIC_BASE_PATH=/CookCap npm run build`
2. Serve `out/` under `/CookCap/`; run device-qa commands below
3. Mark ✅ VERIFIED or reject with evidence paths

## Reproduce current check
```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/CookCap
git checkout perfection/cookcap-v3 && git pull
export PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core
export PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright
npm ci
NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
mkdir -p /tmp/cookcap-root && ln -sfn "$PWD/out" /tmp/cookcap-root/CookCap
python3 -m http.server 8765 --directory /tmp/cookcap-root &
# wait until curl -sf http://127.0.0.1:8765/CookCap/
node ../capricorn-tooling/scripts/device-qa.mjs qa/perfection/device \
  --apps=CookCap --url=CookCap=http://127.0.0.1:8765/CookCap/?demo=1
curl -sf http://127.0.0.1:8765/CookCap/VERSION.json
```

## Evidence
- Baseline: `qa/perfection/baseline/`
- Post-fix device-qa: `qa/perfection/device/`
- Auditor live baseline: `capricorn-tooling/docs/perfection-2026-10/auditor-baseline-live/`
