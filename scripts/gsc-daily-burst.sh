#!/bin/zsh
# Daily GSC burst monitor — runs mornings through 2026-07-10, then removes
# itself. Armed 2026-07-03 after the pricing-alignment title changes on 8
# pages (retro rule: daily position checks for 7 days after title edits).
# Appends a one-line delta to the burst log; full weekly report still runs
# Mondays via ai.amily.gsc-weekly.
set -euo pipefail
REPO="$HOME/Github/amily-ai-website"
PY="$REPO/scripts/.venv/bin/python"
LOG_DIR="$HOME/Documents/amily-ai/projects/ai-agent-business/marketing/gsc-weekly"
BURST="$LOG_DIR/burst-2026-07.md"

if [[ $(date +%Y%m%d) -gt 20260710 ]]; then
  launchctl bootout "gui/$(id -u)/ai.amily.gsc-daily" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/ai.amily.gsc-daily.plist"
  echo "$(date +%F) burst window over — job self-removed" >> "$BURST"
  exit 0
fi

cd "$REPO"
"$PY" scripts/gsc.py pull --days 7 --out "data/snapshots/burst-$(date +%F).json"
"$PY" - "$BURST" <<'EOF'
import json, sys, glob
from datetime import date
snaps = sorted(glob.glob('data/snapshots/burst-*.json'))
cur = json.load(open(snaps[-1]))
rows = cur.get('date', [])
clicks = sum(r['clicks'] for r in rows)
impr = sum(r['impressions'] for r in rows)
watch = [r for r in cur.get('query', []) if any(
    w in r['keys'][0] for w in ('cost', 'price', 'pricing', 'receptionist'))]
watch.sort(key=lambda r: -r['impressions'])
tops = "; ".join(f"{r['keys'][0][:34]} pos {r['position']:.0f}" for r in watch[:4])
line = f"| {date.today()} | {clicks} | {impr} | {tops} |\n"
path = sys.argv[1]
try:
    body = open(path).read()
except FileNotFoundError:
    body = ("# GSC daily burst — July 2026 (post pricing-sweep watch)\n\n"
            "7-day rolling window per row. Watch: cost/pricing cluster positions "
            "after the 2026-07-03 title changes — soften titles if positions crater.\n\n"
            "| Date | Clicks 7d | Impr 7d | Watched queries |\n|---|---|---|---|\n")
open(path, 'w').write(body + line)
print(line.strip())
EOF
