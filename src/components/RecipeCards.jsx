import React from "react";
import RecipeCard from "./RecipeCard";

const RecipeCards = ({ recipes, onCardClick, lockedIndices }) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={index}
            index={index}
            {...recipe}
            onClick={onCardClick}
            isLocked={lockedIndices.includes(index)} // Check if the recipe is locked
          />
        ))}
      </div>
    </div>
  );
};

export default RecipeCards;
