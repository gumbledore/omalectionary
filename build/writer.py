# Shared compact-JSON writer for the version tables (bsb.json/sblgnt.json/
# wlc.json all share the { book: { chapter(str): { verse(str): text } } }
# shape). Factored out of convert_bsb.py so ticket 05's two new converters
# don't duplicate it.
import json


def write_table(table, out_path, label):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(table, f, ensure_ascii=False, separators=(",", ":"))
    size = out_path.stat().st_size
    print(f"wrote {out_path} ({size / 1024 / 1024:.2f} MB), {len(table)} {label}")
