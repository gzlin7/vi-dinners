import React, { useState, useEffect, useRef } from "react";
import RecipeCards from "./components/RecipeCards";
import ShoppingList from "./components/ShoppingList";
import recipes from "./lib/data/hello-fresh.json";
import { pickBiasedRecipes } from "./lib/recipeScorer.js";
import { parseMenuHash } from "./lib/menuShare.js";
import ShareMenu from "./components/ShareMenu.jsx";
import LeftoverForecast from "./components/LeftoverForecast.jsx";
import OptimizerModal from "./components/OptimizerModal.jsx";

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

  // Populate recipes on first load — unless a shared menu already did
  const skipInitialRandomize = useRef(sharedMenu != null);
  useEffect(() => {
    if (skipInitialRandomize.current) {
      skipInitialRandomize.current = false;
      return;
    }
    randomizeRecipes();
    setlockedIndices([]);
  }, [numDisplayedRecipes]); // Re-randomize when number of recipes changes

  // Re-roll unlocked slots. With minimizeShopping, picks are biased toward
  // sharing high-waste-risk ingredients with the locked recipes (and each
  // other) while avoiding repeated proteins/cuisines; otherwise uniform.
  // Either way, no duplicates within the menu.
  const randomizeRecipes = () => {
    const locked = lockedIndices
      .filter((i) => i < numDisplayedRecipes)
      .map((i) => selectedRecipes[i])
      .filter(Boolean);
    const slotsToFill = numDisplayedRecipes - locked.length;

    let picks;
    if (minimizeShopping) {
      picks = pickBiasedRecipes(recipes, locked, slotsToFill);
    } else {
      const takenUrls = new Set(locked.map((r) => r.canonical_url));
      picks = [];
      while (picks.length < slotsToFill) {
        const r = recipes[Math.floor(Math.random() * numTotalRecipes)];
        if (takenUrls.has(r.canonical_url)) continue;
        takenUrls.add(r.canonical_url);
        picks.push(r);
      }
    }

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

      <h1 className="handwritten text-5xl font-bold text-center">🍲 VI Dinners 🍽️</h1>

      {/* Controls share a row and wrap progressively as the window narrows
          (sliders and buttons break onto their own lines instead of the
          whole row jumping straight to a stack) */}
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-4">
        <div className="flex items-center">
          <label className="handwritten text-2xl mr-3">Number of recipes:</label>
          <input
            type="range"
            min="1"
            max="6"
            value={numDisplayedRecipes}
            onChange={(e) => setNumDisplayedRecipes(parseInt(e.target.value))}
            className="w-40 accent-[#0ea5e9] cursor-pointer"
          />
          <span className="handwritten text-3xl ml-3">{numDisplayedRecipes}</span>
        </div>

        <div className="flex items-center">
          <label className="handwritten text-2xl mr-3">Portions:</label>
          <input
            type="range"
            min="2"
            max="6"
            value={portions}
            onChange={(e) => setPortions(parseInt(e.target.value))}
            className="w-40 accent-[#ef4444] cursor-pointer"
          />
          <span className="handwritten text-3xl ml-3">{portions}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="handwritten text-2xl flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={minimizeShopping}
              onChange={(e) => setMinimizeShopping(e.target.checked)}
              className="size-4 accent-[#f97316] cursor-pointer"
            />
            Reduce leftovers
          </label>
          <button
            onClick={() => setShowOptimizerInfo(true)}
            aria-label="How does this work?"
            title="How does this work?"
            className="size-5 rounded-full border border-gray-400 text-gray-500 text-xs leading-none hover:bg-white hover:text-gray-700"
          >
            ?
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={randomizeRecipes}
            className="handwritten text-2xl inline-flex items-center h-11 px-6 bg-[#f97316] text-white rounded-lg transition-colors duration-150 hover:bg-[#ea580c] active:scale-95"
          >
            Reroll
          </button>

          <ShareMenu selectedRecipes={selectedRecipes} portions={portions} />
        </div>
      </div>

      <OptimizerModal
        open={showOptimizerInfo}
        onClose={() => setShowOptimizerInfo(false)}
      />

      {/* Cards + leftover forecast sidebar (forecast stacks on top when
          the screen is too narrow for a side column) */}
      <div className="flex flex-col lg:flex-row lg:items-start max-w-[1600px] mx-auto">
        <div className="flex-1 min-w-0">
          <RecipeCards
            recipes={selectedRecipes}
            onCardClick={toggleLockRecipe}
            lockedIndices={lockedIndices}
          />
        </div>
        <LeftoverForecast
          selectedRecipes={selectedRecipes}
          portions={portions}
        />
      </div>
        <ShoppingList selectedRecipes={selectedRecipes} portions={portions} />
    </div>
  );
}

export default App;
