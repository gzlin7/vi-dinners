// Hand-drawn red loop used to "mark" a selection — circle the one you want,
// the way you'd ring a choice on a paper form. Overshoots its start slightly
// so it reads as an organic pen stroke, and stretches to whatever it wraps.
const PenCircle = () => (
  <svg
    className="pointer-events-none absolute -bottom-1 -top-1 left-[-7px] right-[-7px] text-[#c0392b]"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M50 8 C 78 6, 95 28, 90 52 C 86 76, 60 94, 36 90 C 14 86, 4 60, 12 34 C 18 16, 40 6, 64 12"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

export default PenCircle;
