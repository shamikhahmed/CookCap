#!/usr/bin/env bash
# Round-2 prod-ready reshoot — serve out/ then capture qa/prod-ready/shots.
# Ports 8920–8929. No network installs. Reviewer: run from repo root after build.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${1:-8923}"
if [[ ! -d out ]]; then
  echo "out/ missing — run: npm run build" >&2
  exit 1
fi
python3 -m http.server "$PORT" --directory out >/tmp/cookcap-prod-ready-http.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT
sleep 0.6
node scripts/prod-ready-audit.mjs "http://127.0.0.1:${PORT}/"
echo "Shots → qa/prod-ready/shots/  log → qa/prod-ready/audit-log.json"
