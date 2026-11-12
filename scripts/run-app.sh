#!/usr/bin/env bash
# Start / stop / check the full app (API + web) in the background.
# Used by humans, by the `run-app` skill, and by CI. Idempotent.
#   bash scripts/run-app.sh up|down|status|logs
set -euo pipefail
cd "$(dirname "$0")/.."

API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-5173}"
STATE=".run"
mkdir -p "$STATE"

healthy() { curl -fsS "http://localhost:${WEB_PORT}/api/health" >/dev/null 2>&1; }

case "${1:-status}" in
  up)
    if healthy; then echo "already running → http://localhost:${WEB_PORT}"; exit 0; fi
    nohup npm run dev >"$STATE/app.log" 2>&1 &
    echo $! >"$STATE/app.pid"
    for _ in $(seq 1 60); do
      if healthy; then echo "app up → http://localhost:${WEB_PORT} (logs: $STATE/app.log)"; exit 0; fi
      sleep 1
    done
    echo "app failed to become healthy in 60s; last log lines:" >&2
    tail -n 40 "$STATE/app.log" >&2
    exit 1
    ;;
  down)
    if [[ -f "$STATE/app.pid" ]]; then
      pid=$(cat "$STATE/app.pid")
      pkill -TERM -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
      rm -f "$STATE/app.pid"
    fi
    # Belt and braces: free the ports.
    for p in "$API_PORT" "$WEB_PORT"; do
      fuser -k "${p}/tcp" >/dev/null 2>&1 || true
    done
    echo "app down"
    ;;
  status)
    if healthy; then echo "running → http://localhost:${WEB_PORT}"; else echo "not running"; exit 1; fi
    ;;
  logs)
    tail -n "${2:-80}" "$STATE/app.log"
    ;;
  *)
    echo "usage: $0 up|down|status|logs [n]" >&2; exit 2;;
esac
