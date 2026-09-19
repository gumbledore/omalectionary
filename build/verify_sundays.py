#!/usr/bin/env python3
"""Verify data/sundays.js against the Vanderbilt RCL CSV exports.

Run with: cd build && uv run verify_sundays.py

Parses the three Vanderbilt CSVs in sources/vanderbilt/, loads
../data/sundays.js via node, normalizes every reference through
../Reference.js (parseRef + formatLabel, batched through one node call),
and prints a diff: per (key, year, role, track) the CSV value vs. the table
value. Exits non-zero if any mismatch is found among verifiable entries.
"""
import csv
import html
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
SOURCES = HERE / "sources" / "vanderbilt"

CSV_FILES = {
    "A": SOURCES / "Year A - All Seasons_25-26.csv",
    "B": SOURCES / "Year B - All Seasons_26-27.csv",
    "C": SOURCES / "Year C - All Seasons_27-28.csv",
}

# --- Liturgical name -> table day key -----------------------------------

NAME_TO_KEY = {
    "First Sunday of Advent": "advent-1",
    "Second Sunday of Advent": "advent-2",
    "Third Sunday of Advent": "advent-3",
    "Fourth Sunday of Advent": "advent-4",
    "Nativity of the Lord - Proper I": "christmas",
    "First Sunday after Christmas Day": "christmas-1",
    "Second Sunday after Christmas Day": "christmas-2",
    "Holy Name of Jesus": "holy-name",
    "Epiphany of the Lord": "epiphany",
    "Baptism of the Lord": "baptism",
    "Second Sunday after the Epiphany": "epiphany-2",
    "Third Sunday after the Epiphany": "epiphany-3",
    "Fourth Sunday after the Epiphany": "epiphany-4",
    "Fifth Sunday after the Epiphany": "epiphany-5",
    "Sixth Sunday after the Epiphany": "epiphany-6",
    "Seventh Sunday after the Epiphany": "epiphany-7",
    "Eighth Sunday after the Epiphany": "epiphany-8",
    "Ninth Sunday after the Epiphany": "epiphany-9",
    "Transfiguration Sunday": "transfiguration",
    "Ash Wednesday": "ash-wednesday",
    "First Sunday in Lent": "lent-1",
    "Second Sunday in Lent": "lent-2",
    "Third Sunday in Lent": "lent-3",
    "Fourth Sunday in Lent": "lent-4",
    "Fifth Sunday in Lent": "lent-5",
    "Liturgy of the Passion": "palm-sunday",
    "Monday of Holy Week": "holy-monday",
    "Tuesday of Holy Week": "holy-tuesday",
    "Wednesday of Holy Week": "holy-wednesday",
    "Maundy Thursday": "maundy-thursday",
    "Good Friday": "good-friday",
    "Holy Saturday": "holy-saturday",
    "Resurrection of the Lord": "easter",
    "Second Sunday of Easter": "easter-2",
    "Third Sunday of Easter": "easter-3",
    "Fourth Sunday of Easter": "easter-4",
    "Fifth Sunday of Easter": "easter-5",
    "Sixth Sunday of Easter": "easter-6",
    "Seventh Sunday of Easter": "easter-7",
    "Ascension of the Lord": "ascension",
    "Day of Pentecost": "pentecost",
    "Trinity Sunday": "trinity",
    "All Saints Day": "all-saints",
}

IGNORE_NAMES = {
    "New Year's Day", "Presentation of the Lord", "Annunciation of the Lord",
    "Visitation of Mary to Elizabeth", "Holy Cross", "Canadian Thanksgiving Day",
    "Thanksgiving Day", "Easter Vigil", "Easter Evening", "Liturgy of the Palms",
    "Nativity of the Lord - Proper II", "Nativity of the Lord - Proper III",
}

PROPER_RE = re.compile(r"^Proper (\d+) \(\d+\)$")
REIGN_RE = re.compile(r"^Reign of Christ - Proper 29 \(\d+\)$")

# Keys whose First/Psalm columns pack two OT+Psalm readings (Track 1 in
# First, Track 2 in Psalm) or one OT+Psalm pair (Trinity/All Saints, packed
# into First only).
TRACK_KEY_RE = re.compile(r"^proper-(\d+)$")
SINGLE_PACKED_KEYS = {"trinity", "all-saints"}

# --- Manual overrides for packed fields where the generic "split on the
# first literal ' Psalm '" rule fails (documented quirks: an OT-reading
# alternate placed after the Psalm text, or a psalm-equivalent canticle that
# doesn't start with the word "Psalm" at all). Keyed by (year, liturgical
# name, column) -> (ot_string, psalm_string).
SPLIT_OVERRIDES = {
    ("A", "Proper 27 (32)", "Psalm"): (
        "Wisdom of Solomon 6:12-16 or Amos 5:18-24",
        "Wisdom of Solomon 6:17-20 or Psalm 70",
    ),
    ("B", "Proper 7 (12)", "First"): (
        "1 Samuel 17:(1a,4-11,19-23),32-49 or 1 Samuel 17:57-18:5,18:10-16",
        "Psalm 9:9-20 or Psalm 133",
    ),
    ("B", "All Saints Day", "First"): (
        "Wisdom of Solomon 3:1-9 or Isaiah 25:6-9",
        "Psalm 24",
    ),
    ("B", "Proper 28 (33)", "First"): (
        "1 Samuel 1:4-20",
        "1 Samuel 2:1-10",
    ),
    ("C", "Proper 22 (27)", "First"): (
        "Lamentations 1:1-6",
        "Lamentations 3:19-26 or Psalm 137",
    ),
    ("C", "Reign of Christ - Proper 29 (34)", "First"): (
        "Jeremiah 23:1-6",
        "Luke 1:68-79",
    ),
    ("C", "Proper 28 (33)", "First"): (
        "Isaiah 65:17-25",
        "Isaiah 12",
    ),
}


def key_for(name):
    if name in NAME_TO_KEY:
        return NAME_TO_KEY[name]
    if name in IGNORE_NAMES:
        return None
    m = PROPER_RE.match(name)
    if m:
        return "proper-" + m.group(1)
    if REIGN_RE.match(name):
        return "proper-29"
    return "?" + name  # unrecognized; surfaced separately


def to_storage(ref):
    """Normalize a raw Vanderbilt ref fragment to the table's storage style:
    no space after commas, en/em dash and stray colon-space tightened,
    semicolons treated as chapter-jump commas."""
    ref = html.unescape(ref).strip()
    ref = ref.replace("–", "-").replace("—", "-")
    ref = re.sub(r"\s+and\s+", ",", ref)  # "Psalm 42 and 43" -> "Psalm 42,43"
    ref = re.sub(r"\s*;\s*", ",", ref)    # semicolon chapter jump -> comma
    ref = re.sub(r"\s*,\s*", ",", ref)
    ref = re.sub(r"\s*-\s*", "-", ref)
    ref = re.sub(r":\s+", ":", ref)
    # Vanderbilt sometimes drops the comma before an optional parenthetical
    # clause ("Isaiah 58:1-9a (9b-12)"); Reference.parseRef requires it.
    ref = re.sub(r"([A-Za-z0-9])\s+\(", r"\1,(", ref)
    ref = re.sub(r"\s+", " ", ref)
    return ref.strip()


def split_alt(raw):
    """'ref or ref or ref' -> {"ref": first, "alt": [...]} or just the ref
    string if there is no alternate."""
    parts = [to_storage(p) for p in re.split(r"\s+or\s+", raw.strip())]
    if len(parts) == 1:
        return parts[0]
    return {"ref": parts[0], "alt": parts[1:]}


def split_packed(year, name, column, raw):
    raw = raw.strip()
    if raw.startswith("* "):
        raw = raw[2:]
    override = SPLIT_OVERRIDES.get((year, name, column))
    if override:
        return override
    if " Psalm " in raw:
        idx = raw.index(" Psalm ")
        return raw[:idx].strip(), raw[idx + 1:].strip()
    return None  # unresolved; caller reports for manual review


def load_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        lines = f.readlines()
    reader = csv.DictReader(lines[4:])
    rows = {}
    for row in reader:
        rows[row["Liturgical Date"].strip()] = row
    return rows


def strip_star(s):
    s = s.strip()
    return s[2:] if s.startswith("* ") else s


def build_csv_entries():
    """Returns entries[key][year] = {first, psalm, second, gospel} (values
    are plain strings or {"1":.., "2":..} track dicts; each leaf is a plain
    ref string or {"ref":.., "alt":[...]}). Also returns unresolved (list of
    (year, name, column, raw) needing manual review) and unknown_names (CSV
    rows whose liturgical name isn't in the mapping or ignore list).
    """
    entries = {}
    unresolved = []
    unknown_names = set()

    for year, path in CSV_FILES.items():
        rows = load_csv(path)
        for name, row in rows.items():
            key = key_for(name)
            if key is None:
                continue
            if key.startswith("?"):
                unknown_names.add((year, name))
                continue

            first_raw = row["First reading"]
            psalm_raw = row["Psalm"]
            second_raw = row["Second reading"]
            gospel_raw = row["Gospel"]

            is_proper_track = bool(TRACK_KEY_RE.match(key))
            is_packed = is_proper_track or key in SINGLE_PACKED_KEYS

            if is_packed:
                split_first = split_packed(year, name, "First", first_raw)
                if split_first is None:
                    unresolved.append((year, name, "First", first_raw))
                    continue
                ot1, ps1 = split_first
                if key in SINGLE_PACKED_KEYS:
                    first_val = split_alt(ot1)
                    psalm_val = split_alt(ps1)
                else:
                    ot2, ps2 = None, None
                    if psalm_raw.strip():
                        split_second = split_packed(year, name, "Psalm", psalm_raw)
                        if split_second is None:
                            unresolved.append((year, name, "Psalm", psalm_raw))
                            continue
                        ot2, ps2 = split_second
                    else:
                        # Track 2 not distinct this week (rare); mirror track 1.
                        ot2, ps2 = ot1, ps1
                    first_val = {"1": split_alt(ot1), "2": split_alt(ot2)}
                    psalm_val = {"1": split_alt(ps1), "2": split_alt(ps2)}
            else:
                first_val = split_alt(strip_star(first_raw))
                psalm_val = split_alt(strip_star(psalm_raw))

            second_val = split_alt(strip_star(second_raw))
            gospel_val = split_alt(strip_star(gospel_raw))

            entries.setdefault(key, {})[year] = {
                "first": first_val, "psalm": psalm_val,
                "second": second_val, "gospel": gospel_val,
            }

    return entries, unresolved, unknown_names


# --- Table loading & reference normalization via node ---------------------

def load_table():
    out = subprocess.run(
        ["node", "-e", 'console.log(JSON.stringify(require("../data/sundays.js")))'],
        cwd=HERE, capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


def collect_leaf_refs(value, into):
    """Walk a reading value (str / {ref,alt} / {"1":.., "2":..}) collecting
    every leaf ref string into `into` (a list, dedup handled by caller)."""
    if value is None:
        return
    if isinstance(value, str):
        into.append(value)
    elif "ref" in value:
        into.append(value["ref"])
        into.extend(value.get("alt", []))
    else:  # track dict {"1":..,"2":..}
        for t in ("1", "2"):
            if t in value:
                collect_leaf_refs(value[t], into)


def format_labels_batch(refs):
    """Batch-parse+format every ref in `refs` via node's Reference.js.
    Returns {ref: label_or_None} (None if parseRef/formatLabel throws)."""
    script = """
const Reference = require("../Reference.js")
const refs = JSON.parse(require("fs").readFileSync(0, "utf8"))
const out = {}
for (const r of refs) {
  try {
    out[r] = Reference.formatLabel(Reference.parseRef(r))
  } catch (e) {
    out[r] = null
  }
}
console.log(JSON.stringify(out))
"""
    proc = subprocess.run(["node", "-e", script], cwd=HERE, input=json.dumps(refs),
                           capture_output=True, text=True, check=True)
    return json.loads(proc.stdout)


def value_labels(value, labels):
    """Turn a reading value into an ordered list of labels (falls back to
    the raw ref string if parsing failed) for structural comparison, or
    None for a track dict (handled per-track by the caller)."""
    def lab(ref):
        got = labels.get(ref)
        return got if got is not None else ref

    if value is None:
        return None
    if isinstance(value, str):
        return [lab(value)]
    if "ref" in value:
        return [lab(value["ref"])] + [lab(a) for a in value.get("alt", [])]
    return None


# --- Diffing ---------------------------------------------------------------

ROLES = ["first", "psalm", "second", "gospel"]


def diff_entries(csv_entries, table):
    all_refs = []
    for key, byyear in csv_entries.items():
        for year, entry in byyear.items():
            for role in ROLES:
                collect_leaf_refs(entry[role], all_refs)
    for key, byyear in table.items():
        for year, entry in byyear.items():
            yrs = [year] if year != "*" else ["A", "B", "C"]
            for role in ROLES:
                if role in entry:
                    collect_leaf_refs(entry[role], all_refs)
    labels = format_labels_batch(sorted(set(all_refs)))

    mismatches = []
    not_verifiable = []

    for key, byyear in sorted(csv_entries.items()):
        table_key_entry = table.get(key)
        for year, csv_entry in sorted(byyear.items()):
            table_entry = None
            if table_key_entry is not None:
                table_entry = table_key_entry.get(year, table_key_entry.get("*"))
            if table_entry is None:
                not_verifiable.append((key, year, "key/year missing from table"))
                continue
            for role in ROLES:
                csv_val = csv_entry[role]
                table_val = table_entry.get(role)
                if isinstance(csv_val, dict) and "1" in csv_val:
                    for t in ("1", "2"):
                        cl = value_labels(csv_val[t], labels)
                        tv = table_val[t] if isinstance(table_val, dict) and "1" in table_val else None
                        tl = value_labels(tv, labels) if tv is not None else None
                        if tv is None:
                            mismatches.append((key, year, role, t, None, csv_val[t]))
                        elif cl != tl:
                            mismatches.append((key, year, role, t, tv, csv_val[t]))
                else:
                    cl = value_labels(csv_val, labels)
                    tl = value_labels(table_val, labels) if table_val is not None else None
                    if table_val is None:
                        mismatches.append((key, year, role, None, None, csv_val))
                    elif cl != tl:
                        mismatches.append((key, year, role, None, table_val, csv_val))

    return mismatches, not_verifiable


def fmt_val(v):
    if v is None:
        return "(missing)"
    if isinstance(v, str):
        return v
    return v["ref"] + " (alt: " + ", ".join(v.get("alt", [])) + ")"


def main():
    csv_entries, unresolved, unknown_names = build_csv_entries()
    table = load_table()

    if unresolved:
        print("=== UNRESOLVED SPLITS (need manual review) ===")
        for year, name, column, raw in unresolved:
            print(f"  {year} / {name} / {column}: {raw!r}")
        print()

    if unknown_names:
        print("=== UNRECOGNIZED CSV LITURGICAL NAMES (not mapped or ignored) ===")
        for year, name in sorted(unknown_names):
            print(f"  {year}: {name!r}")
        print()

    mismatches, not_verifiable = diff_entries(csv_entries, table)

    # Keys in the table never seen in any CSV at all (not verifiable).
    csv_keys = set(csv_entries.keys())
    for key, byyear in table.items():
        for year in byyear.keys():
            years = ["A", "B", "C"] if year == "*" else [year]
            for y in years:
                if key not in csv_keys or y not in csv_entries.get(key, {}):
                    not_verifiable.append((key, y, "not present in this year's CSV"))

    print("=== MISMATCHES ===")
    if not mismatches:
        print("  (none)")
    for key, year, role, track, table_val, csv_val in mismatches:
        label = f"{key}/{year}/{role}" + (f"/track{track}" if track else "")
        print(f"  {label}: was {fmt_val(table_val)} -> now {fmt_val(csv_val)}")
    print()

    print("=== NOT VERIFIABLE FROM CSV ===")
    seen = set()
    for key, year, reason in sorted(set(not_verifiable)):
        tag = (key, year)
        if tag in seen:
            continue
        seen.add(tag)
        print(f"  {key} / {year}: {reason}")
    print()

    print(f"{len(mismatches)} mismatch(es), {len(unresolved)} unresolved split(s), "
          f"{len(unknown_names)} unrecognized name(s)")
    return 1 if (mismatches or unresolved) else 0


if __name__ == "__main__":
    sys.exit(main())
