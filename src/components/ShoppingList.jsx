import { forwardRef, useImperativeHandle, useState } from "react";
import { shouldOmitIngredient, pantryFilterSubstring, classifyIngredient, groceryDeptOrder } from "../lib/groceryFilters.js";
import { aggregateIngredients } from "../lib/ingredientAggregator.js";

// Per-department bin color + icon (full literal class names so Tailwind
// generates them)
const deptStyles = {
  "Produce": { emoji: "🥬", bin: "bg-green-50", border: "border-green-200" },
  "Meat & Seafood": { emoji: "🥩", bin: "bg-red-50", border: "border-red-200" },
  "Dairy & Eggs": { emoji: "🥛", bin: "bg-sky-50", border: "border-sky-200" },
  "Bakery & Bread": { emoji: "🥖", bin: "bg-orange-50", border: "border-orange-200" },
  "Dry Goods & Pasta": { emoji: "🍝", bin: "bg-yellow-50", border: "border-yellow-200" },
  "Canned & Jarred": { emoji: "🥫", bin: "bg-teal-50", border: "border-teal-200" },
  "Sauces & Condiments": { emoji: "🫙", bin: "bg-purple-50", border: "border-purple-200" },
  "Spices & Seasonings": { emoji: "🌶️", bin: "bg-rose-50", border: "border-rose-200" },
  "Miscellaneous": { emoji: "🛒", bin: "bg-gray-50", border: "border-gray-200" },
};
const fallbackStyle = { emoji: "🛒", bin: "bg-white", border: "border-gray-200" };

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
          deptItems.map((item) =>
            item.recipeCount > 1
              ? `${item.display} (${item.recipeCount})`
              : item.display
          ),
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
      {item.recipeCount > 1 && <strong> ({item.recipeCount})</strong>}
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
        Items marked <strong>(n)</strong> are shared by n recipes — click one
        to see each recipe’s portion.
      </p>

      {/* Department bins: masonry-style columns so bins pack by their own
          height instead of grid rows reserving the tallest bin's height */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mt-4">
        {Object.entries(groceryDeptDict)
          .filter(([, deptItems]) => deptItems.length > 0)
          .map(([dept, deptItems]) => {
            const style = deptStyles[dept] || fallbackStyle;
            return (
            <div
              key={dept}
              className={`${style.bin} rounded-2xl shadow-md p-4 text-left break-inside-avoid mb-4`}
            >
              <h4 className={`font-bold flex justify-between border-b ${style.border} pb-1 mb-2`}>
                <span>
                  {style.emoji} {dept}
                </span>
                <span className="text-sm font-normal text-gray-400">
                  {deptItems.length}
                </span>
              </h4>
              <ul className="list-disc pl-4 pr-1 max-h-56 overflow-y-auto">
                {deptItems.map(renderItem)}
              </ul>
            </div>
            );
          })}

        {/* Pantry bin */}
        <div className="bg-amber-50 rounded-2xl shadow-md p-4 text-left break-inside-avoid mb-4">
          <h4 className="font-bold flex justify-between border-b border-amber-200 pb-1 mb-2">
            <span>🧂 Double check pantry</span>
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
