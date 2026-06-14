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

// arrows-rotate from Font Awesome Free 6.7.2 (CC BY 4.0)
const RefreshIcon = () => (
  <svg className="size-4" viewBox="0 0 512 512" fill="currentColor">
    <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0L125.7 352l34.3 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.7 1z" />
  </svg>
);

const RecipeCard = ({ index, title, image, canonical_url, calories, protein_g, carbs_g, fat_g, onClick, onReroll, isLocked }) => {
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
        {/* Swap just this one card without disturbing the rest */}
        <div className="swap-control group absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReroll(index);
            }}
            aria-label="Swap for another recipe"
            className="flex size-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow backdrop-blur-sm transition hover:bg-white hover:text-[#f97316] active:scale-90"
          >
            <RefreshIcon />
          </button>
          <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            Swap for another
          </span>
        </div>
      </div>
      <div className="px-4 pt-4 text-center">
        {/* Clamp to two lines with matching min-height so all cards stay
            the same size; full title available via native tooltip */}
        <h3
          className="handwritten text-2xl line-clamp-2 min-h-16"
          title={title}
        >
          {title}
        </h3>
      </div>
      {/* Macros from the scraped data, which is already per serving */}
      {calories != null && (
        <div className="px-4 -mt-1 text-center text-sm text-gray-500">
          {calories} kcal · {protein_g}g protein · {carbs_g}g carbs ·{" "}
          {fat_g}g fat
        </div>
      )}
      {/* Explicit link instead of a linked title: on touch devices an
          invisible title-link zone steals taps meant to lock the card */}
      <div className="pb-3 pt-1 text-center">
        <a
          href={canonical_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 text-sm text-[#c4704f] underline decoration-dotted underline-offset-2 hover:text-[#b05f40]"
        >
          View recipe ↗
        </a>
      </div>
    </div>
  );
};

export default RecipeCard;
