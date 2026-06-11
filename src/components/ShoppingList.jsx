import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { shouldOmitIngredient, pantryFilterSubstring, classifyIngredient, groceryDeptOrder } from "../lib/groceryFilters.js";
import { aggregateIngredients, displayUnit, formatQuantity } from "../lib/ingredientAggregator.js";

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

const ShoppingList = forwardRef(({ selectedRecipes, portions }, ref) => {
  // Keys of items expanded to show per-recipe portioning
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  // Keys of items checked off while shopping
  const [checkedKeys, setCheckedKeys] = useState(new Set());

  const toggleIn = (setState) => (key) =>
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  const toggleExpanded = toggleIn(setExpandedKeys);
  const toggleChecked = toggleIn(setCheckedKeys);

  // Bins that sit alone in their CSS column grow instead of scrolling beside
  // empty space. CSS multicol doesn't expose column placement, so measure it:
  // with break-inside-avoid each bin's offsetLeft identifies its column. We
  // measure with all bins capped (the baseline layout) and only re-measure on
  // resize/recipe change, so uncapping can't feedback-loop the balancer.
  const binsRef = useRef(null);
  const [lonelyDepts, setLonelyDepts] = useState(() => new Set());
  useEffect(() => {
    let raf;
    const measure = () => {
      const el = binsRef.current;
      if (!el) return;
      const perColumn = new Map();
      for (const child of el.children) {
        const left = Math.round(child.offsetLeft);
        perColumn.set(left, (perColumn.get(left) || 0) + 1);
      }
      const lonely = new Set();
      for (const child of el.children) {
        if (perColumn.get(Math.round(child.offsetLeft)) === 1) {
          lonely.add(child.dataset.dept);
        }
      }
      setLonelyDepts(lonely);
    };
    const remeasure = () => {
      setLonelyDepts(new Set()); // re-cap first so we measure the baseline
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(measure);
      });
    };
    remeasure();
    window.addEventListener("resize", remeasure);
    return () => {
      window.removeEventListener("resize", remeasure);
      cancelAnimationFrame(raf);
    };
  }, [selectedRecipes]);

  const listMaxHeight = (dept) =>
    lonelyDepts.has(dept) ? "max-h-[80vh]" : "max-h-56";

  // Aggregate ingredients across recipes (dedupes same ingredient, sums
  // quantities, keeps per-recipe contributions). Already alpha-sorted.
  // Quantities scale by portions; HelloFresh recipes are written for 2.
  const items = aggregateIngredients(selectedRecipes, {
    shouldOmit: shouldOmitIngredient,
    scale: portions / 2,
  });

  // Separate pantry ingredients
  const matchesPantry = (item) =>
    pantryFilterSubstring.some((substring) => item.key.includes(substring));
  const groceryItems = items.filter((item) => !matchesPantry(item));
  const pantryItems = items.filter(matchesPantry);
  const pantryRemaining = pantryItems.filter(
    (item) => !checkedKeys.has(item.key)
  ).length;

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

  const renderItem = (item) => {
    const checked = checkedKeys.has(item.key);
    return (
      <li key={item.key} className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleChecked(item.key)}
          className="mt-1 shrink-0 cursor-pointer accent-[#187927]"
        />
        <div className={checked ? "line-through text-gray-400" : ""}>
          <span
            onClick={() => item.recipeCount > 1 && toggleExpanded(item.key)}
            className={item.recipeCount > 1 ? "cursor-pointer hover:text-[#ff6347]" : ""}
            title={item.recipeCount > 1 ? "Click to see portions per recipe" : undefined}
          >
            {item.display}
            {item.recipeCount > 1 && <strong> ({item.recipeCount})</strong>}
          </span>
          {expandedKeys.has(item.key) && (
            <ul className="list-none pl-4 text-sm text-gray-600">
              {item.contributions.map((c, i) => (
                <li key={i}>
                  ↳{" "}
                  {c.quantity !== null &&
                    `${formatQuantity(c.quantity)} ${
                      c.unit !== "unit" ? `${displayUnit(c.unit)} ` : ""
                    }`}
                  {item.displayName} — {c.recipeTitle}
                </li>
              ))}
            </ul>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="shopping-list w-full max-w-[1600px] mx-auto mt-6">
      <h3 className="handwritten text-4xl font-bold">Grocery List</h3>

      {/* Department bins: masonry-style columns so bins pack by their own
          height instead of grid rows reserving the tallest bin's height */}
      <div ref={binsRef} className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mt-4">
        {Object.entries(groceryDeptDict)
          .filter(([, deptItems]) => deptItems.length > 0)
          .map(([dept, deptItems]) => {
            const style = deptStyles[dept] || fallbackStyle;
            const remaining = deptItems.filter(
              (item) => !checkedKeys.has(item.key)
            ).length;
            return (
            <div
              key={dept}
              data-dept={dept}
              className="postit-wrap break-inside-avoid mb-4"
            >
            <div className={`${style.bin} postit p-4 text-left`}>
              <h4 className={`handwritten text-2xl flex justify-between border-b ${style.border} pb-1 mb-2`}>
                <span>
                  {style.emoji} {dept}
                </span>
                <span className="text-gray-400">
                  {remaining === 0 ? "✓" : remaining}
                </span>
              </h4>
              <ul className={`pr-1 ${listMaxHeight(dept)} overflow-y-auto space-y-1`}>
                {deptItems.map(renderItem)}
              </ul>
            </div>
            </div>
            );
          })}

        {/* Pantry bin */}
        <div
          data-dept="pantry"
          className="postit-wrap break-inside-avoid mb-4"
        >
        <div className="bg-amber-50 postit p-4 text-left">
          <h4 className="handwritten text-2xl flex justify-between border-b border-amber-200 pb-1 mb-2">
            <span>🧂 Double check pantry</span>
            <span className="text-gray-400">
              {pantryRemaining === 0 ? "✓" : pantryRemaining}
            </span>
          </h4>
          <p className="text-xs text-gray-500 mb-2">
            I always assume you have salt, pepper, sugar, and flour.
          </p>
          <ul className={`pr-1 ${listMaxHeight("pantry")} overflow-y-auto space-y-1`}>
            {pantryItems.length > 0 ? (
              pantryItems.map(renderItem)
            ) : (
              <li>No additional ingredients in this category</li>
            )}
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
});

export default ShoppingList;
