import React, { useState, useEffect } from "react";
import RecipeCards from "./components/RecipeCards";
import ShoppingList from "./components/ShoppingList";
import recipes from "./lib/data/allrecipes_mains.json";

function App() {
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

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">VI Dinners</h1>
      <button onClick={randomizeRecipes}>Randomize 6 Recipes</button>
      <RecipeCards
        recipes={selectedRecipes}
        onCardClick={toggleLockRecipe}
        lockedIndices={lockedIndices}
      />
      <ShoppingList selectedRecipes={selectedRecipes} />
    </div>
  );
}

export default App;
