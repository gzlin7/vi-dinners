import React, { useState, useEffect, useRef } from "react";
import RecipeCards from "./components/RecipeCards";
import ShoppingList from "./components/ShoppingList";
import recipes from "./lib/data/hello-fresh.json";
import {generatePdf} from "./lib/exportPdf.js";

function App() {
  const shoppingListRef = useRef();
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  // indexes of locked
  const [lockedIndices, setlockedIndices] = useState([]);
  const numTotalRecipes = recipes.length;
  const [numDisplayedRecipes, setNumDisplayedRecipes] = useState(6);

  // Populate recipes on first load
  useEffect(() => {
    randomizeRecipes();
    setlockedIndices([]);
  }, [numDisplayedRecipes]); // Re-randomize when number of recipes changes

  // Function to get desired number (1 to 6) of random recipes
  const randomizeRecipes = () => {
    let newSelectedRecipes = [];
    for (let i = 0; i < numDisplayedRecipes; i++) {
      if (lockedIndices.includes(i)) {
        newSelectedRecipes.push(selectedRecipes[i]);
      } else {
        // could have dupes...
        newSelectedRecipes.push(
          recipes[Math.floor(Math.random() * numTotalRecipes)]
        );
      }
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
    <div className="w-full min-h-screen bg-gray-100 p-6">

      {/* Title + instructions share a row, stack when narrow */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-x-6 gap-y-1">
        <h1 className="text-3xl font-bold whitespace-nowrap">🍲 VI Dinners 🍽️</h1>
        <p className="text-gray-600">
          Click on a recipe's image to lock it. Click on the recipe title to
          visit its website.
        </p>
      </div>

      {/* Slider + action buttons share a row, stack when narrow */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 mt-4">
        <div className="flex items-center">
          <label className="font-semibold mr-2">Number of recipes:</label>
          <input
            type="range"
            min="1"
            max="6"
            value={numDisplayedRecipes}
            onChange={(e) => setNumDisplayedRecipes(parseInt(e.target.value))}
            className="w-40"
          />
          <span className="ml-2 font-bold">{numDisplayedRecipes}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={randomizeRecipes}
            className="px-6 py-3 text-lg bg-[#ff6347] text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-[#e5533d] active:scale-95"
          >
            Randomize Recipes
          </button>

          <button
            onClick={exportToPdf}
            className="px-6 py-3 text-lg bg-[#187927] text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-[#0f5f30] active:scale-95"
          >
            Export as PDF
          </button>
        </div>
      </div>

      <RecipeCards
        recipes={selectedRecipes}
        onCardClick={toggleLockRecipe}
        lockedIndices={lockedIndices}
      />
        <ShoppingList ref={shoppingListRef}  selectedRecipes={selectedRecipes} />
    </div>
  );
}

export default App;
