import { useEffect } from "react";
import ShoppingList from "./ShoppingList.jsx";

// The grocery list lives here as a full-width bottom sheet rather than inline
// at the foot of the page: it's opened from the "Grocery list" note in the
// sidebar so the menu's two outputs (leftover forecast + list) sit together
// and the payoff is one click away. Full-width (not a side drawer) so the
// department masonry keeps all its columns.
const GroceryDrawer = ({ open, onClose, selectedRecipes, portions }) => {
  // Close on Escape and lock the page behind the sheet while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet: slides up from the bottom, near-full height */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Grocery list"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-[#efe7d8] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Close button, pinned so it stays reachable while scrolling */}
        <div className="sticky top-0 z-10 flex justify-end px-4 pt-3 pb-0 bg-[#efe7d8]/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            aria-label="Close grocery list"
            className="flex size-9 items-center justify-center rounded-full bg-white text-gray-500 shadow transition hover:text-gray-800 active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* -mt-4 trims ShoppingList's own top margin so the title sits just
            under the ✕ instead of leaving a wide gap */}
        <div className="px-2 pb-10 -mt-4">
          <ShoppingList selectedRecipes={selectedRecipes} portions={portions} />
        </div>
      </div>
    </>
  );
};

export default GroceryDrawer;
