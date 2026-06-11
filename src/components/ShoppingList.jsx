import { forwardRef, useImperativeHandle, useState } from "react";
import { hardFilterSubstring, pantryFilterSubstring, groceryDeptFilters } from "../lib/groceryFilters.js";
import { aggregateIngredients } from "../lib/ingredientAggregator.js";

const ShoppingList = forwardRef(({ selectedRecipes }, ref) => {
  // Keys of items expanded to show per-recipe portioning
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Aggregate ingredients across recipes (dedupes same ingredient, sums
  // quantities, keeps per-recipe contributions). Already alpha-sorted.
  const items = aggregateIngredients(selectedRecipes, {
    omitSubstrings: hardFilterSubstring,
  });

  // Separate pantry ingredients
  const matchesPantry = (item) =>
    pantryFilterSubstring.some((substring) => item.key.includes(substring));
  let groceryItems = items.filter((item) => !matchesPantry(item));
  const pantryItems = items.filter(matchesPantry);

  // Create a filtered list for each grocery dept
  const groceryDeptDict = {};
  for (const gf of groceryDeptFilters) {
    groceryDeptDict[gf.name] = groceryItems.filter((item) =>
      gf.keywords.some((substring) => item.key.includes(substring))
    );
    // remove from master grocery
    groceryItems = groceryItems.filter(
      (item) => !gf.keywords.some((substring) => item.key.includes(substring))
    );
  }
  groceryDeptDict["Miscellaneous"] = groceryItems;

  useImperativeHandle(ref, () => ({
    // PDF export consumes plain strings per department
    getGroceries: () =>
      Object.fromEntries(
        Object.entries(groceryDeptDict).map(([dept, deptItems]) => [
          dept,
          deptItems.map((item) => item.display),
        ])
      ),
  }));

  const renderItem = (item) => (
    <li
      key={item.key}
      onClick={() => item.recipeCount > 1 && toggleExpanded(item.key)}
      className={item.recipeCount > 1 ? "cursor-pointer hover:text-[#ff6347]" : ""}
      title={item.recipeCount > 1 ? "Click to see portions per recipe" : undefined}
    >
      {item.display}
      {expandedKeys.has(item.key) && (
        <ul className="list-none pl-4 text-sm text-gray-600">
          {item.contributions.map((c, i) => (
            <li key={i}>
              ↳ {c.original} — {c.recipeTitle}
            </li>
          ))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="shopping-list grid grid-cols-2 gap-6">
      {/* Left column: Grocery ingredients */}
      <div className="original-list">
        <h3 className="text-xl font-bold">Grocery list</h3>
        <p className="text-sm text-gray-500">
          Items marked “(n recipes)” are shared — click one to see each
          recipe’s portion.
        </p>
        {/* Render each subsection */}
        {Object.entries(groceryDeptDict).map(([key, value]) => (
          <div key={key} className="filter-section mt-4">
            <h4 className="font-bold">{key}</h4>
            <ul className="list-disc pl-4">
              {value.length > 0 ? (
                value.map(renderItem)
              ) : (
                <li>No ingredients in this category</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Right column: Pantry ingredients */}
      <div className="filtered-list">
        <h3 className="text-xl font-bold">Double check pantry </h3>
        <ul className="list-disc pl-4">
          <li>I always assume you have salt, pepper, sugar, and flour</li>
          {pantryItems.length > 0 ? (
            pantryItems.map(renderItem)
          ) : (
            <li>No additional ingredients in this category</li>
          )}
        </ul>
      </div>
    </div>
  );
});

export default ShoppingList;
