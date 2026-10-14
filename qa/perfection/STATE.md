# CookCap — Perfection v3 STATE
**Agent:** Builder-CookCap  
**Updated:** 2026-10-14T11:25:00Z  
**Phase:** F (re-hand-off after CK-V3-2 reject)  
**Branch:** `perfection/cookcap-v3` @ `9ff7894`  
**Base:** `main` @ `c43a70c`  
**Remote:** `origin/perfection/cookcap-v3` (no force)

## What's running
Local prod: `out/` under `/CookCap/`.  
`PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core`  
`PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright`

## CK-V3-2 rework (Auditor reject → fix)
- **Reject:** chromium/android `smallTargets: ["INPUT"]` — page-scrub range was ~24px wide under flex shrink.
- **Fix:** `.page-scrub { min-width: 44px }` + label `min-w-11`; hide ±5 jump IconBtns below `sm` so phone footer does not overflow.
- **Evidence:** `qa/perfection/device-ck-v3-2/` — hard=0, tap&lt;32=0, pageErr=0; android scrub measured **120×44**.

## FIXED awaiting Auditor
| ID | Status |
|---|---|
| CK-V3-1 | ✅ VERIFIED (prior) |
| CK-V3-2 | ✅ FIXED (rework) — awaiting re-verify |
| CK-V3-3 | ✅ VERIFIED (prior) |
| CK-V3-4 | ✅ VERIFIED (prior) |
| CK-V3-5 | FIXED (prep) |

## Auditor re-check
```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/CookCap
git fetch && git checkout perfection/cookcap-v3 && git pull
export PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core
export PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright
npm ci
NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
mkdir -p /tmp/cookcap-root && ln -sfn "$PWD/out" /tmp/cookcap-root/CookCap
python3 -m http.server 8877 --directory /tmp/cookcap-root --bind 127.0.0.1 &
node ../capricorn-tooling/scripts/device-qa.mjs qa/perfection/auditor \
  --apps=CookCap '--url=CookCap=http://127.0.0.1:8877/CookCap/?demo=1'
```
Accept CK-V3-2: chromium/android `smallCount` = 0 (no INPUT &lt; 32).
