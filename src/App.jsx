import React, { useState, useEffect, useRef, useMemo } from "react";
import RecipeCards from "./components/RecipeCards";
import recipes from "./lib/data/hello-fresh.json";
import { pickBiasedRecipes } from "./lib/recipeScorer.js";
import { parseMenuHash } from "./lib/menuShare.js";
import ShareMenu from "./components/ShareMenu.jsx";
import LeftoverForecast from "./components/LeftoverForecast.jsx";
import OptimizerModal from "./components/OptimizerModal.jsx";
import GroceryDrawer from "./components/GroceryDrawer.jsx";
import NumberPicker from "./components/NumberPicker.jsx";
import PenX from "./components/PenX.jsx";
import { aggregateIngredients } from "./lib/ingredientAggregator.js";
import { shouldOmitIngredient } from "./lib/groceryFilters.js";

// A shared menu link (#m=...&p=...) reproduces that exact layout on load
const sharedMenu = parseMenuHash(recipes);

function App() {
  const [selectedRecipes, setSelectedRecipes] = useState(
    () => sharedMenu?.recipes ?? []
  );
  // indexes of locked
  const [lockedIndices, setlockedIndices] = useState([]);
  const numTotalRecipes = recipes.length;
  const [numDisplayedRecipes, setNumDisplayedRecipes] = useState(
    sharedMenu ? sharedMenu.recipes.length : 6
  );
  // Servings to shop for; recipes are written for 2, so the shopping list
  // scales quantities by portions/2
  const [portions, setPortions] = useState(sharedMenu?.portions ?? 2);
  // Bias rerolls toward sharing high-waste-risk ingredients (fewer groceries)
  const [minimizeShopping, setMinimizeShopping] = useState(true);
  const [showOptimizerInfo, setShowOptimizerInfo] = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);

  // Aggregated grocery items, mirrored from ShoppingList, so the sidebar note
  // can show a count and a short preview that hints at the full list.
  const groceryItems = aggregateIngredients(selectedRecipes, {
    shouldOmit: shouldOmitIngredient,
    portions,
  });
  const groceryItemCount = groceryItems.length;
  // A random teaser of 3 items (alphabetical order otherwise dumps you into
  // "baking powder, baking soda, bay leaf"). Reshuffles only when the set of
  // ingredients changes, so it's stable across unrelated re-renders.
  const groceryKey = groceryItems.map((i) => i.key).join("|");
  const groceryPreview = useMemo(() => {
    const names = groceryItems.map((i) => i.displayName);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    return names.slice(0, 3);
  }, [groceryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate recipes on first load — unless a shared menu already did
  const skipInitialRandomize = useRef(sharedMenu != null);
  useEffect(() => {
    if (skipInitialRandomize.current) {
      skipInitialRandomize.current = false;
      return;
    }
    randomizeRecipes();
  }, []); // Populate once on first load; the count slider grows/shrinks in place

  // Pick `count` fresh recipes that don't duplicate anything in `existing`.
  // With minimizeShopping, picks are biased toward sharing high-waste-risk
  // ingredients with `existing` (and each other) while avoiding repeated
  // proteins/cuisines; otherwise uniform random.
  const pickRecipes = (existing, count) => {
    if (count <= 0) return [];
    if (minimizeShopping) {
      return pickBiasedRecipes(recipes, existing, count);
    }
    const takenUrls = new Set(existing.map((r) => r.canonical_url));
    const picks = [];
    while (picks.length < count) {
      const r = recipes[Math.floor(Math.random() * numTotalRecipes)];
      if (takenUrls.has(r.canonical_url)) continue;
      takenUrls.add(r.canonical_url);
      picks.push(r);
    }
    return picks;
  };

  // Re-roll every unlocked slot at once; locked recipes stay put.
  const randomizeRecipes = () => {
    const locked = lockedIndices
      .filter((i) => i < numDisplayedRecipes)
      .map((i) => selectedRecipes[i])
      .filter(Boolean);
    const picks = pickRecipes(locked, numDisplayedRecipes - locked.length);

    let pickIdx = 0;
    const newSelectedRecipes = [];
    for (let i = 0; i < numDisplayedRecipes; i++) {
      newSelectedRecipes.push(
        lockedIndices.includes(i) && selectedRecipes[i]
          ? selectedRecipes[i]
          : picks[pickIdx++]
      );
    }
    setSelectedRecipes(newSelectedRecipes);
  };

  // Replace just one card with a fresh pick (avoiding duplicates of the rest).
  // Lets you reject a recipe you don't want without first locking everything
  // else to protect it from a mass reroll.
  const rerollRecipe = (index) => {
    setSelectedRecipes((prev) => {
      const others = prev.filter((_, i) => i !== index);
      const [pick] = pickRecipes(others, 1);
      return pick ? prev.map((r, i) => (i === index ? pick : r)) : prev;
    });
  };

  // Grow or shrink the menu in place: existing cards stay exactly where they
  // are (and keep their locks); only newly added slots get fresh picks, and
  // shrinking just drops the trailing cards.
  const changeRecipeCount = (next) => {
    setNumDisplayedRecipes(next);
    setSelectedRecipes((prev) =>
      next <= prev.length
        ? prev.slice(0, next)
        : [...prev, ...pickRecipes(prev, next - prev.length)]
    );
  };

  // Function to toggle lock/unlock for a recipe by its index
  const toggleLockRecipe = (index) => {
    setlockedIndices(
      (prevLocked) =>
        prevLocked.includes(index)
          ? prevLocked.filter((lockedIndex) => lockedIndex !== index) // Remove lock
          : [...prevLocked, index] // Add lock
    );
  };


  return (
    <div className="w-full min-h-screen p-6">

      <h1 className="handwritten text-5xl font-bold text-center">🍲 Mise en Cart 🛒</h1>
      {/* Hand-drawn swash so the title carries character typographically
          rather than leaning on emoji */}
      <svg
        className="mx-auto mt-1 h-3 w-64 text-[#c0392b]"
        viewBox="0 0 240 12"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M3 8 C 50 2, 95 11, 140 5 S 215 3, 237 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p className="handwritten text-2xl text-center text-gray-600 mt-1">
        a week of dinners in one grocery run
      </p>

      {/* Controls on a low, wide bar; selections are circled by hand. Wraps
          progressively as the window narrows rather than stacking all at once. */}
      <div className="flex justify-center mt-6">
        <div className="control-bar select-none flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-x-8 gap-y-3 px-7 py-3.5">
          <NumberPicker
            label="Recipes"
            value={numDisplayedRecipes}
            min={1}
            max={6}
            onChange={changeRecipeCount}
          />

          <NumberPicker
            label="Servings"
            value={portions}
            min={2}
            max={6}
            onChange={setPortions}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimizeShopping((v) => !v)}
              aria-pressed={minimizeShopping}
              className="handwritten text-2xl inline-flex items-center gap-2"
            >
              <span className="relative inline-flex size-5 shrink-0 border-[1.5px] border-gray-400">
                {minimizeShopping && <PenX />}
              </span>
              <span className="text-gray-700">Reduce leftovers</span>
            </button>
            <button
              onClick={() => setShowOptimizerInfo(true)}
              aria-label="How does this work?"
              title="How does this work?"
              className="size-5 shrink-0 rounded-full border border-gray-400 text-xs leading-none text-gray-500 hover:bg-white hover:text-gray-700"
            >
              ?
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={randomizeRecipes}
              className="handwritten text-2xl inline-flex items-center gap-1 rotate-[-1.5deg] rounded-md border-[2.5px] border-[#c0392b] px-5 py-1 text-[#c0392b] transition-colors duration-150 hover:bg-[#c0392b] hover:text-white active:scale-95"
            >
              ↻ Reroll
            </button>

            <ShareMenu selectedRecipes={selectedRecipes} portions={portions} />
          </div>
        </div>
      </div>

      <OptimizerModal
        open={showOptimizerInfo}
        onClose={() => setShowOptimizerInfo(false)}
      />

      {/* Cards + a sidebar holding this menu's two outputs — the leftover
          forecast and the grocery-list opener (the sidebar stacks on top when
          the screen is too narrow for a side column) */}
      <div className="flex flex-col lg:flex-row lg:items-start max-w-[1600px] mx-auto">
        <div className="flex-1 min-w-0">
          <RecipeCards
            recipes={selectedRecipes}
            onCardClick={toggleLockRecipe}
            onReroll={rerollRecipe}
            lockedIndices={lockedIndices}
          />
        </div>
        <aside className="order-first lg:order-none w-full max-w-sm mx-auto lg:mx-0 lg:w-64 lg:shrink-0 lg:sticky lg:top-4 lg:mr-6 mt-5 lg:mt-6 flex flex-col gap-2">
          <LeftoverForecast
            selectedRecipes={selectedRecipes}
            portions={portions}
          />
          <button
            onClick={() => setGroceryOpen(true)}
            className="postit-wrap block w-full text-left"
          >
            <div className="bg-green-50 postit p-4">
              <h4 className="handwritten text-2xl flex justify-between items-baseline border-b border-green-200 pb-1 mb-2">
                <span>🛒 Grocery list</span>
                <span className="text-lg text-gray-400">{groceryItemCount}</span>
              </h4>
              <p className="text-xs text-gray-500 mb-2">
                Everything these recipes need
              </p>
              {groceryItemCount > 0 && (
                <>
                  <ul className="text-sm text-gray-700 space-y-0.5">
                    {groceryPreview.map((name, i) => (
                      <li key={i} className="truncate">• {name}</li>
                    ))}
                  </ul>
                  <span className="mt-2 inline-block text-sm font-medium text-[#187927] underline decoration-dotted underline-offset-2">
                    … show all {groceryItemCount} items
                  </span>
                </>
              )}
            </div>
          </button>
        </aside>
      </div>

      <GroceryDrawer
        open={groceryOpen}
        onClose={() => setGroceryOpen(false)}
        selectedRecipes={selectedRecipes}
        portions={portions}
      />
    </div>
  );
}

export default App;
