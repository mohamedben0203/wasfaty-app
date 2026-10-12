// "+3", "−1" or "0": a change with its sign always shown
export function formatSigned(number) {
  if (number > 0) return `+${number}`;
  if (number < 0) return `−${Math.abs(number)}`;
  return "0";
}
