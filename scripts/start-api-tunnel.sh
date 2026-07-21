#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${API_PORT:-8001}"
MOBILE_ENV="$ROOT/apps/mobile/.env"
LOG="$ROOT/services/api/lt-api.log"
PIDFILE="$ROOT/services/api/lt-api.pid"

echo "Checking API on port ${PORT}..."
if ! curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
  echo "API is not running. In another terminal run: ./scripts/start-api.sh"
  exit 1
fi

if [[ -f "$PIDFILE" ]]; then
  kill "$(cat "$PIDFILE")" 2>/dev/null || true
  rm -f "$PIDFILE"
fi
pkill -f "localtunnel --port ${PORT}" 2>/dev/null || true
sleep 1

echo "Starting localtunnel for API :${PORT}..."
: >"$LOG"
npx --yes localtunnel --port "${PORT}" >"$LOG" 2>&1 &
echo $! >"$PIDFILE"

URL=""
for _ in $(seq 1 40); do
  sleep 0.5
  URL="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.loca\.lt' "$LOG" | tail -1 || true)"
  if [[ -n "$URL" ]]; then
    break
  fi
done

if [[ -z "$URL" ]]; then
  echo "Failed to get localtunnel URL. See $LOG"
  cat "$LOG" || true
  exit 1
fi

# localtunnel interstitial bypass
HEALTH="$(curl -sf -H 'Bypass-Tunnel-Reminder: true' -H 'User-Agent: ExamChecker/1.0' "${URL}/health" || true)"
if ! echo "$HEALTH" | grep -q '"ok"'; then
  echo "Tunnel URL up but /health failed."
  echo "URL: $URL"
  echo "Body: $HEALTH"
  echo "Tip: open ${URL}/health in a browser once, then retry."
  # still write URL so user can try
fi

if [[ -f "$MOBILE_ENV" ]]; then
  if grep -q '^EXPO_PUBLIC_API_URL=' "$MOBILE_ENV"; then
    sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${URL}|" "$MOBILE_ENV"
  else
    echo "EXPO_PUBLIC_API_URL=${URL}" >>"$MOBILE_ENV"
  fi
else
  echo "EXPO_PUBLIC_API_URL=${URL}" >"$MOBILE_ENV"
fi

echo ""
echo "API public URL: ${URL}"
echo "Health:         ${HEALTH:-'(open URL in browser once if empty)'}"
echo "Updated:        apps/mobile/.env"
echo ""
echo "IMPORTANT — restart Expo (env is baked in at start):"
echo "  Ctrl+C in mobile terminal → ./scripts/start-mobile.sh → scan QR again"
echo ""
