#!/bin/zsh
# Weekly GSC snapshot + delta report for amily.ai.
# Installed as launchd job ai.amily.gsc-weekly (Mondays 09:30 local;
# launchd fires missed runs on next wake). Logs to ~/Library/Logs/.
set -euo pipefail
REPO="$HOME/Github/amily-ai-website"
PY="$REPO/scripts/.venv/bin/python"
cd "$REPO"
"$PY" scripts/gsc.py pull --days 28
"$PY" scripts/gsc_report.py
