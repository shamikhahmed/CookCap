#!/usr/bin/env bash
# Re-run Lighthouse on landing.html; print the four category scores.
# Reviewer runs outside the Cursor sandbox (needs Chrome + npx lighthouse).
#
# Usage: bash qa/marketing/lighthouse.sh
# Optional: CC_MARKETING_PORT=8920 CC_MARKETING_LANDING=http://127.0.0.1:8920/CookCap/landing.html
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PORT="${CC_MARKETING_PORT:-8920}"
# Prefer basePath-aware URL when serving `out/` as /CookCap; fall back to public/
LANDING="${CC_MARKETING_LANDING:-}"
OUT_DIR="$ROOT/qa/marketing/lighthouse"
JSON_OUT="$OUT_DIR/landing.report.json"
mkdir -p "$OUT_DIR"

STARTED_SERVER=0
SERVE_PID=""
cleanup() { if [[ -n "${SERVE_PID}" ]]; then kill "$SERVE_PID" 2>/dev/null || true; fi; }
trap cleanup EXIT

serve_dir() {
  local dir="$1"
  (cd "$dir" && python3 -m http.server "$PORT") >/tmp/cookcap-lighthouse-serve.log 2>&1 &
  SERVE_PID=$!
  STARTED_SERVER=1
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if curl -sf "http://127.0.0.1:${PORT}/landing.html" >/dev/null 2>&1 \
      || curl -sf "http://127.0.0.1:${PORT}/CookCap/landing.html" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.3
  done
  return 1
}

if [[ -z "$LANDING" ]]; then
  if curl -sf "http://127.0.0.1:${PORT}/CookCap/landing.html" >/dev/null 2>&1; then
    LANDING="http://127.0.0.1:${PORT}/CookCap/landing.html"
  elif curl -sf "http://127.0.0.1:${PORT}/landing.html" >/dev/null 2>&1; then
    LANDING="http://127.0.0.1:${PORT}/landing.html"
  else
    # Serve public/ at root (landing.html + site/)
    serve_dir "$ROOT/public" || { echo "ERROR: could not start http.server on :${PORT}" >&2; exit 1; }
    LANDING="http://127.0.0.1:${PORT}/landing.html"
  fi
fi

if ! npx --offline lighthouse --version >/dev/null 2>&1; then
  echo "ERROR: npx lighthouse not available offline (npm ci first)" >&2
  exit 1
fi

npx --offline lighthouse "$LANDING" \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile \
  --screenEmulation.mobile \
  --chrome-flags="--headless --no-sandbox" \
  --output=json \
  --output-path="$JSON_OUT" \
  --quiet

# Also keep HTML report beside JSON when lighthouse supports dual output via second run skip —
# reviewer can open landing.report.json; HTML from capture remains optional.

node -e "
const j=require(process.argv[1]);
const cats=j.categories||{};
const order=['performance','accessibility','best-practices','seo'];
const scores={};
for (const k of order) scores[k]=Math.round((cats[k]?.score||0)*100);
console.log('Lighthouse (mobile) ' + process.argv[2]);
console.log(JSON.stringify(scores));
console.log(
  'performance ' + scores.performance +
  '  accessibility ' + scores.accessibility +
  '  best-practices ' + scores['best-practices'] +
  '  seo ' + scores.seo
);
const ok = scores.performance >= 95 && scores.accessibility >= 95;
process.exit(ok ? 0 : 2);
" "$JSON_OUT" "$LANDING"
