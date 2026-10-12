import { MAX_USER_AGE, MIN_USER_AGE } from "./supabase";

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Earliest and latest birth dates the profile accepts, as yyyy-mm-dd for <input type="date">
export function getDobBounds() {
  const today = new Date();
  const min = new Date(today.getFullYear() - MAX_USER_AGE - 1, today.getMonth(), today.getDate() + 1);
  const max = new Date(today.getFullYear() - MIN_USER_AGE, today.getMonth(), today.getDate());
  return { min: isoDate(min), max: isoDate(max) };
}

export function isValidDob(dob) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const { min, max } = getDobBounds();
  return dob >= min && dob <= max;
}
