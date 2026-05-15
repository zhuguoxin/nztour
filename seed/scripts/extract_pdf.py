#!/usr/bin/env python3
"""
TourTrain seed extractor — PDF → structured text blocks.

Why this exists: PDF parsing libs don't run cleanly in Cloudflare Workers' V8
isolate (the MVP runtime). For the 2-week demo we extract content offline here
and commit the JSON as seed data. The operator dashboard shows a *stubbed*
parsing progress bar.

Usage:
    python3 seed/scripts/extract_pdf.py <pdf_path> [--out seed/operators/<op>/blocks/<name>.json]

Output JSON shape (one file per source PDF):
    {
      "source": { "filename": "...", "pages": 12 },
      "blocks": [
        { "kind": "heading", "level": 1, "text": "...", "page": 1 },
        { "kind": "text",    "text": "...", "page": 1 },
        ...
      ]
    }

Heuristics are intentionally simple — we hand-curate the resulting JSON
into final course modules in `seed/operators/*/courses.json`.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable

import pdfplumber


HEADING_MAX_WORDS = 12


def looks_like_heading(line: str) -> bool:
    s = line.strip()
    if not s or len(s) > 120:
        return False
    words = s.split()
    if len(words) > HEADING_MAX_WORDS:
        return False
    # Mostly uppercase or Title Case, no trailing period.
    if s.endswith("."):
        return False
    upper_ratio = sum(1 for c in s if c.isupper()) / max(1, sum(1 for c in s if c.isalpha()))
    title_case = all(w[0].isupper() for w in words if w and w[0].isalpha())
    return upper_ratio > 0.6 or title_case


def iter_blocks(pdf_path: Path) -> Iterable[dict]:
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            # Collapse soft-wrapped lines: lines ending without . or : that are followed by a lowercase line.
            raw_lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]
            buffer: list[str] = []

            def flush(kind: str, level: int = 0):
                if not buffer:
                    return
                joined = re.sub(r"\s+", " ", " ".join(buffer)).strip()
                buffer.clear()
                if joined:
                    yield_obj = {"kind": kind, "text": joined, "page": page_num}
                    if kind == "heading":
                        yield_obj["level"] = level
                    blocks_out.append(yield_obj)

            blocks_out: list[dict] = []
            for ln in raw_lines:
                if looks_like_heading(ln):
                    if buffer:
                        joined = re.sub(r"\s+", " ", " ".join(buffer)).strip()
                        buffer.clear()
                        if joined:
                            blocks_out.append({"kind": "text", "text": joined, "page": page_num})
                    blocks_out.append({"kind": "heading", "level": 2, "text": ln.strip(), "page": page_num})
                else:
                    buffer.append(ln)
            if buffer:
                joined = re.sub(r"\s+", " ", " ".join(buffer)).strip()
                if joined:
                    blocks_out.append({"kind": "text", "text": joined, "page": page_num})

            yield from blocks_out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"not found: {pdf_path}", file=sys.stderr)
        return 1

    with pdfplumber.open(pdf_path) as pdf:
        pages = len(pdf.pages)

    blocks = list(iter_blocks(pdf_path))
    doc = {
        "source": {"filename": pdf_path.name, "pages": pages},
        "blocks": blocks,
    }

    out_path = Path(args.out) if args.out else None
    if out_path:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2))
        print(f"wrote {out_path}  ({pages} pages, {len(blocks)} blocks)")
    else:
        print(json.dumps(doc, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
