#!/usr/bin/env python3
"""Curate hello-fresh.json:

1. Remove marketplace products that aren't meals. The scrape swept in
   HelloFresh add-ons (snack packs, ready-to-bake doughs, raw proteins,
   desserts). Ingredient count separates them cleanly: products have <=3
   ingredients, real recipes have >=7.
2. Null implausible nutrition on real meals. ~56 dinners carry upstream
   per-serving values that can't be right (e.g. 80 kcal lobster ravioli
   dinner); drop the nutrition block so the UI shows nothing instead of
   garbage.
"""

import json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "src" / "lib" / "data" / "hello-fresh.json"

PRODUCT_MAX_INGREDIENTS = 3
IMPLAUSIBLE_KCAL = 400  # no real 2-serving dinner kit is under this per serving

db = json.loads(DB_PATH.read_text())

# Dedupe by canonical_url (the scrape collected the same recipe from
# multiple menu weeks); keep the first occurrence
seen = set()
deduped = []
for r in db:
    if r["canonical_url"] in seen:
        continue
    seen.add(r["canonical_url"])
    deduped.append(r)
print(f"deduped {len(db) - len(deduped)} duplicate rows ({len(db)} -> {len(deduped)})")
db = deduped

products = [r for r in db if len(r["ingredients"].split(";")) <= PRODUCT_MAX_INGREDIENTS]
kept = [r for r in db if len(r["ingredients"].split(";")) > PRODUCT_MAX_INGREDIENTS]

print(f"removing {len(products)} product entries:")
for r in products:
    print(f"  - {r['title'][:80]}")

nulled = 0
for r in kept:
    cal = (r.get("nutrition") or {}).get("calories")
    if cal is not None and cal < IMPLAUSIBLE_KCAL:
        del r["nutrition"]
        nulled += 1

print(f"\nnulled implausible nutrition (<{IMPLAUSIBLE_KCAL} kcal) on {nulled} meals")
print(f"db: {len(db)} -> {len(kept)} recipes")

DB_PATH.write_text(json.dumps(kept))
