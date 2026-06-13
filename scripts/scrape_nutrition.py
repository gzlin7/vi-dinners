#!/usr/bin/env python3
"""Scrape per-serving nutrition (and ratings) for every recipe in
hello-fresh.json from the schema.org JSON-LD embedded in each public
HelloFresh recipe page.

Resumable: results append to nutrition.jsonl as they arrive; URLs already
present (success or permanent failure) are skipped on re-run.

Usage:
  python3 scripts/scrape_nutrition.py             # scrape (resumes)
  python3 scripts/scrape_nutrition.py --merge     # merge JSONL into the JSON db
  python3 scripts/scrape_nutrition.py --normalize # flatten existing db in place

Both --merge and --normalize write the recipe's nutrition as flat
top-level columns (calories, protein_g, ...) — all info in one source — and
a numeric base_servings parsed from the yields string ("2 servings" -> 2).
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "src" / "lib" / "data" / "hello-fresh.json"
OUT_PATH = ROOT / "scripts" / "nutrition.jsonl"

DELAY_SECONDS = 2.0
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

LDJSON_RE = re.compile(
    r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', re.S
)

# Flat nutrition columns written onto each recipe (per serving)
NUTRITION_COLS = [
    "calories", "protein_g", "carbs_g", "fat_g",
    "saturated_fat_g", "sugar_g", "fiber_g", "sodium_mg",
]


def parse_base_servings(yields):
    """'2 servings' -> 2; defaults to 2 when unparseable."""
    m = re.search(r"\d+", yields or "")
    return int(m.group(0)) if m else 2


def apply_nutrition(recipe, nutrition):
    """Write nutrition dict as flat top-level columns (drop missing as None)."""
    for col in NUTRITION_COLS:
        recipe[col] = (nutrition or {}).get(col)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_recipes_ldjson(html):
    """All schema.org Recipe objects found in the page's JSON-LD blocks."""
    recipes = []
    for block in LDJSON_RE.findall(html):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if isinstance(item, dict) and "@graph" in item:
                items.extend(item["@graph"])
            if isinstance(item, dict) and item.get("@type") == "Recipe":
                recipes.append(item)
    return recipes


def pick_recipe(recipes, title):
    """Pages can embed JSON-LD for side recipes too; prefer the name that
    best matches our stored title."""
    if not recipes:
        return None

    def score(r):
        name = (r.get("name") or "").lower()
        words = set(re.findall(r"\w+", title.lower()))
        name_words = set(re.findall(r"\w+", name))
        return len(words & name_words)

    return max(recipes, key=score)


def grams(value):
    """'45 g' -> 45.0; returns None if unparseable."""
    if not value:
        return None
    m = re.match(r"([\d.]+)", str(value))
    return float(m.group(1)) if m else None


def scrape():
    db = json.loads(DB_PATH.read_text())
    done = set()
    if OUT_PATH.exists():
        for line in OUT_PATH.read_text().splitlines():
            try:
                done.add(json.loads(line)["url"])
            except (json.JSONDecodeError, KeyError):
                pass

    todo = [r for r in db if r["canonical_url"] not in done]
    print(f"{len(db)} recipes total, {len(done)} done, {len(todo)} to scrape")

    with OUT_PATH.open("a") as out:
        for i, recipe in enumerate(todo):
            url = recipe["canonical_url"]
            record = {"url": url}
            try:
                html = fetch(url)
                ld = pick_recipe(extract_recipes_ldjson(html), recipe["title"])
                if ld is None:
                    record["error"] = "no Recipe JSON-LD"
                else:
                    nut = ld.get("nutrition") or {}
                    record["ld_name"] = ld.get("name")
                    record["nutrition"] = {
                        "calories": grams(nut.get("calories")),
                        "protein_g": grams(nut.get("proteinContent")),
                        "carbs_g": grams(nut.get("carbohydrateContent")),
                        "fat_g": grams(nut.get("fatContent")),
                        "saturated_fat_g": grams(nut.get("saturatedFatContent")),
                        "sugar_g": grams(nut.get("sugarContent")),
                        "fiber_g": grams(nut.get("fiberContent")),
                        "sodium_mg": grams(nut.get("sodiumContent")),
                    }
                    rating = ld.get("aggregateRating") or {}
                    if rating:
                        record["rating"] = {
                            "value": rating.get("ratingValue"),
                            "count": rating.get("ratingCount")
                            or rating.get("reviewCount"),
                        }
            except urllib.error.HTTPError as e:
                record["error"] = f"HTTP {e.code}"
            except Exception as e:  # network blips etc. — retry on next run
                record["transient_error"] = str(e)

            # transient errors are not persisted as done; everything else is
            if "transient_error" in record:
                print(f"[{i+1}/{len(todo)}] RETRY-LATER {url}: "
                      f"{record['transient_error']}", flush=True)
            else:
                out.write(json.dumps(record) + "\n")
                out.flush()
                status = record.get("error", "ok")
                print(f"[{i+1}/{len(todo)}] {status} {url}", flush=True)

            time.sleep(DELAY_SECONDS)


def merge():
    db = json.loads(DB_PATH.read_text())
    by_url = {}
    for line in OUT_PATH.read_text().splitlines():
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if "nutrition" in rec:
            by_url[rec["url"]] = rec

    merged = 0
    for recipe in db:
        recipe["base_servings"] = parse_base_servings(recipe.get("yields"))
        rec = by_url.get(recipe["canonical_url"])
        if rec and rec["nutrition"].get("calories") is not None:
            apply_nutrition(recipe, rec["nutrition"])
            if "rating" in rec:
                recipe["rating"] = rec["rating"]
            merged += 1

    DB_PATH.write_text(json.dumps(db))
    print(f"merged nutrition into {merged}/{len(db)} recipes")


def normalize():
    """One-time in-place migration of the existing db: flatten any nested
    `nutrition` object to top-level columns and add numeric base_servings.
    Idempotent."""
    db = json.loads(DB_PATH.read_text())
    flattened = 0
    for recipe in db:
        recipe["base_servings"] = parse_base_servings(recipe.get("yields"))
        nested = recipe.pop("nutrition", None)
        if nested is not None:
            apply_nutrition(recipe, nested)
            flattened += 1
    with_cal = sum(1 for r in db if r.get("calories") is not None)
    DB_PATH.write_text(json.dumps(db))
    print(f"flattened {flattened} nested blocks; {with_cal}/{len(db)} have "
          f"calories; base_servings set on all")


if __name__ == "__main__":
    if "--merge" in sys.argv:
        merge()
    elif "--normalize" in sys.argv:
        normalize()
    else:
        scrape()
