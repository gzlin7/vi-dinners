// Hand-drawn red X for marking the hollow checkbox — two slightly curved
// strokes that overshoot the box edges, like crossing a box with a pen.
// Positioned to sit over (and spill past) whatever box it's placed in.
const PenX = () => (
  <svg
    className="pointer-events-none absolute -inset-1.5 text-[#c0392b]"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 6 C 38 34, 60 60, 92 96"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <path
      d="M90 8 C 62 38, 40 60, 8 92"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

export default PenX;
