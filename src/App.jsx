import React, { useState, useEffect, useRef } from "react";
import RecipeCards from "./components/RecipeCards";
import ShoppingList from "./components/ShoppingList";
import recipes from "./lib/data/allrecipes_mains.json";
import { jsPDF } from "jspdf";

function App() {
  const shoppingListRef = useRef();
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  // indexes of locked
  const [lockedIndices, setlockedIndices] = useState([]);
  const numRecipes = recipes.length;
  3;

  // populate recipes on first load
  useEffect(() => {
    randomizeRecipes();
  }, []);

  // Function to get 6 random recipes
  const randomizeRecipes = () => {
    let newSelectedRecipes = [];
    for (let i = 0; i < 6; i++) {
      if (lockedIndices.includes(i)) {
        newSelectedRecipes.push(selectedRecipes[i]);
      } else {
        // could have dupes...
        newSelectedRecipes.push(
          recipes[Math.floor(Math.random() * numRecipes) - 1]
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
    const doc = new jsPDF();
    doc.html(shoppingListRef.current, {
      callback: function (doc) {
        doc.save('shopping_list-file.pdf');
      },
      margin: [10, 10, 10, 10],
      x: 10,
      y: 10,
      html2canvas: {
        scale: 0.3,  // Reduce scale to make it fit in the PDF (use 1 to keep original size)
      },
      autoPaging: true,  // Automatically adjusts for multi-page content
      maxWidth: 190,  // Max width for the content to avoid overflow (use less than 210 to fit on one page)
    });
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6">

      <h1 className="text-3xl font-bold text-center mb-6">🍲 VI Dinners 🍽️</h1>

      <div className="w-full flex justify-center mt-4">
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

      <h1 className="text-center">Click on a recipe's image to lock it. Click on the recipe title to visit its website.</h1 >

      <RecipeCards
        recipes={selectedRecipes}
        onCardClick={toggleLockRecipe}
        lockedIndices={lockedIndices}
      />
      <div ref={shoppingListRef}> 
      <ShoppingList selectedRecipes={selectedRecipes} />
      </div>
    </div>
  );
}

export default App;
