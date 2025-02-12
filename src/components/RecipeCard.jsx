import React, { useState } from "react";
import { createPortal } from "react-dom";



const RecipeCard = ({ index, name, image_url, url, ingredients, onClick, isLocked }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (event) => {
    const { clientX, clientY } = event; // Get mouse position
    setPosition({
      top: clientY, 
      left: clientX,
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div
      key={index}
      className={`card ${
        isLocked ? "locked" : ""
      } bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition`}
      onClick={() => onClick(index)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img src={image_url} alt={name} className="w-full h-48 object-cover" />
      <a href={url} target="_blank" rel="noopener noreferrer">
        <div className="p-4 text-center">
          <h3 className="link text-xl font-semibold">{name}</h3>
        </div>
      </a>
      {isLocked && <div className="lock-indicator">🔒</div>}
      {/* Tooltip using Portal to prevent cropping */}
      {showTooltip &&
        createPortal(
          <div
            className="fixed bg-black text-white text-sm p-2 rounded shadow-lg w-56"
            style={{
              position: "absolute",
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 1000, // Ensure it's above everything
            }}
          >
            <h4 className="font-bold">Ingredients:</h4>
            <ul className="list-disc pl-4">
              {ingredients.split(";").map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>,
          document.body // This ensures the tooltip is rendered outside of the parent container
        )}
    </div>
  );
};

export default RecipeCard;
