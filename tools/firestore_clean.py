#!/usr/bin/env python3
# /// script
# dependencies = ["google-auth[requests]"]
# ///
"""Delete stale Firestore backup snapshots, keeping the N most recent.

Usage:
    python3 tools/firestore_clean.py [--keep N] [--yes] [--uid UID]

Options:
    --keep N   Number of most-recent snapshots to keep (default: 5)
    --yes      Skip confirmation prompt
    --uid UID  Backup UID (default: read USER from .env)

Requires:
    pip install google-auth
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

PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")
FIRESTORE_BASE = (
    f"https://firestore.googleapis.com/v1"
    f"/projects/{PROJECT_ID}/databases/(default)/documents"
)
DEFAULT_SA_PATH = Path(__file__).parent.parent / "firebase.service_account.json"


def load_uid_from_env() -> str:
    return os.environ.get("USER", "")


def get_service_account_token(sa_path: Path) -> str:
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request as GoogleRequest
    except ImportError:
        sys.exit("Missing dependency. Run: pip install google-auth")

    creds = service_account.Credentials.from_service_account_file(
        str(sa_path),
        scopes=["https://www.googleapis.com/auth/datastore"],
    )
    creds.refresh(GoogleRequest())
    return creds.token


def list_all_docs(uid: str, token: str) -> list[dict]:
    docs: list[dict] = []
    page_token: str | None = None
    base = (
        f"{FIRESTORE_BASE}/backup/{uid}/history"
        f"?pageSize=300"
        f"&mask.fieldPaths=clientTimestamp"
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


def delete_doc(resource_name: str, token: str) -> None:
    url = f"https://firestore.googleapis.com/v1/{resource_name}"
    req = urllib.request.Request(
        url, method="DELETE", headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req):
        pass


def main() -> None:
    if not PROJECT_ID:
        sys.exit("Missing FIREBASE_PROJECT_ID. Add it to .env or export as an environment variable.")

    p = argparse.ArgumentParser(
        description="Delete stale Firestore backup snapshots, keeping the N most recent."
    )
    p.add_argument("--keep", type=int, default=5, help="Snapshots to keep (default: 5)")
    p.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    p.add_argument("--uid", default=None, help="Backup UID (default: read USER from .env)")
    p.add_argument(
        "--sa", default=str(DEFAULT_SA_PATH),
        help=f"Path to service account JSON (default: {DEFAULT_SA_PATH})"
    )
    args = p.parse_args()

    if args.keep < 1:
        sys.exit("--keep must be at least 1")

    uid = args.uid or load_uid_from_env()
    if not uid:
        sys.exit("No UID found. Pass --uid <UID> or add USER=<uid> to .env")

    sa_path = Path(args.sa)
    if not sa_path.exists():
        sys.exit(f"Service account file not found: {sa_path}")

    print("Authenticating with service account ...", end=" ", flush=True)
    token = get_service_account_token(sa_path)
    print("OK")

    print("Fetching backup list ...", end=" ", flush=True)
    docs = list_all_docs(uid, token)
    print(f"{len(docs)} snapshot(s) found")

    if not docs:
        print("No backups found.")
        return

    docs.sort(key=lambda d: str_field(d, "clientTimestamp") or "", reverse=True)

    to_keep = docs[: args.keep]
    to_delete = docs[args.keep :]

    print(f"\n  Keeping  {len(to_keep)} most-recent snapshot(s):")
    for d in to_keep:
        print(f"    KEEP    {fmt_dt(parse_ts(str_field(d, 'clientTimestamp')))}")

    if not to_delete:
        print("\nNothing to delete.")
        return

    print(f"\n  Deleting {len(to_delete)} stale snapshot(s):")
    for d in to_delete[:5]:
        print(f"    DELETE  {fmt_dt(parse_ts(str_field(d, 'clientTimestamp')))}")
    if len(to_delete) > 5:
        print(f"    ... and {len(to_delete) - 5} more")

    if not args.yes:
        print(f"\nDelete {len(to_delete)} snapshot(s)? [y/N] ", end="", flush=True)
        if input().strip().lower() != "y":
            print("Aborted.")
            return

    print()
    errors = 0
    for i, doc in enumerate(to_delete, 1):
        try:
            delete_doc(doc.get("name", ""), token)
        except urllib.error.HTTPError as e:
            errors += 1
            print(f"\n  ERROR on doc {i}: {e.code} {e.read().decode()}")
        print(f"\r  Deleted {i - errors}/{len(to_delete)}", end="", flush=True)

    print(f"\n\nDone. {len(to_delete) - errors} deleted, {errors} errors, {len(to_keep)} kept.")


if __name__ == "__main__":
    main()
