// RecipeCard.jsx
import React from "react";

const RecipeCard = ({ index, name, image_url, url, onClick, isLocked }) => (
  // Recipe card
  <div
    key={index}
    className={`card ${isLocked ? 'locked' : ''} bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition`}
    onClick={() => onClick(index)}
  >
    <img
      src={image_url}
      alt={name}
      className="w-full h-48 object-cover"
    />
    <a href={url} target="_blank" rel="noopener noreferrer">
      <div className="p-4 text-center">
        <h3 className="link text-xl font-semibold">{name}</h3>
      </div>
    </a>
    {isLocked && <div className="lock-indicator">🔒</div>}
  </div>
);
                        
export default RecipeCard;
