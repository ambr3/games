#!/usr/bin/env bash
# Seclusa Games — run this app's own tests.
#
# The app is its own repository, so its tests run here rather than in the
# website's suite. Two parts:
#
#   1. the header parser in scripts/serve.py, checked against the real files;
#   2. the card and game engine suite, which runs in a real browser because
#      that is the only place the engine's behaviour is real.
#
# Part 2 needs Node and Playwright, which live in the shared toolchain. If
# they are not installed, that is reported and the run fails, rather than
# quietly passing a suite that never ran.
set -euo pipefail
cd "$(dirname "$0")"

echo "→ games tests @ $PWD"

echo "-- header parser --"
python3 scripts/test_serve.py

echo "-- card and game engine --"

WORKSPACE="$(cd ../.. && pwd)"
NODE="$WORKSPACE/tools/nvm/versions/node/v24.21.0/bin/node"
HARNESS="$WORKSPACE/tools/pkg/playwright/run-games-tests.mjs"

if [ ! -x "$NODE" ]; then
  echo "FAIL: node not found at $NODE"
  echo "      the shared toolchain is not installed"
  exit 1
fi
if [ ! -f "$HARNESS" ]; then
  echo "FAIL: playwright harness not found at $HARNESS"
  exit 1
fi

# The suite is a web page, so the app has to be served. Its own server serves
# the app's root, which puts the suite at /games/cards/test/tests.html.
PORT=8123
python3 scripts/serve.py "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

# Wait for the server to answer before pointing the browser at it.
for _ in $(seq 1 50); do
  if curl -sf "http://127.0.0.1:$PORT/games/cards/test/tests.html" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

export PLAYWRIGHT_BROWSERS_PATH="$WORKSPACE/tools/pkg/playwright/browsers"
export GAMES_TEST_BASE="http://127.0.0.1:$PORT"
export GAMES_TEST_URL="/games/cards/test/tests.html"
"$NODE" "$HARNESS"

echo "→ games tests passed"
