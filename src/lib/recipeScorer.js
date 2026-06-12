// Reroll biasing: score candidate recipes against already-chosen ones so
// menus consolidate the shopping cart without getting monotonous.
//
// Waste and monotony live on different ingredients: store-quantity overhang
// is worst for herbs/dairy/jars (you buy a bunch of cilantro for 0.25 oz)
// and mild for proteins (you buy what the recipe needs) — while monotony is
// driven by repeated protein/cuisine, not by two recipes sharing scallions.
// So shared ingredients earn waste-weighted credit, repeated protein or
// cuisine pays a penalty, and selection samples softmax instead of argmax.

import { parseIngredient, normalizeName, normalizeUnit } from "./ingredientAggregator.js";
import {
  shouldOmitIngredient,
  pantryFilterSubstring,
  classifyIngredient,
  groceryDeptFilters,
} from "./groceryFilters.js";
import { storeQuantities } from "./storeQuantities.js";

// Fallback when an ingredient has no storeQuantities entry: coarse
// store-quantity overhang by department
const deptWasteWeight = {
  "Produce": 1.0,
  "Dairy & Eggs": 0.9,
  "Bakery & Bread": 0.8,
  "Sauces & Condiments": 0.8,
  "Canned & Jarred": 0.5,
  "Miscellaneous": 0.5,
  "Spices & Seasonings": 0.3,
  "Dry Goods & Pasta": 0.2,
  "Meat & Seafood": 0.2,
};

const PROTEIN_PENALTY = 1.5;
const CUISINE_PENALTY = 0.5;
const RATING_WEIGHT = 0.3; // per star away from 4.0
const TEMPERATURE = 1.0;
// Scales leftoverFraction × perish (0..1) into the same dynamic range the
// softmax was tuned for
const WASTE_SCALE = 1.8;

// Word-boundary matchers for identifying a recipe's protein(s)
const meatKeywords = groceryDeptFilters
  .find((gf) => gf.name === "Meat & Seafood")
  .keywords.map((k) => ({ k, re: new RegExp(`\\b${k}\\b`) }));

// Per-ingredient waste weight: with a storeQuantities entry, the real
// objective — what fraction of the store package is typically left over,
// scaled by how fast it dies. Eggs (dozen, keeps weeks, mostly used) score
// low; cilantro (bunch for 0.25 oz, dies in days) scores max. Median
// per-recipe need comes from the corpus, supplied by getIndex below.
const wasteWeightCache = new Map();
function wasteWeight(key, medianNeed) {
  if (!wasteWeightCache.has(key)) {
    const sq = storeQuantities[key];
    let w;
    if (sq) {
      const need = medianNeed?.get(key)?.[sq.unit];
      const leftoverFrac =
        need != null ? Math.max(0, (sq.pkg - need) / sq.pkg) : 0.5;
      w = WASTE_SCALE * leftoverFrac * sq.perish;
    } else {
      w = deptWasteWeight[classifyIngredient(key)] ?? 0.5;
    }
    wasteWeightCache.set(key, w);
  }
  return wasteWeightCache.get(key);
}

// "North America" covers 60% of the catalog and "0" is missing data —
// neither says anything about monotony
const genericCuisines = new Set(["North America", "0", "Fusion", null, undefined]);

function indexRecipe(recipe) {
  const keys = new Set();
  const proteins = new Set();
  const needs = []; // [key, qty] in the storeQuantities unit, for marginal waste
  for (const raw of recipe.ingredients.split(";")) {
    const { quantity, unit, name } = parseIngredient(raw);
    const key = normalizeName(name);
    if (shouldOmitIngredient(raw, key)) continue;
    if (pantryFilterSubstring.some((p) => key.includes(p))) continue;
    keys.add(key);
    for (const { k, re } of meatKeywords) if (re.test(key)) proteins.add(k);
    const sq = storeQuantities[key];
    if (sq && quantity != null && unit != null && normalizeUnit(unit) === sq.unit) {
      needs.push([key, quantity]);
    }
  }
  return {
    recipe,
    keys,
    proteins,
    needs,
    cuisine: genericCuisines.has(recipe.cuisine) ? null : recipe.cuisine,
    rating: parseFloat(recipe.rating?.value) || null,
  };
}

let cachedIndex = null;
let cachedMedianNeed = null;
let cachedSource = null;
function getIndex(recipes) {
  if (cachedSource !== recipes) {
    cachedIndex = recipes.map(indexRecipe);
    // median per-recipe quantity for each key+unit, for leftover fractions
    const qtys = new Map();
    for (const r of recipes) {
      for (const raw of r.ingredients.split(";")) {
        const { quantity, unit, name } = parseIngredient(raw);
        if (quantity == null || unit == null) continue;
        const key = normalizeName(name);
        const u = normalizeUnit(unit);
        if (!qtys.has(key)) qtys.set(key, {});
        (qtys.get(key)[u] ??= []).push(quantity);
      }
    }
    cachedMedianNeed = new Map();
    for (const [key, byUnit] of qtys) {
      const medians = {};
      for (const [u, list] of Object.entries(byUnit)) {
        list.sort((a, b) => a - b);
        medians[u] = list[Math.floor(list.length / 2)];
      }
      cachedMedianNeed.set(key, medians);
    }
    wasteWeightCache.clear();
    cachedSource = recipes;
  }
  return cachedIndex;
}

// Perish-weighted leftover mass (in fractions of a package) for buying
// `need` of an ingredient
function leftoverCost(sq, need) {
  if (need <= 0) return 0;
  const packages = Math.ceil(need / sq.pkg - 1e-9);
  return (sq.perish * (packages * sq.pkg - need)) / sq.pkg;
}

function scoreEntry(entry, targetKeys, targetProteins, targetCuisines, runningNeed) {
  let s = 0;
  // Marginal forecast change for reference-covered ingredients: reusing an
  // open package scores positive; forcing another perishable package
  // scores negative. This is exactly the leftover-forecast objective.
  const marginalKeys = new Set();
  for (const [k, qty] of entry.needs) {
    marginalKeys.add(k);
    const sq = storeQuantities[k];
    const before = runningNeed.get(k) || 0;
    s += WASTE_SCALE * (leftoverCost(sq, before) - leftoverCost(sq, before + qty));
  }
  // Static overlap weight for shared ingredients the reference doesn't cover
  for (const k of entry.keys) {
    if (!marginalKeys.has(k) && targetKeys.has(k)) {
      s += wasteWeight(k, cachedMedianNeed);
    }
  }
  for (const p of entry.proteins) {
    if (targetProteins.has(p)) {
      s -= PROTEIN_PENALTY;
      break;
    }
  }
  if (entry.cuisine && targetCuisines.has(entry.cuisine)) s -= CUISINE_PENALTY;
  if (entry.rating) s += RATING_WEIGHT * (entry.rating - 4);
  return s;
}

function softmaxSample(entries, scores) {
  const max = Math.max(...scores);
  const weights = scores.map((s) => Math.exp((s - max) / TEMPERATURE));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return entries.length - 1;
}

/**
 * Pick `count` recipes biased toward sharing high-waste-risk ingredients
 * with `anchors` (locked recipes) and with each other, while avoiding
 * repeated proteins/cuisines. Greedy-sequential with softmax sampling.
 */
export function pickBiasedRecipes(recipes, anchors, count) {
  const index = getIndex(recipes);
  const anchorEntries = anchors.filter(Boolean).map(indexRecipe);

  const targetKeys = new Set();
  const targetProteins = new Set();
  const targetCuisines = new Set();
  // Running quantity needed per reference-covered ingredient, so marginal
  // scoring knows what's already in the cart
  const runningNeed = new Map();
  const taken = new Set(anchors.filter(Boolean).map((r) => r.canonical_url));

  const absorb = (entry) => {
    entry.keys.forEach((k) => targetKeys.add(k));
    entry.proteins.forEach((p) => targetProteins.add(p));
    if (entry.cuisine) targetCuisines.add(entry.cuisine);
    for (const [k, qty] of entry.needs) {
      runningNeed.set(k, (runningNeed.get(k) || 0) + qty);
    }
  };
  anchorEntries.forEach(absorb);

  const picks = [];
  for (let i = 0; i < count; i++) {
    const candidates = index.filter((e) => !taken.has(e.recipe.canonical_url));
    if (candidates.length === 0) break;
    const scores = candidates.map((e) =>
      scoreEntry(e, targetKeys, targetProteins, targetCuisines, runningNeed)
    );
    const chosen = candidates[softmaxSample(candidates, scores)];
    picks.push(chosen.recipe);
    taken.add(chosen.recipe.canonical_url);
    absorb(chosen);
  }
  return picks;
}
