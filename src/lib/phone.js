export const DIAL_CODE = "+218";

// Libyan mobile numbers only, same rule as the portal: +218 9[1-5] followed by 7 digits
const LIBYAN_PHONE_REGEX = /^\+2189[1-5][0-9]{7}$/;

// Accepts 0912345678, 912345678, 218912345678, +218912345678 or 00218912345678
export function normalizePhone(value) {
  const raw = value.trim();
  if (!raw) return "";

  if (raw.startsWith("+")) return `+${raw.slice(1).replace(/\D/g, "")}`;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;

  const stripped = digits.replace(/^0+/, "");
  if (stripped.startsWith("218")) return `+${stripped}`;

  return `${DIAL_CODE}${stripped}`;
}

export function isValidPhone(phone) {
  return LIBYAN_PHONE_REGEX.test(phone);
}

export function formatPhone(phone) {
  return phone.replace(/^\+218(\d{2})(\d{3})(\d{4})$/, "+218 $1 $2 $3");
}
