import { useEffect } from "react";
import { createPortal } from "react-dom";

// Pop-up note showing what a HelloFresh proprietary spice blend consists of
const BlendModal = ({ blend, onClose }) => {
  useEffect(() => {
    if (!blend) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blend, onClose]);

  if (!blend) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="postit-wrap no-tilt w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="postit relative bg-amber-50 p-6 text-left">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            ✕
          </button>
          <h4 className="handwritten text-3xl border-b border-amber-200 pb-1 mb-3">
            🌶️ {blend.name}
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {blend.components.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-4">
            {blend.official
              ? "HelloFresh's officially published ratio."
              : "Copycat approximation — close, not official."}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BlendModal;
