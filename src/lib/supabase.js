// Talks to the same Supabase project as wasfati-portal, with plain fetch like the portal does.
// Accounts are phone + password; Supabase Auth sees the phone as an internal email alias.

import { isMockPhone, isMockUser, mock } from "./mock";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AUTH_EMAIL_DOMAIN = "internal.wasfati.com";
const SESSION_KEY = "wasfati_session";

export const MIN_USER_AGE = 12;
export const MAX_USER_AGE = 99;
export const MIN_PASSWORD_LENGTH = 6;

function authEmailForPhone(phone) {
  return `${phone.replace(/\D/g, "")}@${AUTH_EMAIL_DOMAIN}`;
}

async function request(path, { method = "GET", body, token, prefer } = {}) {
  let response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { data: null, error: { code: "network" } };
  }

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body; treated as empty
  }

  if (!response.ok) {
    return {
      data: null,
      error: {
        status: response.status,
        code: json?.code || json?.error_code,
        message: json?.error_description || json?.msg || json?.message || "",
      },
    };
  }

  return { data: json, error: null };
}

// ---- session -------------------------------------------------------------

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(session) {
  const stored = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    user_id: session.user?.id,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  } catch {
    // without storage the user simply has to log in again next visit
  }
  return stored;
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing to clear
  }
}

// Returns a usable session, refreshing the access token when it is about to expire.
async function currentSession() {
  const session = readSession();
  if (!session?.access_token) return null;
  if (session.expires_at - Date.now() / 1000 > 60) return session;
  if (!session.refresh_token) return null;

  const { data, error } = await request("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: session.refresh_token },
  });

  if (error) {
    // Keep the session on a network blip; drop it only when Supabase rejects the refresh token.
    if (error.code !== "network") clearSession();
    return null;
  }

  return saveSession(data);
}

// ---- profile, results and credits ----------------------------------------

async function fetchProfile(session) {
  const { data, error } = await request(
    `/rest/v1/users?id=eq.${encodeURIComponent(session.user_id)}&limit=1`,
    { token: session.access_token }
  );

  if (error) return { data: null, error };
  if (!data?.[0]) return { data: null, error: { code: "profile_missing" } };
  return { data: data[0], error: null };
}

export async function restoreUser() {
  const session = await currentSession();
  if (!session) return null;

  const { data } = await fetchProfile(session);
  return data;
}

// Changes fields on the user's own profile and returns the row as saved.
// The database checks the values too: the allowed age range, and at most 3 known goals.
export async function updateProfile(user, changes) {
  if (isMockUser(user)) return mock.updateProfile(changes);

  const session = await currentSession();
  if (!session) return { data: null, error: { code: "signed_out" } };

  const { data, error } = await request(`/rest/v1/users?id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    body: changes,
    token: session.access_token,
    prefer: "return=representation",
  });

  if (error) return { data: null, error };
  if (!data?.[0]) return { data: null, error: { code: "profile_missing" } };
  return { data: data[0], error: null };
}

export async function listExams(user) {
  if (isMockUser(user)) return mock.listExams();

  const session = await currentSession();
  if (!session) return { data: null, error: { code: "signed_out" } };

  // Older rows may not be linked by user_id yet; the device stores the phone without the "+".
  const phoneDigits = user.phone.replace(/\D/g, "");
  const filter = `or=(user_id.eq.${user.id},person_idnumber.eq.${phoneDigits})`;
  const columns = "exam_no,received_at,weight_value,bmi_value,bmi_raw,score";

  return request(
    `/rest/v1/exams?select=${columns}&${filter}&order=received_at.desc`,
    { token: session.access_token }
  );
}

// The balance is read again each time: a scan at the kiosk changes it while the app stays open.
export async function getCredits(user) {
  if (isMockUser(user)) return mock.getCredits();

  const session = await currentSession();
  if (!session) return { data: null, error: { code: "signed_out" } };

  const id = encodeURIComponent(user.id);
  const columns = "id,created_at,amount,reason,paid_amount_dinar,balance_after";
  const [profile, transactions] = await Promise.all([
    request(`/rest/v1/users?select=credits&id=eq.${id}&limit=1`, { token: session.access_token }),
    request(
      `/rest/v1/credit_transactions?select=${columns}&user_id=eq.${id}&order=created_at.desc&limit=100`,
      { token: session.access_token }
    ),
  ]);

  const error = profile.error || transactions.error;
  if (error) return { data: null, error };

  return {
    data: { balance: profile.data?.[0]?.credits ?? 0, transactions: transactions.data ?? [] },
    error: null,
  };
}

// ---- auth ----------------------------------------------------------------

export async function signIn({ phone, password }) {
  if (isMockPhone(phone)) return mock.signIn({ password });

  const { data, error } = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email: authEmailForPhone(phone), password },
  });

  if (error) return { data: null, error };

  const session = saveSession(data);
  const profile = await fetchProfile(session);
  if (profile.error) clearSession();
  return profile;
}

export async function signOut() {
  const session = readSession();
  clearSession();
  if (session?.access_token) {
    await request("/auth/v1/logout", { method: "POST", token: session.access_token });
  }
}

export async function phoneExists(phone) {
  if (isMockPhone(phone)) return mock.phoneExists();

  const { data, error } = await request("/rest/v1/rpc/phone_exists", {
    method: "POST",
    body: { p_phone: phone },
  });

  if (error) return { data: null, error };
  return { data: Boolean(data), error: null };
}

export async function requestOtp({ phone, language }) {
  if (isMockPhone(phone)) return mock.requestOtp();

  const { data, error } = await request("/rest/v1/rpc/request_auth_otp", {
    method: "POST",
    body: { customer_number: phone, language, expiry_minutes: 10 },
  });

  if (error?.message?.toLowerCase().includes("too many otp requests")) {
    return { data: null, error: { ...error, code: "otp_rate_limited" } };
  }
  return { data, error };
}

export async function verifyOtp({ phone, otp }) {
  if (isMockPhone(phone)) return mock.verifyOtp({ otp });

  const { data, error } = await request("/rest/v1/rpc/verify_auth_otp", {
    method: "POST",
    body: { customer_number: phone, otp },
  });

  if (error) return { data: null, error };
  if (!data) return { data: null, error: { code: "otp_invalid" } };
  return { data: true, error: null };
}

// Creates the Supabase Auth account, then the profile row. The profile RPC only succeeds
// when this phone verified an OTP in the last 30 minutes.
export async function signUp({ phone, password, name, dob, sex, language }) {
  if (isMockPhone(phone)) return mock.signUp({ phone, password, name, dob, sex, language });

  const email = authEmailForPhone(phone);
  const signup = await request("/auth/v1/signup", {
    method: "POST",
    body: { email, password, data: { phone } },
  });

  let authData = signup.data?.access_token ? signup.data : signup.data?.session;

  // No session back (or the auth account already exists from an abandoned attempt): log in.
  if (!authData?.access_token) {
    const login = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
    if (login.error) return { data: null, error: signup.error || login.error };
    authData = login.data;
  }

  const session = saveSession(authData);
  const { data, error } = await request("/rest/v1/rpc/complete_user_profile", {
    method: "POST",
    token: session.access_token,
    body: { full_name: name.trim(), phone, sex, date_of_birth: dob, lang: language },
  });

  if (error || !data) {
    clearSession();
    return { data: null, error: error || { code: "profile_missing" } };
  }

  return { data, error: null };
}

export async function resetPassword({ phone, password }) {
  if (isMockPhone(phone)) return mock.resetPassword({ password });

  const { data, error } = await request("/rest/v1/rpc/reset_password_with_otp", {
    method: "POST",
    body: { p_customer_number: phone, p_new_password: password },
  });

  if (error) return { data: null, error };
  if (!data) return { data: null, error: { code: "reset_failed" } };
  return { data: true, error: null };
}
