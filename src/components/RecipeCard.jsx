import React from "react";

const RecipeCard = ({ index, title, image, canonical_url, nutrition, onClick, isLocked }) => {
  return (
    <div
      key={index}
      className={`card ${isLocked ? "locked" : ""
        } bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition`}
    >
      <div
        className="image-wrap relative cursor-pointer"
        onClick={() => onClick(index)}
      >
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        <div className={`lock-overlay ${isLocked ? "locked" : ""}`}>
          <span className="lock-icon">{isLocked ? "🔒" : "🔓"}</span>
        </div>
      </div>
      <a href={canonical_url} target="_blank" rel="noopener noreferrer">
        <div className="p-4 text-center">
          <h3 className="link text-xl font-semibold">{title}</h3>
        </div>
      </a>
      {/* Per-serving macros (only for recipes with scraped nutrition data) */}
      {nutrition && nutrition.calories != null && (
        <div className="px-4 pb-4 -mt-2 text-center text-sm text-gray-500">
          {nutrition.calories} kcal · {nutrition.protein_g}g protein ·{" "}
          {nutrition.carbs_g}g carbs · {nutrition.fat_g}g fat
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
