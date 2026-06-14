import { computeLeftovers } from "../lib/leftovers.js";

// Post-it in the sidebar (positioning owned by the parent <aside>). Always
// rendered so the card grid doesn't change width when the list empties. Hover
// an item for what to buy.
const LeftoverForecast = ({ selectedRecipes, portions }) => {
  const leftovers = computeLeftovers(selectedRecipes, portions);

  return (
    <div className="postit-wrap">
      <div className="bg-stone-100 postit p-4 text-left">
        <h4 className="handwritten text-2xl flex justify-between items-baseline border-b border-stone-300 pb-1 mb-2">
          <span>🥡 Leftover forecast</span>
          {leftovers.length > 0 && (
            <span className="text-lg text-gray-400">{leftovers.length}</span>
          )}
        </h4>
        {leftovers.length === 0 ? (
          <p className="text-sm text-gray-600">
            Nothing wasted — this plan uses up what it buys 🎉
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-700 max-h-[60vh] overflow-y-auto pr-1">
            {leftovers.map((l) => (
              <li
                key={l.key}
                title={l.buy}
                className="flex justify-between gap-2"
              >
                <span>{l.name}</span>
                <span className="text-gray-500 whitespace-nowrap">
                  {l.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LeftoverForecast;
