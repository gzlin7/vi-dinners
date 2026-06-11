import React from "react";

// Lock icons from Font Awesome Free 6.7.2 (CC BY 4.0) — https://fontawesome.com
const LockIcon = ({ open }) =>
  open ? (
    <svg className="lock-icon" viewBox="0 0 576 512" fill="currentColor">
      <path d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z" />
    </svg>
  ) : (
    <svg className="lock-icon" viewBox="0 0 448 512" fill="currentColor">
      <path d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z" />
    </svg>
  );

const RecipeCard = ({ index, title, image, canonical_url, nutrition, onClick, isLocked }) => {
  return (
    <div
      key={index}
      className={`card polaroid ${isLocked ? "locked" : ""
        } bg-white shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer`}
      onClick={() => onClick(index)}
    >
      <div className="image-wrap relative">
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        <div className={`lock-overlay ${isLocked ? "locked" : ""}`}>
          <LockIcon open={!isLocked} />
        </div>
      </div>
      {/* Link sits above the card's lock-click: clicking it must not toggle */}
      <a
        href={canonical_url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 text-center">
          {/* Clamp to two lines with matching min-height so all cards stay
              the same size; full title available via native tooltip */}
          <h3
            className="link handwritten text-2xl line-clamp-2 min-h-16"
            title={title}
          >
            {title}
          </h3>
        </div>
      </a>
      {/* Macros from the scraped data, which is already per serving */}
      {nutrition && nutrition.calories != null && (
        <div className="px-4 pb-4 -mt-2 text-center text-sm text-gray-500">
          {nutrition.calories} kcal · {nutrition.protein_g}g protein ·{" "}
          {nutrition.carbs_g}g carbs · {nutrition.fat_g}g fat{" "}
          <span className="text-gray-400">(per serving)</span>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
