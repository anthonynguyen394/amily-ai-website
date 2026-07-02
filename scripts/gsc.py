#!/usr/bin/env python3
"""Google Search Console toolkit for amily.ai.

Rewrite (2026-07-02, Mac) of the uncommitted Windows-era scripts
(gsc-oauth-consent.py / submit-sitemap.py / gsc-monitor.py) as one CLI.

Auth: custom OAuth client (desktop app) with the webmasters scope.
Token cached at ~/.secrets/gsc-token.json. Consent screen must be
"In production" or the refresh token dies in 7 days (learned 2026-07-02).
Fallback: GSC_AUTH=adc uses gcloud application-default credentials
(the path proven working 2026-06-07).

Usage:
  gsc.py consent                        one-time browser consent flow
  gsc.py list                           list GSC properties + permission
  gsc.py list-sitemaps                  sitemaps for the property
  gsc.py submit-sitemap [url]           submit (default: sitemap.xml + image-sitemap.xml)
  gsc.py pull [--days 28] [--out FILE]  search analytics snapshot (JSON)
  gsc.py inspect <url> [...]            URL Inspection index status
  gsc.py inspect-sitemap                inspect every URL in sitemap.xml
"""

import argparse
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

from googleapiclient.discovery import build

SITE_URL = "https://amily.ai/"  # URL-prefix property, trailing slash matters
SCOPES = ["https://www.googleapis.com/auth/webmasters"]
CLIENT_SECRET = Path.home() / "Downloads" / (
    "client_secret_2_990278002759-l19stsgre9uken5icernlekheclnife7"
    ".apps.googleusercontent.com.json"
)
TOKEN_PATH = Path.home() / ".secrets" / "gsc-token.json"


def get_credentials():
    if os.environ.get("GSC_AUTH") == "adc":
        import google.auth

        creds, _ = google.auth.default(scopes=SCOPES)
        return creds

    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN_PATH.write_text(creds.to_json())
        return creds
    sys.exit(f"No token at {TOKEN_PATH} — run: gsc.py consent")


def cmd_consent(_args):
    from google_auth_oauthlib.flow import InstalledAppFlow

    if not CLIENT_SECRET.exists():
        sys.exit(f"Client secret not found: {CLIENT_SECRET}")
    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")
    TOKEN_PATH.parent.mkdir(mode=0o700, exist_ok=True)
    TOKEN_PATH.write_text(creds.to_json())
    TOKEN_PATH.chmod(0o600)
    print(f"Token saved to {TOKEN_PATH}")


def service():
    return build("searchconsole", "v1", credentials=get_credentials(), cache_discovery=False)


def cmd_list(_args):
    for entry in service().sites().list().execute().get("siteEntry", []):
        print(f"  {entry['siteUrl']:<28} permission={entry['permissionLevel']}")


def cmd_list_sitemaps(_args):
    for sm in service().sitemaps().list(siteUrl=SITE_URL).execute().get("sitemap", []):
        print(
            f"  {sm['path']}  lastSubmitted={sm.get('lastSubmitted')}"
            f"  lastDownloaded={sm.get('lastDownloaded')}  errors={sm.get('errors')}"
            f"  pending={sm.get('isPending')}"
        )


def cmd_submit_sitemap(args):
    targets = args.urls or [SITE_URL + "sitemap.xml", SITE_URL + "image-sitemap.xml"]
    svc = service()
    for t in targets:
        svc.sitemaps().submit(siteUrl=SITE_URL, feedpath=t).execute()
        print(f"  submitted {t}")


def cmd_pull(args):
    svc = service()
    end = date.today() - timedelta(days=2)  # GSC data lags ~2 days
    start = end - timedelta(days=args.days)
    snapshot = {"site": SITE_URL, "start": str(start), "end": str(end), "pulled": str(date.today())}
    for dims in (["query"], ["page"], ["date"], ["query", "page"], ["device"]):
        body = {
            "startDate": str(start),
            "endDate": str(end),
            "dimensions": dims,
            "rowLimit": 1000,
        }
        rows = (
            svc.searchanalytics().query(siteUrl=SITE_URL, body=body).execute().get("rows", [])
        )
        snapshot["_".join(dims)] = rows
        print(f"  {'+'.join(dims)}: {len(rows)} rows")
    out = Path(args.out) if args.out else Path(
        f"data/snapshots/gsc-{date.today()}-{args.days}d.json"
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snapshot, indent=1))
    print(f"  saved {out}")


def _inspect_one(svc, url):
    res = (
        svc.urlInspection()
        .index()
        .inspect(body={"inspectionUrl": url, "siteUrl": SITE_URL})
        .execute()
    )
    r = res["inspectionResult"]["indexStatusResult"]
    return {
        "url": url,
        "verdict": r.get("verdict"),
        "coverageState": r.get("coverageState"),
        "lastCrawlTime": r.get("lastCrawlTime"),
        "robotsTxtState": r.get("robotsTxtState"),
    }


def cmd_inspect(args):
    svc = service()
    for url in args.urls:
        print(json.dumps(_inspect_one(svc, url), indent=1))


def cmd_inspect_sitemap(_args):
    import urllib.request
    import xml.etree.ElementTree as ET

    req = urllib.request.Request(
        SITE_URL + "sitemap.xml",
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
    )
    xml = urllib.request.urlopen(req).read()
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [loc.text for loc in ET.fromstring(xml).findall(".//s:loc", ns)]
    svc = service()
    results = [_inspect_one(svc, u) for u in urls]
    for r in results:
        print(f"  {r['coverageState'] or r['verdict']:<42} {r['url']}")
    out = Path(f"data/snapshots/inspect-{date.today()}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=1))
    print(f"  saved {out}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("consent")
    sub.add_parser("list")
    sub.add_parser("list-sitemaps")
    sp = sub.add_parser("submit-sitemap")
    sp.add_argument("urls", nargs="*")
    sp = sub.add_parser("pull")
    sp.add_argument("--days", type=int, default=28)
    sp.add_argument("--out")
    sp = sub.add_parser("inspect")
    sp.add_argument("urls", nargs="+")
    sub.add_parser("inspect-sitemap")
    args = p.parse_args()
    {
        "consent": cmd_consent,
        "list": cmd_list,
        "list-sitemaps": cmd_list_sitemaps,
        "submit-sitemap": cmd_submit_sitemap,
        "pull": cmd_pull,
        "inspect": cmd_inspect,
        "inspect-sitemap": cmd_inspect_sitemap,
    }[args.cmd](args)


if __name__ == "__main__":
    main()
