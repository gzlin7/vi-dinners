import {React, forwardRef, useImperativeHandle} from "react";
import { hardFilterSubstring, pantryFilterSubstring, groceryDeptFilters } from "../lib/groceryFilters.js"

const ShoppingList = forwardRef(({ selectedRecipes }, ref) => {
  function parseIngredient(ingredient) {
    return ingredient.replace(/^[\d.]+\s+\S+\s+/, '');
  };

  function consolidateIngredients(ingredients) {
    const ingredientMap = new Map();
    const occurrenceMap = new Map();

    ingredients.forEach(item => {
      const match = item.match(/^([\d.]+)\s+(\S+)\s+(.*)$/);
      if (match) {
        const quantity = parseFloat(match[1]);
        const unit = match[2];
        const name = match[3];
        const key = `${unit} ${name}`;

        ingredientMap.set(key, (ingredientMap.get(key) || 0) + quantity);
        occurrenceMap.set(key, (occurrenceMap.get(key) || 0) + 1);
      }
    });

    return Array.from(ingredientMap.entries()).map(([key, quantity]) => {
      const occurrences = occurrenceMap.get(key);
      return occurrences > 1 ? `${quantity} ${key} (${occurrences} recipes)` : `${quantity} ${key}`;
    });
  }

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

  // Alpha sort ingredients and consolidate dupes
  var ingredients = Array.from(ingredientSet);
  ingredients = consolidateIngredients(ingredients);
  ingredients.sort((a, b) => (parseIngredient(a).localeCompare(parseIngredient(b))));

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
    groceryDeptDict[gf.name] = groceryIngredients.filter(ingredient => {
      return gf.keywords.some(substring => ingredient.toLowerCase().includes(substring));
    });
    // remove from master grocery
    groceryIngredients = groceryIngredients.filter(ingredient => {
      return !gf.keywords.some(substring => ingredient.toLowerCase().includes(substring));
    });
  }
  groceryDeptDict["Miscellaneous"] = groceryIngredients;
  
  const getGroceries = () => {
    return groceryDeptDict;
  }

  useImperativeHandle(ref, () => ({
    getGroceries: getGroceries
  }));

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
});

export default ShoppingList;
