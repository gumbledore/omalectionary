# Minimal USFM 3.x -> {chapter: {verse: text}} parser, generic enough for
# any USFM source (ticket 03 uses it for the BSB; a later ticket can reuse it
# for another version's USFM if its source happens to be USFM too).
#
# Strategy: strip footnotes/cross-refs outright (they're not verse text),
# then walk the file as a flat stream of marker/text tokens rather than
# line-by-line, tracking chapter/verse and whether we're inside a heading
# (suppressed) or body text. Poetry/list/stanza markers (\q1, \q2, \li1, \b,
# ...) start a new line within the current verse, preserved as "\n" in the
# output string; everything else in a paragraph is space-joined prose.
import re

FOOTNOTE_RE = re.compile(r"\\f\s.*?\\f\*", re.S)
XREF_RE = re.compile(r"\\x\s.*?\\x\*", re.S)  # not present in BSB, kept for generality
TOKEN_RE = re.compile(r"(\\[A-Za-z][A-Za-z0-9]*\*?)")

# Markers whose following text is body content, not a heading -- and which
# reset any earlier suppression (e.g. resume after a section heading).
RESUME_MARKERS = {
    "c", "v", "p", "m", "pc", "pmo", "q1", "q2", "q3", "q4", "qr",
    "qm1", "qm2", "qm3", "li1", "li2", "li3", "b", "nb",
}
# These start a visible new line within the current verse (poetry, list
# items, stanza breaks) rather than flowing on from the previous chunk.
BREAK_MARKERS = {"q1", "q2", "q3", "q4", "qr", "qm1", "qm2", "qm3", "li1", "li2", "li3", "b", "pc", "pmo"}
# Headings, titles, and front matter: their text is dropped entirely.
SUPPRESS_MARKERS = {
    "s1", "s2", "s3", "s4", "r", "d", "ms", "ms1", "ms2", "ms3", "mr", "sp",
    "rem", "qa", "id", "ide", "h", "toc", "toc1", "toc2", "toc3", "mt",
    "mt1", "mt2", "mt3", "imt1", "imt2", "is1", "is2", "iot", "io1", "io2",
    "ib", "periph", "usfm",
}


def parse_usfm(content):
    content = FOOTNOTE_RE.sub("", content)
    content = XREF_RE.sub("", content)
    tokens = TOKEN_RE.split(content)

    chapters = {}
    chapter = None
    verse = None
    pending_break = False
    suppress = True  # nothing before the first \c counts as verse text

    def buf():
        return chapters.setdefault(chapter, {}).setdefault(verse, [])

    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if not tok.startswith("\\"):
            chunk = " ".join(tok.split())
            if chunk and not suppress and chapter is not None and verse is not None:
                segments = buf()
                if pending_break or not segments:
                    segments.append(chunk)
                else:
                    segments[-1] = (segments[-1] + " " + chunk).strip()
                pending_break = False
            i += 1
            continue

        closing = tok.endswith("*")
        name = tok[1:-1] if closing else tok[1:]
        text = tokens[i + 1] if i + 1 < len(tokens) else ""

        if name == "c" and not closing:
            m = re.match(r"\s*(\d+)", text)
            if m:
                chapter, verse, suppress, pending_break = m.group(1), None, False, False
            i += 2
            continue
        if name == "v" and not closing:
            m = re.match(r"\s*(\d+)\s?(.*)", text, re.S)
            if m and chapter is not None:
                verse, suppress, pending_break = m.group(1), False, False
                rest = " ".join(m.group(2).split())
                if rest:
                    buf().append(rest)
            i += 2
            continue
        if not closing and name in SUPPRESS_MARKERS:
            suppress = True
            i += 1
            continue
        if not closing and name in RESUME_MARKERS:
            suppress = False
            if name in BREAK_MARKERS and chapter is not None and verse is not None and buf():
                pending_break = True
            i += 1
            continue
        # Inline character-style marker (\wj, \nd, \add, ...) or its closer,
        # or anything unrecognized: drop the marker, keep flowing text as-is.
        i += 1

    return _build(chapters)


# The upstream USFM inconsistently pads em dashes with spaces ("morning —
# the", "days— and") while BSB's own flat-text distribution renders them
# unspaced ("morning—the"); normalize to the unspaced, currently-published
# style so output matches a live lookup on bereanbible.com.
EMDASH_RE = re.compile(r"[ \t]*—[ \t]*")
# Two stray artifacts left by this zip's third-party bsb2usfm converter
# (verified absent from BSB's own flat-text distribution, bsb.txt): a
# garbled quote-closer token and a leftover editorial "vvv" marker, each
# only a couple dozen occurrences across the whole Bible.
ARTIFACT_RE = re.compile(r"\[’’\]|\bvvv\b")
SPACE_RE = re.compile(r"[ \t]+")


def _finish(text):
    text = EMDASH_RE.sub("—", text)
    text = ARTIFACT_RE.sub("", text)
    return "\n".join(SPACE_RE.sub(" ", line).strip() for line in text.split("\n"))


def _build(chapters):
    return {
        ch: {v: _finish("\n".join(seg for seg in segs if seg).strip()) for v, segs in verses.items()}
        for ch, verses in chapters.items()
    }
