import React from "react";

const RecipeCard = ({ index, title, image, canonical_url, onClick, isLocked }) => {
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
    </div>
  );
};

export default RecipeCard;
