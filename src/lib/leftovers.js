// Leftover forecast: perishables where the store package meaningfully
// outlasts what the selected recipes need.

import { aggregateIngredients, formatQuantity, displayUnit } from "./ingredientAggregator.js";
import { shouldOmitIngredient } from "./groceryFilters.js";
import { storeQuantities } from "./storeQuantities.js";

export function computeLeftovers(selectedRecipes, portions) {
  const items = aggregateIngredients(selectedRecipes, {
    shouldOmit: shouldOmitIngredient,
    portions,
  });

  const leftovers = [];
  for (const item of items) {
    const sq = storeQuantities[item.key];
    if (!sq) continue;
    let needed = 0;
    for (const c of item.contributions) {
      if (c.unit === sq.unit && c.quantity) needed += c.quantity;
    }
    if (!needed) continue;
    const packages = Math.ceil(needed / sq.pkg - 1e-9);
    const leftover = packages * sq.pkg - needed;
    const frac = leftover / (packages * sq.pkg);
    if (frac >= 0.25 && sq.perish >= 0.4) {
      leftovers.push({
        key: item.key,
        name: item.displayName,
        amount: `~${formatQuantity(leftover)}${
          sq.unit !== "unit" ? ` ${displayUnit(sq.unit)}` : ""
        }`,
        buy: `buy ${packages > 1 ? `${packages}× ` : ""}${sq.desc}`,
        score: frac * sq.perish,
      });
    }
  }
  leftovers.sort((a, b) => b.score - a.score);
  return leftovers;
}
