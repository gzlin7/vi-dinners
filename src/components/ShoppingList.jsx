import { forwardRef, useImperativeHandle, useState } from "react";
import { shouldOmitIngredient, pantryFilterSubstring, classifyIngredient, groceryDeptOrder } from "../lib/groceryFilters.js";
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
    shouldOmit: shouldOmitIngredient,
  });

  // Separate pantry ingredients
  const matchesPantry = (item) =>
    pantryFilterSubstring.some((substring) => item.key.includes(substring));
  const groceryItems = items.filter((item) => !matchesPantry(item));
  const pantryItems = items.filter(matchesPantry);

  // Bucket by department, in store-walk display order
  const groceryDeptDict = Object.fromEntries(
    groceryDeptOrder.map((dept) => [dept, []])
  );
  groceryItems.forEach((item) => {
    groceryDeptDict[classifyIngredient(item.key)].push(item);
  });

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
    <div className="shopping-list w-full max-w-[1600px] mx-auto mt-6">
      <h3 className="text-xl font-bold">Grocery list</h3>
      <p className="text-sm text-gray-500">
        Items marked “(n recipes)” are shared — click one to see each
        recipe’s portion.
      </p>

      {/* Department bins: responsive grid, each bin scrolls if its list is long */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 items-start">
        {Object.entries(groceryDeptDict)
          .filter(([, deptItems]) => deptItems.length > 0)
          .map(([dept, deptItems]) => (
            <div key={dept} className="bg-white rounded-2xl shadow-md p-4 text-left">
              <h4 className="font-bold flex justify-between border-b border-gray-200 pb-1 mb-2">
                {dept}
                <span className="text-sm font-normal text-gray-400">
                  {deptItems.length}
                </span>
              </h4>
              <ul className="list-disc pl-4 pr-1 max-h-56 overflow-y-auto">
                {deptItems.map(renderItem)}
              </ul>
            </div>
          ))}

        {/* Pantry bin */}
        <div className="bg-amber-50 rounded-2xl shadow-md p-4 text-left">
          <h4 className="font-bold flex justify-between border-b border-amber-200 pb-1 mb-2">
            Double check pantry
            <span className="text-sm font-normal text-gray-400">
              {pantryItems.length}
            </span>
          </h4>
          <p className="text-xs text-gray-500 mb-2">
            I always assume you have salt, pepper, sugar, and flour.
          </p>
          <ul className="list-disc pl-4 pr-1 max-h-56 overflow-y-auto">
            {pantryItems.length > 0 ? (
              pantryItems.map(renderItem)
            ) : (
              <li>No additional ingredients in this category</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
});

export default ShoppingList;
