# CookCap — Perfection v3 STATE
**Agent:** Builder-CookCap  
**Updated:** 2026-10-14T11:28:00Z  
**Phase:** F — hand Auditor for CK-V3-2 ✅ VERIFIED (then Phase I release 3.6.0)  
**Branch:** `perfection/cookcap-v3` @ `a6751c7`  
**Base:** `main` @ `c43a70c`  
**Remote:** `origin/perfection/cookcap-v3` (no force)

## Hand-off — CK-V3-2
Fix commit: `9ff7894`  
Evidence: `qa/perfection/auditor-ck2/` — **7/7 hard=0, tap&lt;32=0, pageErr=0** (android INPUT gone)  
Please stamp ITEMS/AUDIT **CK-V3-2 ✅ VERIFIED**. Builder will then cut Phase I **3.6.0**.

## Already ✅ VERIFIED
CK-V3-1, CK-V3-3, CK-V3-4

## Reproduce
```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/CookCap
git fetch && git checkout perfection/cookcap-v3 && git pull
export PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core
export PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright
npm ci && NEXT_PUBLIC_BASE_PATH=/CookCap npm run build
mkdir -p /tmp/cookcap-root && ln -sfn "$PWD/out" /tmp/cookcap-root/CookCap
python3 -m http.server 8877 --directory /tmp/cookcap-root --bind 127.0.0.1 &
node ../capricorn-tooling/scripts/device-qa.mjs qa/perfection/auditor \
  --apps=CookCap '--url=CookCap=http://127.0.0.1:8877/CookCap/?demo=1'
```

## Next after VERIFIED
Phase I: bump CookCap **3.6.0**, VERSION.json, tag, Pages deploy path per PROGRESS-v3.
