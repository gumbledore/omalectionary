#!/usr/bin/env python3
# Converts the Berean Standard Bible (public domain) from its upstream USFM
# zip into data/bsb.json: { book_id: { chapter: { verse: text } } }, compact.
#
# Run on the maintainer's machine only (ticket 03's build-time step):
#   uv run convert_bsb.py [--zip sources/bsb_usfm.zip]
#
# The zip is not fetched automatically (no persistent network access in this
# repo's sandboxed dev environment) -- download it once from
# https://bereanbible.com/bsb_usfm.zip into build/sources/ (gitignored) and
# re-run this script whenever BSB publishes an update.
import argparse
import json
import sys
import zipfile
from pathlib import Path

from books import USFM_TO_ID
from usfm import parse_usfm

HERE = Path(__file__).resolve().parent
DEFAULT_ZIP = HERE / "sources" / "bsb_usfm.zip"
OUTPUT = HERE.parent / "data" / "bsb.json"


def convert(zip_path):
    table = {}
    with zipfile.ZipFile(zip_path) as zf:
        names = [n for n in zf.namelist() if n.endswith(".usfm")]
        for name in sorted(names):
            code = Path(name).stem.upper()
            book_id = USFM_TO_ID.get(code)
            if not book_id:
                print(f"skip: no id mapping for {code} ({name})", file=sys.stderr)
                continue
            content = zf.read(name).decode("utf-8")
            table[book_id] = parse_usfm(content)
    return table


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", type=Path, default=DEFAULT_ZIP, help="path to bsb_usfm.zip")
    ap.add_argument("--out", type=Path, default=OUTPUT, help="output JSON path")
    args = ap.parse_args()

    if not args.zip.exists():
        sys.exit(f"source not found: {args.zip}\n"
                  f"download it first: curl -o {args.zip} https://bereanbible.com/bsb_usfm.zip")

    table = convert(args.zip)
    missing = set(USFM_TO_ID.values()) - set(table)
    if missing:
        print(f"warning: {len(missing)} expected book(s) missing from output: {sorted(missing)}", file=sys.stderr)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(table, f, ensure_ascii=False, separators=(",", ":"))

    size = args.out.stat().st_size
    print(f"wrote {args.out} ({size / 1024 / 1024:.2f} MB), {len(table)} books")


if __name__ == "__main__":
    main()
