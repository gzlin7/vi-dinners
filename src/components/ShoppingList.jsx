import React from "react";
import { hardFilterSubstring, pantryFilterSubstring, groceryDeptFilters } from "../lib/utils.js"

const ShoppingList = ({ selectedRecipes }) => {
  // Extract Ingredients
  const ingredientSet = new Set();
  selectedRecipes.forEach((recipe) => {
    recipe.ingredients
      .split(";")
      .forEach((ingredient) => {
        // Omit if hard filter
        if (!hardFilterSubstring.some(substring => ingredient.toLowerCase().includes(substring))) {
          ingredientSet.add(ingredient);
        }
      });
  });
  const ingredients = Array.from(ingredientSet);

  // Separate pantry ingredients
  let groceryIngredients = ingredients.filter(ingredient => {
    return !pantryFilterSubstring.some(substring => ingredient.toLowerCase().includes(substring));
  });
  const pantryIngredients = ingredients.filter(ingredient => {
    return pantryFilterSubstring.some(substring => ingredient.toLowerCase().includes(substring));
  });

  // Create a filtered list for each grocery dept
  const groceryDeptDict = {};
  for (const gf of groceryDeptFilters) {
    console.log(gf);
    groceryDeptDict[gf.name] = groceryIngredients.filter(ingredient => {
      return gf.keywords.some(substring => ingredient.toLowerCase().includes(substring));
    });
    // remove from master grocery
    groceryIngredients = groceryIngredients.filter(ingredient => {
      return !gf.keywords.some(substring => ingredient.toLowerCase().includes(substring));
    });
  }
  groceryDeptDict["Miscellaneous"] = groceryIngredients;

  return (
    <div className="shopping-list grid grid-cols-2 gap-6">
      {/* Left column: Grocery ingredients */}
      <div className="original-list">
        <h3 className="text-xl font-bold">Grocery list</h3>
        {/* Render each subsection */}
        {Object.entries(groceryDeptDict).map(([key, value]) => (
          <div key={key} className="filter-section mt-4">
            <h4 className="font-bold">{key}</h4>
            <ul className="list-disc pl-4">
              {value.length > 0 ? (
                value.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))
              ) : (
                <li>No ingredients in this category</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Right column: Pantry ingredients */}
      <div className="filtered-list">
        <h3 className="text-xl font-bold">Double check pantry </h3>
        <ul className="list-disc pl-4">
          < li > I always assume you have salt, pepper, sugar, and flour</li>
          {pantryIngredients.length > 0 ? (
            pantryIngredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))
          ) : (
            <li>No additional ingredients in this category</li>
          )
          }
        </ul>
      </div>
    </div>
  );
};

export default ShoppingList;
