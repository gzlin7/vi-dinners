import { useEffect, useRef, useState } from "react";
import { buildMenuUrl } from "../lib/menuShare.js";

// Icons from Font Awesome Free 6.7.2 (CC BY 4.0) — https://fontawesome.com
const ShareIcon = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" className="size-5">
    <path d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47C302.6 213.8 326.1 224 352 224z" />
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 448 512" fill="currentColor" className="size-4">
    <path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z" />
  </svg>
);

// Share button + GitHub-clone-style popover: the menu's link in a readonly
// input you can select, with a copy icon button beside it
const ShareMenu = ({ selectedRecipes, portions }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const toggle = () => {
    if (!open) {
      const { url: u, hash } = buildMenuUrl(selectedRecipes, portions);
      history.replaceState(null, "", hash); // refresh now restores this menu
      setUrl(u);
      setCopied(false);
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={toggle}
        aria-label="Share this menu"
        title="Share this menu"
        className="inline-flex items-center justify-center px-4 py-1.5 rotate-[1.5deg] rounded-md border-[2.5px] border-[#4caf50] text-[#4caf50] transition-colors duration-150 hover:bg-[#4caf50] hover:text-white active:scale-95"
      >
        <ShareIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-80 bg-white rounded-md shadow-lg border border-gray-200 p-3 text-left">
          <p className="text-xs text-gray-600 mb-2">
            Anyone with this link gets this exact menu:
          </p>
          <div className="flex items-stretch gap-1.5">
            <input
              ref={inputRef}
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 select-text text-xs font-mono border border-gray-300 rounded px-2 py-1.5 text-gray-700 bg-gray-50"
            />
            <button
              onClick={copy}
              aria-label="Copy link"
              title="Copy link"
              className="px-2.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
            >
              {copied ? <span className="text-green-700">✓</span> : <CopyIcon />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;
