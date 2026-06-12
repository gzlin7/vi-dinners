#!/usr/bin/env python3
"""Hand-fix ingredient data gaps in hello-fresh.json.

Some rows have a quantity but no unit ("1 Milk", "2 Butter", "0.25
Cilantro"). For countable produce ("1 Lime") that's fine, but measurable
substances need a unit. We insert the unit that the same ingredient name
uses most often elsewhere in the corpus, when that dominant unit is a real
measure (not the filler "unit"), appears >= 10 times, and dominates 2:1 —
plus manual overrides where the corpus is ambiguous.

Prints every rewrite for auditing. Idempotent.
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "src" / "lib" / "data" / "hello-fresh.json"

UNIT_WORDS = {
    "unit", "box", "tablespoon", "teaspoon", "ounce", "cup", "clove", "jar",
    "can", "pound", "gram", "g", "milliliter", "milliliters", "liter",
    "piece", "slice", "bunch", "head", "pinch", "dash", "thumb", "pack",
    "bun", "tube", "fillet", "bottle", "sprig", "leaves", "stalk", "cube",
}
MEASURE_UNITS = {"ounce", "cup", "tablespoon", "teaspoon", "clove", "slice"}
OVERRIDES = {"milk": "cup"}  # corpus is ounce-vs-cup ambiguous; cup is sane

db = json.loads(DB_PATH.read_text())

# dominant unit per ingredient name
units_by_name = defaultdict(Counter)
for r in db:
    for raw in r["ingredients"].split(";"):
        m = re.match(r"^([\d.]+)\s+(\S+)\s+(.*)$", raw.strip())
        if m and m.group(2).lower() in UNIT_WORDS:
            units_by_name[m.group(3).lower()][m.group(2).lower()] += 1

def unit_for(name):
    lower = name.lower()
    if lower in OVERRIDES:
        return OVERRIDES[lower]
    counts = units_by_name.get(lower)
    if not counts:
        return None
    (unit, n), *rest = counts.most_common(2)
    if unit not in MEASURE_UNITS or n < 10:
        return None
    if rest and n < 2 * rest[0][1]:
        return None  # no clear dominance
    return unit

rewrites = Counter()

def fix_row(raw):
    raw = raw.strip()
    m = re.match(r"^([\d.]+)\s+(.*)$", raw)
    if not m:
        return raw
    qty, name = m.groups()
    first = name.split(" ")[0].lower()
    if first in UNIT_WORDS:
        return raw  # already has a unit
    unit = unit_for(name)
    if unit is None:
        return raw
    fixed = f"{qty} {unit} {name}"
    rewrites[f"{raw}  ->  {fixed}"] += 1
    return fixed

for r in db:
    r["ingredients"] = ";".join(fix_row(x) for x in r["ingredients"].split(";"))

print(f"{sum(rewrites.values())} rows rewritten ({len(rewrites)} distinct):")
for k, v in rewrites.most_common():
    print(f"  {v}x  {k}")

DB_PATH.write_text(json.dumps(db))
