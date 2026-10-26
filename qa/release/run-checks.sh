#!/usr/bin/env bash
# CookCap release gate — run from repo root OUTSIDE the Cursor sandbox when
# browser steps are required. Static hig-guards runs first (no browser).
#
# Usage: bash qa/release/run-checks.sh
# Writes: qa/release/logs/*  and  qa/release/SUMMARY.md
# Exit: non-zero if any step FAIL.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

EXPECT_VER="$(node -e "console.log(JSON.parse(require('fs').readFileSync('VERSION.json','utf8')).version)")"
EXPECT_SW="$(node -e "console.log(JSON.parse(require('fs').readFileSync('VERSION.json','utf8')).swCache)")"
LOGS="qa/release/logs"
SUMMARY="qa/release/SUMMARY.md"

mkdir -p "$LOGS"

declare -a STEPS=()
declare -a STATUSES=()
declare -a DETAILS=()

record() {
  STEPS+=("$1")
  STATUSES+=("$2")
  DETAILS+=("$3")
  printf '%s  %s  %s\n' "$2" "$1" "$3"
}

run_logged() {
  local name="$1"
  local logfile="$2"
  shift 2
  set +e
  "$@" >"$logfile" 2>&1
  local rc=$?
  set -e
  return "$rc"
}

# ── 0. HIG standing rules (static, no browser) ───────────────────────────────
if run_logged "hig-guards" "$LOGS/00-hig-guards.log" node scripts/hig-guards.mjs; then
  record "hig-guards (standing rules 1–4)" "PASS" "ok"
else
  record "hig-guards (standing rules 1–4)" "FAIL" "see $LOGS/00-hig-guards.log"
fi

# ── 1. Lint / typecheck / build (sandbox-safe) ───────────────────────────────
if run_logged "lint" "$LOGS/01-lint.log" npm run lint; then
  record "lint" "PASS" "ok"
else
  record "lint" "FAIL" "see $LOGS/01-lint.log"
fi

if run_logged "typecheck" "$LOGS/02-typecheck.log" npm run typecheck; then
  record "typecheck" "PASS" "ok"
else
  record "typecheck" "FAIL" "see $LOGS/02-typecheck.log"
fi

if run_logged "build" "$LOGS/03-build.log" npm run build; then
  record "build" "PASS" "ok"
else
  record "build" "FAIL" "see $LOGS/03-build.log"
fi

# ── 2. Version coherence ─────────────────────────────────────────────────────
set +e
VER_MSG=$(node -e "
const fs=require('fs');
const v=JSON.parse(fs.readFileSync('VERSION.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const sw=fs.readFileSync('public/sw.js','utf8');
const hits=[];
if (v.version !== process.argv[1]) hits.push('VERSION.json.version');
if (pkg.version && pkg.version !== v.version) hits.push('package.json.version='+pkg.version);
if (!sw.includes(v.swCache)) hits.push('public/sw.js missing '+v.swCache);
if (hits.length) { console.log(hits.join('; ')); process.exit(1); }
console.log(v.version+' / '+v.swCache);
" "$EXPECT_VER")
VER_RC=$?
set -e
if [[ "$VER_RC" -eq 0 ]]; then
  record "version coherence" "PASS" "$VER_MSG"
else
  record "version coherence" "FAIL" "$VER_MSG (expect $EXPECT_VER / $EXPECT_SW)"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
{
  echo "# CookCap release checks"
  echo
  echo "Expect: **${EXPECT_VER}** / SW \`${EXPECT_SW}\`"
  echo
  echo "| Step | Status | Detail |"
  echo "| --- | --- | --- |"
  for i in "${!STEPS[@]}"; do
    echo "| ${STEPS[$i]} | ${STATUSES[$i]} | ${DETAILS[$i]} |"
  done
} >"$SUMMARY"

FAIL=0
for s in "${STATUSES[@]}"; do
  if [[ "$s" != "PASS" ]]; then FAIL=1; fi
done
exit "$FAIL"
