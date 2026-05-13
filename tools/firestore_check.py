#!/usr/bin/env python3
"""Report Firestore backup storage usage.

Usage:
    python3 tools/firestore_check.py
    python3 tools/firestore_check.py --uid <UID>

No external packages required — uses only the standard library.

Note: actual storage size in bytes is only available via Google Cloud Monitoring
(requires a service account). This script reports document/order counts instead,
which is the actionable info for cleanup decisions.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path


def _load_dotenv() -> None:
    env = Path(__file__).parent.parent / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()

API_KEY = os.environ.get("FIREBASE_API_KEY", "")
PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")
FIRESTORE_BASE = (
    f"https://firestore.googleapis.com/v1"
    f"/projects/{PROJECT_ID}/databases/(default)/documents"
)
AUTH_URL = (
    f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
)


def load_uid_from_env() -> str:
    return os.environ.get("USER", "")


def get_id_token() -> str:
    body = json.dumps({"returnSecureToken": True}).encode()
    req = urllib.request.Request(
        AUTH_URL, data=body, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())["idToken"]


def list_all_docs(uid: str, token: str) -> list[dict]:
    docs: list[dict] = []
    page_token: str | None = None
    # Fetch only lightweight fields — skipping the full orders array avoids
    # downloading gigabytes when hundreds of snapshots each hold thousands of orders.
    base = (
        f"{FIRESTORE_BASE}/backup/{uid}/history"
        f"?pageSize=300"
        f"&mask.fieldPaths=clientTimestamp"
        f"&mask.fieldPaths=orderCounter"
    )

    while True:
        url = base + (f"&pageToken={page_token}" if page_token else "")
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        try:
            with urllib.request.urlopen(req) as resp:
                body = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            sys.exit(f"Firestore error {e.code}: {e.read().decode()}")

        docs.extend(body.get("documents", []))
        page_token = body.get("nextPageToken")
        if not page_token:
            break

    return docs


def str_field(doc: dict, field: str) -> str:
    return doc.get("fields", {}).get(field, {}).get("stringValue", "")


def int_field(doc: dict, field: str) -> int:
    val = doc.get("fields", {}).get(field, {})
    return int(val.get("integerValue", 0) or 0)


def parse_ts(iso: str) -> datetime | None:
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None


def fmt_dt(dt: datetime | None) -> str:
    if dt is None:
        return "unknown"
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def main() -> None:
    if not API_KEY or not PROJECT_ID:
        sys.exit("Missing FIREBASE_API_KEY or FIREBASE_PROJECT_ID. Add them to .env or export as environment variables.")

    p = argparse.ArgumentParser(description="Report Firestore backup storage usage.")
    p.add_argument("--uid", default=None, help="Backup UID (default: read USER from .env)")
    args = p.parse_args()

    uid = args.uid or load_uid_from_env()
    if not uid:
        sys.exit("No UID found. Pass --uid <UID> or add USER=<uid> to .env")

    print("Authenticating ...", end=" ", flush=True)
    token = get_id_token()
    print("OK")

    print(f"Fetching backup list for UID {uid[:12]}...", end=" ", flush=True)
    docs = list_all_docs(uid, token)
    print(f"{len(docs)} snapshot(s) found")

    if not docs:
        print("No backups found.")
        return

    entries = [
        {
            "ts": parse_ts(str_field(d, "clientTimestamp")),
            "order_counter": int_field(d, "orderCounter"),
        }
        for d in docs
    ]
    entries.sort(key=lambda e: e["ts"] or datetime.min.replace(tzinfo=timezone.utc))

    counters = [e["order_counter"] for e in entries]
    total_snapshots = len(docs)
    latest_counter = counters[-1] if counters else 0

    sep = "=" * 56
    print()
    print(sep)
    print("  FIRESTORE BACKUP USAGE REPORT")
    print(sep)
    print(f"  Snapshots total    : {total_snapshots}")
    print(f"  Oldest snapshot    : {fmt_dt(entries[0]['ts'])}")
    print(f"  Newest snapshot    : {fmt_dt(entries[-1]['ts'])}")
    print(f"  Latest order count : {latest_counter:,}  (orders in most recent snapshot)")
    print(f"  Duplicate records  : ~{latest_counter * (total_snapshots - 1):,}  (wasted across older snapshots)")
    print(sep)

    keep = 5
    deletable = max(0, total_snapshots - keep)
    if deletable:
        print(f"\n  Recommendation: keep last {keep} → delete {deletable} snapshot(s)")
        print(f"  Run: python3 tools/firestore_clean.py --keep {keep}")
    else:
        print(f"\n  Only {total_snapshots} snapshot(s) — nothing to clean up.")
    print()


if __name__ == "__main__":
    main()
