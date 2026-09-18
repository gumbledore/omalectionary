#!/usr/bin/env python3
# Converts the SBL Greek New Testament (SBLGNT, (c) 2010 Logos Bible Software
# and the Society of Biblical Literature -- free to use/redistribute with
# attribution, see https://sblgnt.com/license/) into data/sblgnt.json, same
# shape as data/bsb.json: { book_id: { chapter: { verse: text } } }.
#
# Source: https://github.com/LogosBible/SBLGNT, data/sblgnt/text/*.txt --
# one verse per line, "Book chapter:verse<TAB>text". Filenames already use
# the OSIS-style ids Reference.js expects (Matt, 1Cor, ...), so no book-id
# mapping table is needed here (unlike convert_bsb.py's USFM_TO_ID).
#
# Run (no persistent network access in this repo's sandboxed dev
# environment, so the source isn't fetched automatically):
#   uv run convert_sblgnt.py [--dir sources/SBLGNT-master]
# Download the source first:
#   curl -o sources/sblgnt.zip https://codeload.github.com/LogosBible/SBLGNT/zip/refs/heads/master
#   unzip sources/sblgnt.zip -d sources/
import argparse
import re
import sys
from pathlib import Path

from writer import write_table

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE / "sources" / "SBLGNT-master"
OUTPUT = HERE.parent / "data" / "sblgnt.json"

# Critical-apparatus sigla SBLGNT's plain-text distribution embeds in the
# running text (substitution markers/brackets pointing readers to the
# printed apparatus, and double brackets around text of disputed originality
# like John 7:53-8:11). None of these are part of the reading text itself,
# so they're stripped outright -- the word(s) they mark stay in place.
APPARATUS_RE = re.compile("[⸀⸁⸂⸃⸄⸅⟦⟧]")
LINE_RE = re.compile(r"^\S+\s+(\d+):(\d+)\t(.*)$")


def convert(source_dir):
    table = {}
    text_dir = source_dir / "data" / "sblgnt" / "text"
    for path in sorted(text_dir.glob("*.txt")):
        book_id = path.stem
        chapters = {}
        for line in path.read_text(encoding="utf-8").splitlines():
            m = LINE_RE.match(line)
            if not m:
                continue  # first line of each file is the Greek book title, no tab
            chapter, verse, text = m.group(1), m.group(2), m.group(3)
            text = APPARATUS_RE.sub("", text).strip()
            text = re.sub(r"[ \t]+", " ", text)
            chapters.setdefault(chapter, {})[verse] = text
        table[book_id] = chapters
    return table


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", type=Path, default=DEFAULT_DIR, help="path to the extracted SBLGNT-master directory")
    ap.add_argument("--out", type=Path, default=OUTPUT, help="output JSON path")
    args = ap.parse_args()

    if not args.dir.exists():
        sys.exit(f"source not found: {args.dir}\n"
                  f"download it first: curl -o sources/sblgnt.zip "
                  f"https://codeload.github.com/LogosBible/SBLGNT/zip/refs/heads/master "
                  f"&& unzip sources/sblgnt.zip -d sources/")

    table = convert(args.dir)
    write_table(table, args.out, "books")


if __name__ == "__main__":
    main()
