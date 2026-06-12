// Ingredient aggregation layer: parses raw "<qty> <unit> <Name>" ingredient
// strings from selected recipes, dedupes ingredients that are the same
// (normalizing plurals and unit synonyms), sums quantities, and keeps the
// per-recipe portion breakdown so the UI can show it on request.

const unitSynonyms = {
  tbsp: "tablespoon",
  tbs: "tablespoon",
  tsp: "teaspoon",
  oz: "ounce",
  lb: "pound",
  lbs: "pound",
  g: "gram",
  kg: "kilogram",
  ml: "milliliter",
  l: "liter",
  pc: "piece",
  pcs: "piece",
};

// Naive singularization, good enough for grocery keys ("Tomatoes" -> "tomato",
// "Berries" -> "berry"). Display names always come from the original text.
function singularize(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (/(oes|ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

export function normalizeUnit(unit) {
  const u = singularize(unit.toLowerCase().replace(/\./g, ""));
  return unitSynonyms[u] || u;
}

// The complete unit vocabulary observed in the data. The parser validates
// the unit token against this list — otherwise "1 New York Strip Steak"
// parses as unit "New", name "York Strip Steak" (and "1 Yellow Onion" as a
// "yellow" of onion).
const knownUnits = new Set([
  "unit", "box", "tablespoon", "teaspoon", "ounce", "cup", "clove", "jar",
  "can", "pound", "gram", "kilogram", "milliliter", "liter", "piece",
  "slice", "bunch", "head", "pinch", "dash", "thumb", "pack", "bun",
  "tube", "fillet", "bottle", "sprig", "leave", "stalk", "cube",
]);

const unitAbbrev = { ounce: "oz" };
export function displayUnit(unit) {
  return unitAbbrev[unit] || unit;
}

export function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(singularize)
    .join(" ");
}

// Parses "0.25 cup Panko Breadcrumbs" -> { quantity, unit, name }.
// Some entries have a quantity but no unit word ("2 Garlic", "1 Shallot") —
// those get unit null. Unmeasured ingredients ("Salt") parse to
// { quantity: null, unit: null, name }.
export function parseIngredient(raw) {
  const match = raw.trim().match(/^([\d.]+)\s+(\S+)\s+(.*)$/);
  if (match && knownUnits.has(normalizeUnit(match[2]))) {
    return {
      quantity: parseFloat(match[1]),
      unit: match[2],
      name: match[3].trim(),
    };
  }
  const unitless = raw.trim().match(/^([\d.]+)\s+(.*)$/);
  if (unitless) {
    return {
      quantity: parseFloat(unitless[1]),
      unit: null,
      name: unitless[2].trim(),
    };
  }
  // Stray measure word with no quantity ("unit Olive Oil") — drop the unit
  const stray = raw.trim().match(/^([a-z][\w]*)\s+(.*)$/);
  if (stray && knownUnits.has(normalizeUnit(stray[1]))) {
    return { quantity: null, unit: null, name: stray[2].trim() };
  }
  return { quantity: null, unit: null, name: raw.trim() };
}

// Avoids float noise like 0.30000000000000004 in summed quantities.
export function formatQuantity(quantity) {
  return String(Math.round(quantity * 100) / 100);
}

/**
 * Aggregates ingredients across recipes.
 *
 * Returns a sorted array of items:
 * {
 *   key:          normalized name (stable id),
 *   displayName:  first-seen original name,
 *   display:      full consolidated line, e.g. "1.5 cup + 2 tablespoon Sour Cream",
 *   recipeCount:  number of distinct recipes using it,
 *   contributions: [{ recipeTitle, quantity, unit, original }],
 * }
 *
 * Same ingredient with different units stays one item with the amounts
 * joined by " + " (no cross-unit conversion).
 */
export function aggregateIngredients(
  recipes,
  { shouldOmit = () => false, scale = 1 } = {}
) {
  const itemMap = new Map();

  recipes.forEach((recipe) => {
    if (!recipe) return;
    recipe.ingredients.split(";").forEach((raw) => {
      const { quantity, unit, name } = parseIngredient(raw);
      const key = normalizeName(name);
      if (shouldOmit(raw, key)) return;
      if (!itemMap.has(key)) {
        itemMap.set(key, { key, displayName: name, contributions: [] });
      }
      itemMap.get(key).contributions.push({
        recipeTitle: recipe.title,
        quantity: quantity === null ? null : quantity * scale,
        // unitless counts ("2 Garlic") behave like HelloFresh's filler
        // "unit", so they merge with "2 unit Garlic" style entries
        unit: unit ? normalizeUnit(unit) : "unit",
        original: raw.trim(),
      });
    });
  });

  const items = Array.from(itemMap.values()).map((item) => {
    // Sum per normalized unit; unmeasured contributions count occurrences.
    const unitTotals = new Map();
    item.contributions.forEach(({ quantity, unit }) => {
      if (quantity === null) return;
      unitTotals.set(unit, (unitTotals.get(unit) || 0) + quantity);
    });

    // "unit" is HelloFresh's filler measure word ("2 unit Lime") — drop it
    const amounts = Array.from(unitTotals.entries())
      .map(([unit, total]) =>
        unit === "unit"
          ? formatQuantity(total)
          : `${formatQuantity(total)} ${displayUnit(unit)}`
      )
      .join(" + ");

    const recipeCount = new Set(
      item.contributions.map((c) => c.recipeTitle)
    ).size;

    const display = amounts
      ? `${amounts} ${item.displayName}`
      : item.displayName;

    return { ...item, display, recipeCount };
  });

  items.sort((a, b) => a.key.localeCompare(b.key));
  return items;
}
