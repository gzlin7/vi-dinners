import React, { useState, useEffect, useRef } from "react";
import RecipeCards from "./components/RecipeCards";
import ShoppingList from "./components/ShoppingList";
import recipes from "./lib/data/hello-fresh.json";
import {generatePdf} from "./lib/exportPdf.js";
import { pickBiasedRecipes } from "./lib/recipeScorer.js";
import LeftoverForecast from "./components/LeftoverForecast.jsx";

function App() {
  const shoppingListRef = useRef();
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  // indexes of locked
  const [lockedIndices, setlockedIndices] = useState([]);
  const numTotalRecipes = recipes.length;
  const [numDisplayedRecipes, setNumDisplayedRecipes] = useState(6);
  // Servings to shop for; recipes are written for 2, so the shopping list
  // scales quantities by portions/2
  const [portions, setPortions] = useState(2);
  // Bias rerolls toward sharing high-waste-risk ingredients (fewer groceries)
  const [minimizeShopping, setMinimizeShopping] = useState(true);

  // Populate recipes on first load
  useEffect(() => {
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

  // Function to export shopping list + recipes as PDF
  const exportToPdf = () => {
    generatePdf(selectedRecipes, shoppingListRef.current.getGroceries());
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

        <label className="handwritten text-2xl flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={minimizeShopping}
            onChange={(e) => setMinimizeShopping(e.target.checked)}
            className="size-4 accent-[#f97316] cursor-pointer"
          />
          🧲 Fewer groceries
        </label>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={randomizeRecipes}
            className="handwritten text-2xl px-6 py-1.5 bg-[#f97316] text-white rounded-sm shadow-[2px_4px_6px_rgba(60,35,10,0.3)] transition-all duration-200 ease-in-out hover:bg-[#ea580c] active:scale-95"
          >
            Reroll
          </button>

          <button
            onClick={exportToPdf}
            className="handwritten text-2xl px-6 py-1.5 bg-[#4caf50] text-white rounded-sm shadow-[2px_4px_6px_rgba(60,35,10,0.3)] transition-all duration-200 ease-in-out hover:bg-[#3d9140] active:scale-95"
          >
            Export as PDF
          </button>
        </div>
      </div>

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
        <ShoppingList
          ref={shoppingListRef}
          selectedRecipes={selectedRecipes}
          portions={portions}
        />
    </div>
  );
}

export default App;
