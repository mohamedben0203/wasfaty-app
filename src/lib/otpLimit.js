// Limits how often a verification code can be requested for one phone number:
// one code every 5 minutes, and the first code plus 2 resends in any hour.
// Enforced in this browser only. The database's own limit (3 codes per 15 minutes, shared
// with the kiosk) is looser and is the only one that holds against someone bypassing the app.

import { isMockPhone } from "./mock";

export const RESEND_COOLDOWN_SECONDS = 5 * 60;
export const MAX_CODES_PER_HOUR = 3;

const STORAGE_KEY = "wasfati_otp_sends";
const HOUR_MS = 60 * 60 * 1000;

function readSends() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function recentSends(phone, now) {
  return (readSends()[phone] || []).filter((sentAt) => now - sentAt < HOUR_MS);
}

export function getOtpStatus(phone, now = Date.now()) {
  const sends = recentSends(phone, now);
  const lastSend = sends[sends.length - 1];
  const cooldownMs = lastSend ? RESEND_COOLDOWN_SECONDS * 1000 - (now - lastSend) : 0;
  // Once the hourly allowance is used, the next code has to wait for the oldest send to age out.
  const hourlyMs = sends.length >= MAX_CODES_PER_HOUR ? HOUR_MS - (now - sends[0]) : 0;

  return {
    hasRecentCode: cooldownMs > 0,
    resendsLeft: Math.max(0, MAX_CODES_PER_HOUR - sends.length),
    secondsUntilNext: Math.max(0, Math.ceil(Math.max(cooldownMs, hourlyMs) / 1000)),
  };
}

export function recordOtpSend(phone, now = Date.now()) {
  // The test number sends nothing, so it has nothing to limit (and nothing of it is stored)
  if (isMockPhone(phone)) return;

  const all = readSends();
  all[phone] = [...recentSends(phone, now), now];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // without storage the database limit still applies
  }
}
