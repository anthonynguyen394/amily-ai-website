#!/usr/bin/env python3
"""Weekly GSC delta report for amily.ai.

Compares the two most recent snapshots in data/snapshots/gsc-*.json
(produced by gsc.py pull) and writes a markdown report. If only one
snapshot exists, reports absolutes with no deltas.

Usage: gsc_report.py [--out-dir DIR]
"""

import argparse
import json
from datetime import date
from pathlib import Path

SNAP_DIR = Path(__file__).resolve().parent.parent / "data" / "snapshots"


def totals(snap):
    rows = snap.get("date", [])
    return {
        "clicks": sum(r["clicks"] for r in rows),
        "impressions": sum(r["impressions"] for r in rows),
        "ctr": (
            sum(r["clicks"] for r in rows) / sum(r["impressions"] for r in rows) * 100
            if rows and sum(r["impressions"] for r in rows)
            else 0.0
        ),
    }


def top(snap, dim, n=15, key="impressions"):
    rows = sorted(snap.get(dim, []), key=lambda r: r[key], reverse=True)
    return rows[:n]


def fmt_row(r):
    k = "/".join(r["keys"])
    return f"| {k[:70]} | {r['clicks']} | {r['impressions']} | {r['ctr']*100:.1f}% | {r['position']:.1f} |"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=str(Path.home() / "Documents/amily-ai/projects/ai-agent-business/marketing/gsc-weekly"))
    args = ap.parse_args()

    snaps = sorted(SNAP_DIR.glob("gsc-*.json"))
    if not snaps:
        raise SystemExit(f"no snapshots in {SNAP_DIR} — run gsc.py pull first")
    cur = json.loads(snaps[-1].read_text())
    prev = json.loads(snaps[-2].read_text()) if len(snaps) > 1 else None

    t = totals(cur)
    lines = [
        f"# GSC weekly — amily.ai — {date.today()}",
        "",
        f"Window: {cur['start']} → {cur['end']} (28d rolling). Snapshot: `{snaps[-1].name}`.",
        "",
        "## Totals",
        "",
        "| Metric | Current | Previous window | Delta |",
        "|---|---|---|---|",
    ]
    if prev:
        p = totals(prev)
        lines += [
            f"| Clicks | {t['clicks']} | {p['clicks']} | {t['clicks'] - p['clicks']:+d} |",
            f"| Impressions | {t['impressions']} | {p['impressions']} | {t['impressions'] - p['impressions']:+d} |",
            f"| CTR | {t['ctr']:.2f}% | {p['ctr']:.2f}% | {t['ctr'] - p['ctr']:+.2f}pp |",
        ]
    else:
        lines += [
            f"| Clicks | {t['clicks']} | — | — |",
            f"| Impressions | {t['impressions']} | — | — |",
            f"| CTR | {t['ctr']:.2f}% | — | — |",
        ]

    lines += ["", "## Top queries (by impressions)", "", "| Query | Clicks | Impr | CTR | Pos |", "|---|---|---|---|---|"]
    lines += [fmt_row(r) for r in top(cur, "query")]

    lines += ["", "## Top pages", "", "| Page | Clicks | Impr | CTR | Pos |", "|---|---|---|---|---|"]
    lines += [fmt_row(r) for r in top(cur, "page")]

    striking = [r for r in cur.get("query", []) if 4 <= r["position"] <= 15]
    striking.sort(key=lambda r: r["impressions"], reverse=True)
    lines += ["", "## Striking distance (pos 4-15)", "", "| Query | Clicks | Impr | CTR | Pos |", "|---|---|---|---|---|"]
    lines += [fmt_row(r) for r in striking[:15]] or ["(none)"]

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"gsc-week-{date.today()}.md"
    out.write_text("\n".join(lines) + "\n")
    print(out)


if __name__ == "__main__":
    main()
