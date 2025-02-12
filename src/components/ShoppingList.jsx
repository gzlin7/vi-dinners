import React from "react";

const ShoppingList = ({ selectedRecipes }) => {
  // Extract unique ingredients
  const getShoppingList = () => {
    const ingredientSet = new Set();
    selectedRecipes.forEach((recipe) => {
      recipe.ingredients
        .split(";")
        .forEach((ingredient) => ingredientSet.add(ingredient));
    });
    return Array.from(ingredientSet);
  };

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Shopping List</h2>
      <ul className="list-disc pl-6">
        {getShoppingList().map((ingredient, idx) => (
          <li key={idx} className="text-gray-700">
            {ingredient}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShoppingList;
