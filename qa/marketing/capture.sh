#!/usr/bin/env bash
# CookCap marketing capture — run OUTSIDE the agent sandbox (needs browser + local ports).
# Usage: bash qa/marketing/capture.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PORT="${MARKETING_PORT:-}"
if [[ -z "$PORT" ]]; then
  for p in $(seq 8920 8929); do
    if ! lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
      PORT="$p"
      break
    fi
  done
fi
if [[ -z "${PORT:-}" ]]; then
  echo "No free port in 8920–8929" >&2
  exit 1
fi

echo "== CookCap marketing capture =="
echo "ROOT=$ROOT"
echo "PORT=$PORT"

if [[ ! -d node_modules ]]; then
  echo "node_modules missing — install deps locally first (no network install from this script)." >&2
  exit 1
fi

echo "== pages:build =="
NEXT_PUBLIC_BASE_PATH=/CookCap npm run build

GAL_ROOT="$(mktemp -d /tmp/cookcap-mkt-XXXX)"
ln -sfn "$ROOT/out" "$GAL_ROOT/CookCap"
cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$GAL_ROOT"
}
trap cleanup EXIT

echo "== serve $GAL_ROOT on :$PORT =="
python3 -m http.server "$PORT" --directory "$GAL_ROOT" >/tmp/cookcap-mkt-http.log 2>&1 &
SERVER_PID=$!
sleep 1

BASE="http://127.0.0.1:${PORT}/CookCap"
for i in $(seq 1 30); do
  if curl -sf -o /dev/null "$BASE/"; then
    break
  fi
  sleep 0.4
done
curl -sf -o /dev/null "$BASE/" || {
  echo "Server did not become ready. Log:" >&2
  cat /tmp/cookcap-mkt-http.log >&2 || true
  exit 1
}

mkdir -p qa/marketing/shots qa/marketing/appstore qa/marketing/walkthrough

echo "== playwright capture =="
export GALLERY_URL="$BASE"
node qa/marketing/capture.mjs

echo ""
echo "== done =="
echo "Summary: qa/marketing/SUMMARY.md"
echo "Shots:   qa/marketing/shots/{light,dark}/{iphone,ipad,mac}/"
echo "AppStore:qa/marketing/appstore/"
echo "Video:   public/site/walkthrough.{mp4,webm} + poster + vtt"
if [[ -f qa/marketing/SUMMARY.md ]]; then
  echo ""
  sed -n '1,40p' qa/marketing/SUMMARY.md
fi
