#!/usr/bin/env bash
# Start the API and the web app for local development (macOS / Linux).
#   ./start-all.sh
# First run creates backend/.venv and installs dependencies. Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d backend/.venv ]; then
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -r backend/requirements-dev.txt
fi
[ -d node_modules ] || npm install

(cd backend && .venv/bin/python run.py) &
API_PID=$!
trap 'kill $API_PID 2>/dev/null' EXIT

echo "API: http://localhost:5001   Web: http://localhost:3000"
npm run dev
