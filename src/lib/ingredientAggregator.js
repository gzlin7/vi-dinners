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

export function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(singularize)
    .join(" ");
}

// Parses "0.25 cup Panko Breadcrumbs" -> { quantity, unit, name }.
// Unmeasured ingredients ("Salt") parse to { quantity: null, unit: null, name }.
export function parseIngredient(raw) {
  const match = raw.trim().match(/^([\d.]+)\s+(\S+)\s+(.*)$/);
  if (match) {
    return {
      quantity: parseFloat(match[1]),
      unit: match[2],
      name: match[3].trim(),
    };
  }
  return { quantity: null, unit: null, name: raw.trim() };
}

// Avoids float noise like 0.30000000000000004 in summed quantities.
function formatQuantity(quantity) {
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
export function aggregateIngredients(recipes, { shouldOmit = () => false } = {}) {
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
        quantity,
        unit: unit ? normalizeUnit(unit) : null,
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

    const amounts = Array.from(unitTotals.entries())
      .map(([unit, total]) => `${formatQuantity(total)} ${unit}`)
      .join(" + ");

    const recipeCount = new Set(
      item.contributions.map((c) => c.recipeTitle)
    ).size;

    let display = amounts ? `${amounts} ${item.displayName}` : item.displayName;
    if (recipeCount > 1) display += ` (${recipeCount} recipes)`;

    return { ...item, display, recipeCount };
  });

  items.sort((a, b) => a.key.localeCompare(b.key));
  return items;
}
