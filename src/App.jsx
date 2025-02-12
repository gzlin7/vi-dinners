import React, { useState } from 'react';
import RecipeCards from "./components/RecipeCards";
import recipes from "./lib/data/allrecipes_mains.json";

function App() {
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  // indexes of locked
  const [lockedRecipes, setlockedRecipes] = useState([]);

  // Function to get 6 random recipes
  const randomizeRecipes = () => {
    const unlockedRecipes = recipes.filter(
      (recipe, index) => !lockedRecipes.includes(index)
    );
    const shuffledRecipes = [...unlockedRecipes];

    // Shuffle only unlocked recipes
    for (let i = shuffledRecipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRecipes[i], shuffledRecipes[j]] = [
        shuffledRecipes[j],
        shuffledRecipes[i],
      ]; // Shuffle array
    }

    // Create the new selectedRecipes array
    const newSelectedRecipes = recipes.map((recipe, index) => {
      // If the recipe is locked, keep it at its original index
      if (lockedRecipes.includes(index)) {
        return recipe;
      } else {
        // Otherwise, take a recipe from the shuffled list (take one from the shuffledRecipes)
        return shuffledRecipes.pop();
      }
    });

    // Ensure we have exactly 6 recipes selected
    setSelectedRecipes(newSelectedRecipes.slice(0, 6));
  };

  // Function to toggle lock/unlock for a recipe by its index
  const toggleLockRecipe = (index) => {
    setlockedRecipes((prevLocked) =>
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
        lockedRecipes={lockedRecipes}
      />
    </div>
  );
}

export default App;
