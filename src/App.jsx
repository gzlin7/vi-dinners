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
    <div className="w-full min-h-screen p-6">

      <h1 className="handwritten text-5xl font-bold text-center">🍲 VI Dinners 🍽️</h1>

      {/* Slider + action buttons share a row, stack when narrow */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 mt-4">
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

        <div className="flex gap-3">
          <button
            onClick={randomizeRecipes}
            className="handwritten text-2xl px-6 py-1.5 bg-[#f97316] text-white rounded-sm shadow-[2px_4px_6px_rgba(60,35,10,0.3)] transition-all duration-200 ease-in-out hover:bg-[#ea580c] active:scale-95"
          >
            Randomize Recipes
          </button>

          <button
            onClick={exportToPdf}
            className="handwritten text-2xl px-6 py-1.5 bg-[#4caf50] text-white rounded-sm shadow-[2px_4px_6px_rgba(60,35,10,0.3)] transition-all duration-200 ease-in-out hover:bg-[#3d9140] active:scale-95"
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
