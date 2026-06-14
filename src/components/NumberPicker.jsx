import PenCircle from "./PenCircle.jsx";

// A label and the selectable values printed like a receipt. The chosen value
// is "marked" by circling it with a hand-drawn loop.
const NumberPicker = ({ label, value, min, max, onChange }) => {
  const nums = [];
  for (let n = min; n <= max; n++) nums.push(n);

  return (
    <div className="flex items-center gap-3">
      <span className="handwritten text-2xl text-gray-700">{label}</span>
      <div className="flex items-center gap-2.5">
        {nums.map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-label={`${label}: ${n}`}
              aria-pressed={active}
              className="relative px-1 font-mono text-xl leading-none"
            >
              <span
                className={
                  active
                    ? "text-gray-900"
                    : "text-gray-400 transition-colors hover:text-gray-700"
                }
              >
                {n}
              </span>
              {active && <PenCircle />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NumberPicker;
