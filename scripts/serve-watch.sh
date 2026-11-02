#!/bin/bash
# Restarting wrapper around scripts/serve.py.
#
# The plain `while true; do python3 scripts/serve.py 8080; sleep 1; done` loop this
# replaces healed a crash so quickly that the drop was invisible: the server was back
# before anything looked at it, the HTTP log held no gap, and every symptom read as
# "the app is intermittently broken" — which is a much worse thing to debug than a
# server that plainly dies and says why.
#
# It cost real time. A navigation failure was blamed on the browser tool several times
# over, when the accurate reading was that the host was down for that instant. This
# logs every start, the uptime before exit, and the exit code, so a drop is a visible
# line in the log rather than a ghost.
#
# Usage:
#     scripts/serve-watch.sh [port]
#
# Log: <opencode root>/.tmp/seclusa-serve.log   (override with SECLUSA_SERVE_LOG)

set -u

cd "$(dirname "$0")/.." || exit 1

PORT="${1:-8080}"

# The workspace rule is that scratch and logs live in the opencode root's .tmp, so
# resolve that by walking up from this script rather than hardcoding a path that is
# only right for one project. Previously this defaulted to /tmp/opencode, which is
# outside the allowed area entirely and is refused rather than merely discouraged.
find_tmp_dir() {
    local dir
    dir="$(pwd)"
    for _ in 1 2 3 4; do
        if [ -d "$dir/.tmp" ]; then
            printf '%s\n' "$dir/.tmp"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

if [ -n "${SECLUSA_SERVE_LOG:-}" ]; then
    LOG="$SECLUSA_SERVE_LOG"
elif LOG="$(find_tmp_dir)"; then
    LOG="$LOG/seclusa-serve.log"
else
    echo "no .tmp directory found above $(pwd) — set SECLUSA_SERVE_LOG to a log path" >&2
    exit 1
fi

mkdir -p "$(dirname "$LOG")"
touch "$LOG"

stamp() { date '+%Y-%m-%d %H:%M:%S'; }

echo "[$(stamp)] ---- watcher started, port $PORT, log $LOG ----" >> "$LOG"

while true; do
    start=$(date +%s)
    echo "[$(stamp)] server starting" >> "$LOG"

    # -u so each request line is written as it happens rather than buffered, and a
    # prefix so every line in the log carries a timestamp. Without -u the log lags
    # behind reality, which is its own kind of ghost.
    python3 scripts/serve.py "$PORT" 2>&1 \
        | while IFS= read -r line; do
              echo "[$(stamp)] $line" >> "$LOG"
          done

    code=${PIPESTATUS[0]}
    uptime=$(( $(date +%s) - start ))

    if [ "$code" -eq 0 ]; then
        echo "[$(stamp)] server exited cleanly after ${uptime}s - restarting in 1s" >> "$LOG"
    else
        echo "[$(stamp)] *** server CRASHED (exit $code) after ${uptime}s - restarting in 1s ***" >> "$LOG"
    fi

    sleep 1
done