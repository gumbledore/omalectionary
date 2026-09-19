#!/usr/bin/env python3
"""Verify (and optionally regenerate) data/daily.js against Vanderbilt's
per-date daily-readings pages, scraped into sources/vanderbilt/Year-{A,B,C}.md.

Run with: cd build && uv run verify_daily.py [--write]

Parses the three plain-text scrapes (Nov 2025 - Nov 2028), resolves every
weekday date through ../Lectionary.js (Calendar.dayFor + resolveDailySlot,
batched through one node call), normalizes references on both sides through
../Reference.js (parseRef + formatLabel), and reports mismatches. With
--write, regenerates ../data/daily.js entirely from the Vanderbilt data,
keeping the existing (transcribed) value for any (key, year, slot) that no
date in these three years reaches.
"""
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
SOURCES = HERE / "sources" / "vanderbilt"

SOURCE_FILES = {
    "A": SOURCES / "Year-A.md",
    "B": SOURCES / "Year-B.md",
    "C": SOURCES / "Year-C.md",
}

WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

BOOK_NAMES = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
    "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
    "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude",
    "Revelation", "Sirach", "Wisdom of Solomon", "Baruch",
    # Known Vanderbilt scrape aliases/typos -> matched here so the reading
    # splitter recognizes them as book-starts; canonicalized below.
    "Wisdom", "1 King", "2 Chronicales",
]
BOOK_NAMES_SORTED = sorted(BOOK_NAMES, key=len, reverse=True)

ALIAS_FIX = [
    (re.compile(r"^Wisdom(?!\s+of\s+Solomon)\b"), "Wisdom of Solomon"),
    (re.compile(r"^1 King\b(?!s)"), "1 Kings"),
    (re.compile(r"^2 Chronicales\b"), "2 Chronicles"),
]


def canonicalize(ref):
    for pat, repl in ALIAS_FIX:
        ref = pat.sub(repl, ref, count=1)
    # A book name glued directly to its chapter number (scrape typo, e.g.
    # "2 Peter1:16-21") needs the space Reference.js requires.
    for name in BOOK_NAMES_SORTED:
        if ref.startswith(name) and len(ref) > len(name) and ref[len(name)].isdigit():
            ref = name + " " + ref[len(name):]
            break
    return ref


def starts_with_book(text):
    for name in BOOK_NAMES_SORTED:
        if text == name or text.startswith(name + " "):
            return True
        if text.startswith(name) and len(text) > len(name) and text[len(name)].isdigit():
            return True
    return False


def normalize_spacing(text):
    text = text.strip()
    text = re.sub(r"\s+:", ":", text)          # "Psalm 105 :1-6" stray space before colon
    text = re.sub(r":\s+(?=\d)", ":", text)     # "Psalm 105: 1-6" stray space after colon
    text = re.sub(r"\)\s+(\d)", r"), \1", text)  # "(1-9) 10-18" -> "(1-9), 10-18" (missing comma)
    return text.strip()


def split_readings(rest):
    """Split one Vanderbilt reading line's body into exactly the readings it
    contains, tolerating both ';'- and ','-separated source rows, and merging
    a fragment that has no book name of its own (a chapter/verse-list
    continuation) back onto the previous reading with its original
    delimiter."""
    parts = []  # (delim_before, text)
    cur = ""
    delim = ""
    depth = 0
    for ch in rest:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch in ",;" and depth == 0:
            parts.append((delim, cur))
            cur = ""
            delim = ch
        else:
            cur += ch
    parts.append((delim, cur))
    parts = [(d, normalize_spacing(t)) for d, t in parts if t.strip() != ""]

    # A continuation fragment (no book name of its own) is a chapter/verse
    # jump within the previous reading. Reference.js's parser only supports
    # such jumps when comma-joined (e.g. "Ezekiel 1:1-3, 2:8-3:3"), so it is
    # rejoined with ", " regardless of whether the source used ';' or ',' --
    # both appear in Vanderbilt's own text for the same phenomenon.
    merged = []  # list of [delim, text]
    for delim, text in parts:
        if merged and not starts_with_book(text):
            merged[-1][1] = merged[-1][1] + ", " + text
        else:
            merged.append([delim, text])
    return [canonicalize(t) for _, t in merged]


DATE_LINE = re.compile(
    r"^(?P<dow>Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), "
    r"(?P<month>[A-Za-z]+) (?P<day>\d{2}), (?P<year>\d{4}): ?(?P<rest>.*)$"
)


def parse_date(month, day, year):
    return datetime.strptime(f"{month} {day} {year}", "%B %d %Y").strftime("%Y-%m-%d")


def parse_file(path, year_letter):
    """Returns (events, sunday_dates, feast_dates).
    events: list of {"date", "type": "single"|"split", refs / refs1+refs2, "raw"}
    """
    events = []
    sunday_dates = set()
    feast_dates = {}  # date -> feast name text
    pending_date = None  # date awaiting Semi-continuous/Complementary pair
    pending_track1 = None

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        # "Semi-continuous:"/"Complementary:" lines carry no weekday/date
        # prefix of their own -- they belong to the most recent empty
        # "Weekday, Month DD, YYYY:" marker line -- so they must be checked
        # before (not as part of) the DATE_LINE match below.
        if line.startswith("Semi-continuous:"):
            body = line[len("Semi-continuous:"):].strip()
            pending_track1 = split_readings(body)
            continue

        if line.startswith("Complementary:"):
            body = line[len("Complementary:"):].strip()
            refs2 = split_readings(body)
            if pending_date is not None and pending_track1 is not None:
                if len(pending_track1) == 3 and len(refs2) == 3:
                    events.append({
                        "date": pending_date, "type": "split",
                        "refs1": pending_track1, "refs2": refs2, "raw": raw_line,
                    })
                else:
                    print(f"WARN [{path.name}] split line did not yield 3+3 readings: {pending_date} "
                          f"-> {pending_track1} / {refs2}", file=sys.stderr)
            pending_date = None
            pending_track1 = None
            continue

        m = DATE_LINE.match(line)
        if not m:
            continue
        date = parse_date(m.group("month"), m.group("day"), m.group("year"))
        dow = m.group("dow")
        rest = m.group("rest").strip()

        if rest == "":
            pending_date = date
            pending_track1 = None
            continue

        if dow == "Sunday":
            sunday_dates.add(date)
            continue

        if not rest.endswith(";"):
            # Feast-name-only weekday line, or a scrape artifact (stray
            # "Sunday name" text glued to the wrong weekday) -- either way
            # not a readings line.
            feast_dates[date] = rest
            continue

        refs = split_readings(rest[:-1] if rest.endswith(";") else rest)
        if len(refs) != 3:
            print(f"WARN [{path.name}] could not split into 3 readings: {raw_line!r} -> {refs}", file=sys.stderr)
            continue
        # Vanderbilt is documented to print "psalm; first; second" always,
        # but at least one date (Dec 29, 2026) transposes the psalm to
        # second position ("Matthew 12:46-50; Psalm 148; Isaiah 49:5-15").
        # Detect and undo that: a non-psalm-looking first reading with a
        # literal "Psalm ..." second reading is the swap, not a real OT/NT
        # canticle (those never have a second "Psalm ..." reading).
        if not refs[0].startswith("Psalm") and refs[1].startswith("Psalm"):
            refs[0], refs[1] = refs[1], refs[0]
        events.append({"date": date, "type": "single", "refs": refs, "raw": raw_line})

    return events, sunday_dates, feast_dates


def run_node(payload):
    script = REPO / "build" / ".verify_daily_node.js"
    node_src = r"""
const Reference = require("../Reference.js")
const Calendar = require("../Calendar.js")
const Lectionary = require("../Lectionary.js")
const fs = require("fs")

const input = JSON.parse(fs.readFileSync(process.argv[2], "utf8"))

function normRef(ref) {
  try {
    return Reference.formatLabel(Reference.parseRef(ref))
  } catch (e) {
    return "UNPARSEABLE:" + ref + " (" + e.message + ")"
  }
}

const out = input.map(function (entry) {
  const today = Calendar.dayFor(entry.date)
  let rec
  try {
    rec = Lectionary.dayFor(entry.date, { track: entry.track })
  } catch (e) {
    return { id: entry.id, error: e.message }
  }
  const result = {
    id: entry.id,
    date: entry.date,
    track: entry.track,
    source: rec.source,
    key: rec.key,
    year: rec.year,
    actualRefs: rec.readings.map(function (r) { return normRef(r.ref) }),
    expectedRefs: (entry.expectedRefs || []).map(normRef),
  }
  if (rec.source === "daily") {
    result.target = Lectionary.resolveDailySlot(today)
  }
  return result
})
console.log(JSON.stringify(out))
"""
    script.write_text(node_src, encoding="utf-8")
    payload_file = REPO / "build" / ".verify_daily_input.json"
    payload_file.write_text(json.dumps(payload), encoding="utf-8")
    try:
        result = subprocess.run(
            ["node", str(script), str(payload_file)],
            cwd=str(REPO / "build"), capture_output=True, text=True, check=True,
        )
    finally:
        script.unlink(missing_ok=True)
        payload_file.unlink(missing_ok=True)
    if result.stderr.strip():
        print(result.stderr, file=sys.stderr)
    return json.loads(result.stdout)


def get_old_daily_table():
    out = subprocess.run(
        ["node", "-e", "console.log(JSON.stringify(require('../data/daily.js')))"],
        cwd=str(REPO / "build"), capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


def get_all_daily_keys():
    out = subprocess.run(
        ["node", "-e", "console.log(JSON.stringify(Object.keys(require('../data/daily.js'))))"],
        cwd=str(REPO / "build"), capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


SLOTS = ["thu", "fri", "sat", "mon", "tue", "wed"]
YEARS = ["A", "B", "C"]


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def format_slot(entry):
    def field(role):
        v = entry.get(role)
        if v is None:
            return None
        if isinstance(v, dict):
            return "{ \"1\":%s, \"2\":%s }" % (js_str(v["1"]), js_str(v["2"]))
        return js_str(v)

    parts = []
    for role in ("psalm", "first", "second"):
        v = field(role)
        if v is not None:
            parts.append(f"{role}: {v}")
    return "{ " + ", ".join(parts) + " }"


def format_year(byslot):
    parts = []
    for slot in SLOTS:
        if slot in byslot:
            parts.append(f"{slot}: {format_slot(byslot[slot])}")
    return "{ " + ", ".join(parts) + " }"


HEADER = """// RCL Daily Lectionary (CCT, 2005): weekday readings that surround each
// Sunday/feast in data/sundays.js. Keyed by the governing Sunday day key,
// then year letter, then a weekday slot: "thu"/"fri"/"sat" are the three
// days BEFORE that Sunday (preparation), "mon"/"tue"/"wed" are the three
// days AFTER it (response). Each slot is { psalm, first, second } -- CCT
// prints the Psalm first. For Propers 3-29 only, "psalm" and "first" carry
// the Track 1 (semicontinuous)/Track 2 (complementary) split, exactly as
// data/sundays.js splits them for the Sunday itself; every other season
// uses a single plain reading since the two tracks only diverge in Ordinary
// Time.
//
// Special weeks: Ash Wednesday, Holy Week, Christmas, and Epiphany need no
// dedicated entries here -- Lectionary.js resolves the days around them by
// walking to the nearest actual Sunday/feast start, which naturally lands on
// the right key (the Thu-Sat after Ash Wednesday resolve to lent-1's own
// thu/fri/sat, since Ash Wednesday sits midweek -- see isFeastStart in
// Lectionary.js). The one deliberate exception is "easter": CCT gives the
// full Monday-Saturday Easter octave its own six days of readings, so
// "easter" carries thu/fri/sat too (days 4-6 after Easter Day) instead of
// the generic "before easter-2" set.
//
// Generated by build/verify_daily.py --write from the Vanderbilt daily-
// readings pages (build/sources/vanderbilt/Year-{A,B,C}.md, Advent 2025 -
// Nov 2028; gitignored, not fetched live from this file). Every (key, year,
// slot) reachable by a date in that three-year span is transcribed
// verbatim from Vanderbilt; entries marked UNVERIFIED below are keys/slots
// no date in 2025-2028 resolves to (e.g. epiphany-8/9, proper-3/4 in years
// that don't reach them) and are kept from the prior hand-transcribed table.
//
// UNVERIFIED (kept from prior transcription): {unverified}
"""


def build_footer():
    return """}

if (typeof module !== "undefined") {
  module.exports = DAILY
}
"""


def main():
    write_mode = "--write" in sys.argv

    all_events = []
    sunday_dates = set()
    feast_dates = {}
    for letter, path in SOURCE_FILES.items():
        events, sdates, fdates = parse_file(path, letter)
        all_events.extend(events)
        sunday_dates |= sdates
        feast_dates.update(fdates)

    # Only fixed feasts our own Calendar.js/Lectionary.js actually recognize
    # (FIXED_WEEKDAY_KEYS) should resolve to source="sunday"; Vanderbilt also
    # marks minor commemorations (Presentation, Annunciation, Holy Cross,
    # Thanksgiving, Visitation, Easter Vigil/Evening) that our table has no
    # entry for and which correctly fall through to the daily table, plus
    # the occasional scrape artifact (a Sunday's name glued to a weekday).
    RECOGNIZED_FEASTS = re.compile(
        r"Holy Name|New Year|Epiphany of the Lord|Ash Wednesday|"
        r"of Holy Week|Maundy Thursday|Good Friday|Holy Saturday|"
        r"Ascension of the Lord|Nativity of the Lord - Proper (II|III)|"
        r"All Saints Day"
    )
    feast_check_dates = {d for d, name in feast_dates.items() if RECOGNIZED_FEASTS.search(name)}

    # A date can carry both a Vanderbilt daily-readings line and a feast
    # line (Presentation, Annunciation, Holy Cross, Thanksgiving...); for
    # those our own Calendar/Lectionary has no matching feast so the
    # readings line is exactly what the daily table should hold. All Saints
    # Day is the one exception recognized above (a real spike in
    # Calendar.js): when it lands on a weekday, dayFor() always resolves it
    # via the Sunday/feast table, so its Vanderbilt readings line (if any)
    # is not reachable through the daily table and must be skipped, not
    # queried as a "daily" expectation.
    all_events = [ev for ev in all_events if ev["date"] not in feast_check_dates]

    # Build node payload: one query per (date, track) needed.
    payload = []
    id_map = {}  # id -> event info for later reconciliation
    next_id = 0
    for ev in all_events:
        if ev["type"] == "single":
            eid = next_id; next_id += 1
            payload.append({"id": eid, "date": ev["date"], "track": 2, "expectedRefs": ev["refs"]})
            id_map[eid] = {"event": ev, "track": None}
        else:
            eid1 = next_id; next_id += 1
            payload.append({"id": eid1, "date": ev["date"], "track": 1, "expectedRefs": ev["refs1"]})
            id_map[eid1] = {"event": ev, "track": 1}
            eid2 = next_id; next_id += 1
            payload.append({"id": eid2, "date": ev["date"], "track": 2, "expectedRefs": ev["refs2"]})
            id_map[eid2] = {"event": ev, "track": 2}

    # Sanity-check Sunday/feast dates resolve via the Sunday table.
    for d in sorted(sunday_dates | feast_check_dates):
        eid = next_id; next_id += 1
        payload.append({"id": eid, "date": d, "track": 2, "expectedRefs": []})
        id_map[eid] = {"event": None, "track": None, "sanity": d}

    print(f"Querying node for {len(payload)} (date, track) checks...")
    results = run_node(payload)
    by_id = {r["id"]: r for r in results}

    mismatches = []
    ambiguous = []
    sanity_failures = []
    write_map = {}  # key -> year -> slot -> role -> value (str or {"1":..,"2":..})
    total_checked = 0
    by_year_mismatch = {"A": 0, "B": 0, "C": 0}
    by_year_total = {"A": 0, "B": 0, "C": 0}

    for eid, info in id_map.items():
        r = by_id[eid]
        if info.get("sanity"):
            if "error" in r or r.get("source") != "sunday":
                sanity_failures.append((info["sanity"], r.get("source", r.get("error"))))
            continue

        ev = info["event"]
        track = info["track"]
        total_checked += 1
        yl = ev["date"][:4]
        # attribute by liturgical year roughly via governing 'year' field from node
        if "error" in r:
            ambiguous.append((ev["date"], track, "node error: " + r["error"]))
            continue
        by_year_total[r["year"]] = by_year_total.get(r["year"], 0) + 1

        if r["source"] != "daily":
            mismatches.append((ev["date"], track, "expected source=daily, got " + r["source"]))
            by_year_mismatch[r["year"]] = by_year_mismatch.get(r["year"], 0) + 1
            continue

        expected = r["expectedRefs"]
        actual = r["actualRefs"]
        has_unparseable = any(e.startswith("UNPARSEABLE:") for e in expected)
        if has_unparseable:
            ambiguous.append((ev["date"], track, "unparseable Vanderbilt ref(s): " + str(expected)))
            continue

        if expected != actual:
            mismatches.append((ev["date"], track, f"{r['key']}/{r['target']['slot']} {r['year']}: was {actual} now {expected}"))
            by_year_mismatch[r["year"]] = by_year_mismatch.get(r["year"], 0) + 1

        # Record into write_map using the ORIGINAL (unnormalized, but
        # typo/spacing-fixed) reading strings, not the abbreviated labels.
        target = r["target"]
        key, slot, year = target["key"], target["slot"], target["year"]
        write_map.setdefault(key, {}).setdefault(year, {}).setdefault(slot, {})
        slot_entry = write_map[key][year][slot]
        raw_refs = ev["refs"] if ev["type"] == "single" else (ev["refs1"] if track == 1 else ev["refs2"])
        psalm, first, second = raw_refs
        if ev["type"] == "single":
            slot_entry["psalm"] = psalm
            slot_entry["first"] = first
            slot_entry["second"] = second
        else:
            slot_entry.setdefault("psalm", {})[str(track)] = psalm
            slot_entry.setdefault("first", {})[str(track)] = first
            # second is identical across tracks in every observed case
            slot_entry["second"] = second

    print(f"\nChecked {total_checked} date/track combinations.")
    print(f"Mismatches: {len(mismatches)}")
    print(f"Ambiguous/unparseable: {len(ambiguous)}")
    print(f"Sunday/feast sanity failures: {len(sanity_failures)}")

    if sanity_failures:
        print("\n-- Sunday/feast dates NOT resolving to source=sunday --")
        for d, got in sanity_failures[:20]:
            print(f"  {d}: got {got}")

    if ambiguous:
        print("\n-- Ambiguous/unparseable (left as previously transcribed) --")
        for d, t, msg in ambiguous:
            print(f"  {d} track={t}: {msg}")

    if mismatches:
        print("\n-- First 40 mismatches --")
        for d, t, msg in mismatches[:40]:
            print(f"  {d} track={t}: {msg}")

    if write_mode:
        old_table = get_old_daily_table()
        all_keys = sorted(set(get_all_daily_keys()) | set(write_map.keys()))
        unverified = []

        lines = []
        for key in all_keys:
            year_blocks = []
            for yl in YEARS:
                byslot = {}
                for slot in SLOTS:
                    if key in write_map and yl in write_map[key] and slot in write_map[key][yl]:
                        byslot[slot] = write_map[key][yl][slot]
                    else:
                        old_slot = (old_table.get(key, {}).get(yl) or old_table.get(key, {}).get("*") or {}).get(slot)
                        if old_slot is not None:
                            byslot[slot] = old_slot
                            unverified.append(f"{key}/{yl}/{slot}")
                if byslot:
                    year_blocks.append(f"{yl}: {format_year(byslot)}")
            lines.append(f'  "{key}": {{\n    ' + ",\n    ".join(year_blocks) + "\n  }")

        header = HEADER.replace("{unverified}", ", ".join(unverified) if unverified else "(none)")
        body = "var DAILY = {\n" + ",\n".join(lines) + "\n" + build_footer()
        (REPO / "data" / "daily.js").write_text(header + "\n" + body, encoding="utf-8")
        print(f"\nWrote data/daily.js ({len(unverified)} (key/year/slot) entries kept from prior transcription).")

    return 1 if (mismatches or sanity_failures) else 0


if __name__ == "__main__":
    sys.exit(main())
