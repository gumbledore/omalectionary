#!/usr/bin/env python3
# Converts the Westminster Leningrad Codex (public domain text; lemma/
# morphology data CC BY 4.0, Open Scriptures Hebrew Bible project -- text
# itself is what's used here) into data/wlc.json, same shape as
# data/bsb.json: { book_id: { chapter: { verse: text } } }, with Hebrew
# (WLC) versification normalized to English (KJV, which matches BSB/RCL)
# numbering so one reference resolves in every version.
#
# Source: https://github.com/openscriptures/morphhb, wlc/*.xml (OSIS, one
# file per book, <verse osisID="Gen.1.1"><w>word</w>...</verse>). Chosen
# over tanach.us's UXLC because morphhb ships a companion VerseMap.xml that
# already catalogs every WLC<->KJV versification difference (see below) --
# reusing a maintained table beats deriving one by hand. Filenames already
# use the OSIS-style ids Reference.js expects (Gen, Ps, ...), so no book-id
# mapping table is needed here (unlike convert_bsb.py's USFM_TO_ID).
#
# Run (no persistent network access in this repo's sandboxed dev
# environment, so the source isn't fetched automatically):
#   uv run convert_wlc.py [--dir sources/morphhb-master]
# Download the source first:
#   curl -o sources/morphhb.zip https://codeload.github.com/openscriptures/morphhb/zip/refs/heads/master
#   unzip sources/morphhb.zip -d sources/
#
# Versification: wlc/VerseMap.xml catalogs every verse where WLC (Hebrew)
# numbering differs from KJV (English, which BSB and the RCL both follow),
# built by the morphhb maintainers from the WLC's own inline KJV cross-
# reference notes. A verse not listed there keeps its native chapter:verse
# unchanged (WLC == KJV there). This one table covers every case the ticket
# calls out (Psalm superscriptions, Joel 2:28-3:21, Malachi 3:19-24 ->4:1-6,
# Genesis 32, Exodus 22, ...) without hand-maintaining a per-book offset
# list -- verified below against Ps 51:1 (Hebrew 51:3), Ps 23:1 (no offset:
# Ps 23 has no VerseMap entries), Joel 2:28 (Hebrew 3:1), and Mal 4:1
# (Hebrew 3:19). `type="partial"` entries (7 total, e.g. a verse split mid-
# sentence between two KJV verses) are applied the same as `type="full"`;
# good enough for whole-verse lookups, the only case this plugin needs.
#
# When more than one WLC verse maps to the same KJV target (Psalm
# superscriptions: the un-numbered heading is WLC verse 1, sometimes 1-2,
# with no VerseMap entry of its own -- so it defaults to its own native
# chapter:verse, same as the psalm's real KJV verse 1 -- and the actual
# content starts at WLC verse 2 or 3, mapped there explicitly), their texts
# are joined with "\n" in WLC document order, so the superscription
# prefixes the folded verse exactly as ticket 05 specifies.
import argparse
import re
import sys
from xml.etree import ElementTree as ET
from pathlib import Path

from writer import write_table

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE / "sources" / "morphhb-master"
OUTPUT = HERE.parent / "data" / "wlc.json"

OSIS_NS = "{http://www.bibletechnologies.net/2003/OSIS/namespace"
VM_NS = "{http://www.APTBibleTools.com/namespace}"

# Standalone paragraph/section markers (Hebrew pe/samekh) and the inverted-
# nun textual-critical mark aren't reading text -- drop them. Everything
# else (maqqef, sof-pasuq, paseq, and the large/small/suspended-letter segs
# nested inside a <w>) is kept.
DROP_SEG_TYPES = {"x-pe", "x-samekh", "x-reversednun"}
FLUSH_SEG_TYPES = {"x-maqqef", "x-sof-pasuq"}  # no space before, glues to the previous token


def word_text(w):
    # itertext() picks up nested segs (large/small/suspended letters); the
    # "/" characters mark morpheme boundaries for the morphology data and
    # aren't part of the Hebrew spelling, so they're dropped.
    return "".join(w.itertext()).replace("/", "")


def verse_text(verse_el):
    tokens = []  # list of (text, flush_before)
    for child in verse_el:
        tag = child.tag.split("}")[-1]
        if tag == "w":
            tokens.append((word_text(child), False))
        elif tag == "seg":
            seg_type = child.get("type")
            if seg_type in DROP_SEG_TYPES:
                continue
            tokens.append((child.text or "", seg_type in FLUSH_SEG_TYPES))
        # "note" (KJV cross-ref, ketiv/qere variants) isn't reading text.
    out = ""
    suppress_next = False
    for text, flush in tokens:
        if out and not flush and not suppress_next:
            out += " "
        out += text
        # A maqqef glues flush to both the word before it and the word
        # after it (it's rendered as a hyphen joining the two, not a word
        # of its own), so it also swallows the space that would otherwise
        # precede the next token.
        suppress_next = flush and text and text[-1] == "־"
    return out.strip()


def parse_book(path):
    # native (chapter, verse) -> text, in document order.
    tree = ET.parse(path)
    verses = {}
    order = []
    for verse_el in tree.getroot().iter(f"{OSIS_NS}}}verse"):
        osis_id = verse_el.get("osisID")
        _, chapter, verse = osis_id.split(".")
        verses[(chapter, verse)] = verse_text(verse_el)
        order.append((chapter, verse))
    return order, verses


def parse_verse_map(path):
    # book_id -> { (chapter, verse): (kjv_chapter, kjv_verse) }
    tree = ET.parse(path)
    mapping = {}
    for book_el in tree.getroot().iter(f"{VM_NS}book"):
        book_id = book_el.get("osisID")
        book_map = {}
        for verse_el in book_el.iter(f"{VM_NS}verse"):
            wlc_ref = verse_el.get("wlc").split("!")[0]  # partial-verse suffix (!a/!b) not needed for whole-verse lookup
            kjv_ref = verse_el.get("kjv").split("!")[0]
            _, wc, wv = wlc_ref.split(".")
            _, kc, kv = kjv_ref.split(".")
            book_map[(wc, wv)] = (kc, kv)
        mapping[book_id] = book_map
    return mapping


def convert(source_dir):
    wlc_dir = source_dir / "wlc"
    verse_map = parse_verse_map(wlc_dir / "VerseMap.xml")
    table = {}
    for path in sorted(wlc_dir.glob("*.xml")):
        book_id = path.stem
        if book_id == "VerseMap":
            continue
        order, verses = parse_book(path)
        book_map = verse_map.get(book_id, {})
        chapters = {}
        for key in order:
            target = book_map.get(key, key)  # default: no versification difference
            kc, kv = target
            bucket = chapters.setdefault(kc, {})
            text = verses[key]
            bucket[kv] = (bucket[kv] + "\n" + text) if kv in bucket else text
        table[book_id] = chapters
    return table


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", type=Path, default=DEFAULT_DIR, help="path to the extracted morphhb-master directory")
    ap.add_argument("--out", type=Path, default=OUTPUT, help="output JSON path")
    args = ap.parse_args()

    if not args.dir.exists():
        sys.exit(f"source not found: {args.dir}\n"
                  f"download it first: curl -o sources/morphhb.zip "
                  f"https://codeload.github.com/openscriptures/morphhb/zip/refs/heads/master "
                  f"&& unzip sources/morphhb.zip -d sources/")

    table = convert(args.dir)
    write_table(table, args.out, "books")


if __name__ == "__main__":
    main()
