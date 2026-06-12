import { useEffect } from "react";
import { createPortal } from "react-dom";

// Pop-up note explaining the "Reduce leftovers" reroll optimization
const OptimizerModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="postit-wrap no-tilt w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="postit relative bg-stone-100 p-6 text-left max-h-[85vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            ✕
          </button>
          <h4 className="handwritten text-3xl border-b border-stone-300 pb-1 mb-3">
            How "Reduce leftovers" works
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            Stores sell fixed package sizes — a bunch of cilantro for a recipe
            that needs a quarter of it. Each reroll scores every candidate
            recipe against what's already on the board (locked recipes and
            picks so far), then samples — better scores are more likely, but
            every roll stays random.
          </p>
          <div className="bg-white/70 rounded p-3 font-mono text-xs text-gray-800 space-y-2 mb-3">
            <div>
              score = 1.8 · Σ<sub>i</sub> Δleftover<sub>i</sub> −
              1.5·sameProtein − 0.5·sameCuisine + 0.3·(rating − 4)
            </div>
            <div>
              leftover<sub>i</sub>(q) = perish<sub>i</sub> ·
              (⌈q/pkg<sub>i</sub>⌉·pkg<sub>i</sub> − q) / pkg<sub>i</sub>
            </div>
            <div>
              Δleftover<sub>i</sub> = leftover<sub>i</sub>(q<sub>cart</sub>) −
              leftover<sub>i</sub>(q<sub>cart</sub> + need<sub>i</sub>)
            </div>
            <div>
              P(pick candidate) ∝ e<sup>score / T</sup>, T = 1
            </div>
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
            <li>
              <strong>pkg<sub>i</sub></strong> is the store package size
              (sour cream = 16 oz tub, buns = 8-pack) and{" "}
              <strong>perish<sub>i</sub></strong> is how fast leftovers spoil
              (cilantro 1.0, eggs 0.3, rice 0) — hand-curated for ~130 common
              ingredients.
            </li>
            <li>
              A recipe that tops up an already-open package scores positive;
              one that forces opening another perishable package scores
              negative. The leftover forecast you see is exactly this
              quantity.
            </li>
            <li>
              Repeating a protein or a specific cuisine is penalized, so the
              cart consolidates without the menu getting monotonous.
            </li>
            <li>
              Ingredients without package data fall back to coarse
              department-level weights; ratings give a small nudge toward
              well-reviewed recipes.
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            Measured vs uniform random: ~47% less perishable leftover mass in
            a 6-recipe menu, with protein variety unchanged.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OptimizerModal;
