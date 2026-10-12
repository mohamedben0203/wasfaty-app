// Small figures for the scan summary. Each sits next to the number it draws, so the
// number is never told by the drawing alone.

// A score out of 100 as a ring that fills clockwise from the top
export function ScoreRing({ value, caption, label }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div role="img" aria-label={label} className="relative size-28">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-accent/35" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="stroke-accent-dark"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl leading-none font-semibold text-ink">{value}</span>
        <span className="mt-1 text-[0.6875rem] text-slate-500">{caption}</span>
      </div>
    </div>
  );
}

// Where a value sits against its normal range: the teal band is the range, the dot is the value.
// Always left-to-right, like the numbers it stands for.
export function RangeBar({ value, range: [low, high] }) {
  const span = high - low;
  const start = low - span;
  const end = high + span * 1.5;
  const position = (number) => `${(Math.min(Math.max(number, start), end) - start) / (end - start) * 100}%`;

  return (
    <div dir="ltr" aria-hidden="true" className="relative h-3">
      <div className="absolute inset-x-0 top-[3px] h-1.5 rounded-full bg-slate-200" />
      <div
        className="absolute top-[3px] h-1.5 rounded-full bg-accent"
        style={{ left: position(low), width: `${(span / (end - start)) * 100}%` }}
      />
      <div
        className="absolute top-0 size-3 -translate-x-1/2 rounded-full bg-ink ring-2 ring-white"
        style={{ left: position(value) }}
      />
    </div>
  );
}
