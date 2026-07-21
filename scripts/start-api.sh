#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/services/api"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
# Load .env for PORT if present
PORT=8001
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
  PORT="${API_PORT:-8001}"
fi
echo "Starting Exam Checker API on 0.0.0.0:${PORT}"
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --reload
