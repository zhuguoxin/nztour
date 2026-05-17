#!/usr/bin/env python3
"""
Upload a local video file to Cloudflare Stream and print the UID
that should be stored as `video_uid` in seed/operators/<slug>/courses.json.

Usage:
    export CF_ACCOUNT_ID="66452b507f2119d3801c757b0272ea98"
    export CF_STREAM_API_TOKEN="<token with Stream:Edit scope>"
    python3 seed/scripts/upload_to_stream.py path/to/file.mp4 "Coronet Peak aerial 2026"

Output:
    UID:        abc1234567890abcdef0123456789ab
    Playback:   https://customer-<sub>.cloudflarestream.com/<uid>/iframe
    Manifest:   https://customer-<sub>.cloudflarestream.com/<uid>/manifest/video.m3u8

Then update seed/operators/<slug>/courses.json:
    "video_uid": "abc1234567890abcdef0123456789ab"

Re-run:
    python3 seed/scripts/build_seed_sql.py
    cd web && npx wrangler d1 execute tourtrain-db --remote --file=../infra/seed.sql
"""

from __future__ import annotations

import os
import sys
import json
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlencode


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2

    file_path = Path(sys.argv[1])
    name = sys.argv[2] if len(sys.argv) > 2 else file_path.name

    account_id = os.environ.get("CF_ACCOUNT_ID")
    token = os.environ.get("CF_STREAM_API_TOKEN")
    if not account_id or not token:
        print("error: set CF_ACCOUNT_ID and CF_STREAM_API_TOKEN env vars first", file=sys.stderr)
        return 2

    if not file_path.exists():
        print(f"error: {file_path} not found", file=sys.stderr)
        return 2

    size = file_path.stat().st_size
    if size > 200 * 1024 * 1024:
        print(
            "error: file > 200 MB. Use the TUS resumable-upload endpoint instead; this helper is for small clips only.",
            file=sys.stderr,
        )
        return 2

    print(f"Uploading {file_path.name} ({size // 1024} KB) → Cloudflare Stream …")

    # Stream direct-upload via multipart form. boundary chosen so it doesn't
    # collide with arbitrary mp4 byte sequences.
    boundary = "----TourTrainStreamUpload9b3f1c"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="meta"\r\n'
        f"Content-Type: application/json\r\n\r\n"
        f"{json.dumps({'name': name})}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
        f"Content-Type: video/mp4\r\n\r\n"
    ).encode() + file_path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()

    req = Request(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/stream",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urlopen(req, timeout=600) as resp:
        payload = json.loads(resp.read().decode())

    if not payload.get("success"):
        print("upload failed:", json.dumps(payload, indent=2), file=sys.stderr)
        return 1

    uid = payload["result"]["uid"]
    playback = payload["result"].get("playback", {})
    print()
    print(f"UID:        {uid}")
    print(f"Playback:   {playback.get('hls') or '(propagating)'}")
    print()
    print(f"Set 'video_uid' in seed/operators/<slug>/courses.json to:")
    print(f"    {uid}")
    print()
    print("Don't forget to set NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN in wrangler.jsonc")
    print("(get the subdomain at https://dash.cloudflare.com/?to=/:account/stream).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
