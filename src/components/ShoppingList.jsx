import React from "react";

// List of substrings to completely omit
const hardFilterSubstring = ["to taste", "water", "salt", "pepper", "sugar", "flour"];
// List of substrings probably already have
const pantryFilterSubstring = [
  "oil", "butter", "cornstarch",
  "powder", "soy sauce", "garlic", "vinegar", "paprika", "baking", "honey",
  "bay lea", "thyme", "cumin", "basil", "ketchup", "mayonnaise",
  "rosemary", "oregano", "parsley"];
// Measure words
const measureFilterSubstring = [
  "spoon", "cup", "ounce", "oz", "pound", "cube", "slice", "piece", "bunch", "head"
]

// Grocery Dept. separators
const groceryDeptFilters = [
  { name: "Canned Goods", keywords: ["can ", "canned", "cans ", "broth"], },
  {
    name: "Meat", keywords: ["beef", "chicken", "pork", "sausage", "turkey",
      "ham", "fish", "shrimp", "salmon", "bacon", "steak", "chuck", "brisket", "roast",
      "tilapia", "lobster", "cod", "branzino", "trout", "tuna"]
  },
  {
    name: "Produce", keywords: ["carrot", "onion", "celery", "radish",
      "apple", "mushroom", "shallot", "lime", "lemon", "orange", "tomato",
      "lettuce", "cabbage", "potato", "leek", "turnip", "bell", "asparagus",
      "broccoli", "cauliflower", "peas", "beans", "spinach", "green", "berr",
      "squash", "zucc"
    ]
  },
  { name: "Dry Grains", keywords: ["rice", "pasta", "noodle", "shell", "tortilla", "vermicelli"] },
  { name: "Dairy", keywords: ["egg", "milk", "cream", "cheese", "yogurt", "half-and-half"] }
];

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

      {/* Right column: Filtered ingredients */}
      <div className="filtered-list">
        <h3 className="text-xl font-bold">Double check pantry </h3>
        <ul className="list-disc pl-4">
          < li > I'll always assume you have salt, pepper, sugar, and flour, so I omit them! </li>
          {pantryIngredients.length > 0 ? (
            pantryIngredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))
          ) : (
            <li>No ingredients filtered</li>
          )
          }
        </ul>
      </div>
    </div>
  );
};

export default ShoppingList;
