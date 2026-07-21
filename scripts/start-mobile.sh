#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/mobile"
if [[ ! -d node_modules ]]; then
  npm install
fi

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
SDK="$(node -e "try{console.log(require('expo/package.json').version)}catch(e){console.log('?')}")"
echo "Expo SDK: ${SDK} (store Expo Go expects ~54)"
echo "API URL: ${EXPO_PUBLIC_API_URL:-$(grep EXPO_PUBLIC_API_URL .env 2>/dev/null | cut -d= -f2- || echo unset)}"
echo "LAN IP: ${LAN_IP:-unknown}"
echo ""
echo "Connection mode:"
echo "  Default = tunnel (works even when Wi-Fi blocks phone↔PC)"
echo "  LAN only: EXPO_USE_LAN=1 ./scripts/start-mobile.sh"
echo ""

PORT=8081
if ss -tln 2>/dev/null | grep -q ":${PORT} "; then
  PORT=8082
  echo "Port 8081 busy — using ${PORT}"
fi

if [[ "${EXPO_USE_LAN:-}" == "1" ]]; then
  export REACT_NATIVE_PACKAGER_HOSTNAME="${LAN_IP}"
  exec npx expo start --lan --port "${PORT}" --go -c "$@"
fi

exec npx expo start --tunnel --port "${PORT}" --go -c "$@"
