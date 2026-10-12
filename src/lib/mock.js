// TEMPORARY test number, for walking through the app without touching the backend.
//
// Signing up, logging in or resetting the password with 094 005 5000 never reaches Supabase:
// no SMS is sent (the code is always 123456), no account is created and nothing is saved.
// The account lives in this page's memory only, so reloading the page forgets it.
//
// On in `npm run dev`. A build leaves it off unless VITE_ENABLE_TEST_NUMBER=true, because
// 094 005 5000 could be a real customer's number. To remove the feature, delete this file and
// the lines that import from it (supabase.js and otpLimit.js).

const ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_NUMBER === "true";
const PHONE = "+218940055000";
const OTP = "123456";
const USER_ID = "test-user";

let account = null; // { password, profile } once signed up
let codeVerified = false;

export function isMockPhone(phone) {
  return ENABLED && phone === PHONE;
}

export function isMockUser(user) {
  return ENABLED && user?.id === USER_ID;
}

const ok = (data) => ({ data, error: null });
const fail = (code) => ({ data: null, error: { status: 400, code } });

// Two made-up scans, so the summary, the changes between scans and the lists have something
// to show. Their reports do not exist: "View report" opens a page the health service rejects.
function sampleExams() {
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      exam_no: "TEST-0002",
      received_at: new Date(Date.now() - 2 * day).toISOString(),
      weight_value: 78.4,
      bmi_value: 24.9,
      bmi_raw: "24.9#Normal#18.5~24.9",
      score: 81,
    },
    {
      exam_no: "TEST-0001",
      received_at: new Date(Date.now() - 45 * day).toISOString(),
      weight_value: 80.1,
      bmi_value: 25.4,
      bmi_raw: "25.4#Overweight#18.5~24.9",
      score: 78,
    },
  ];
}

export const mock = {
  phoneExists: () => ok(Boolean(account)),

  requestOtp() {
    codeVerified = false;
    return ok(true);
  },

  verifyOtp({ otp }) {
    if (otp !== OTP) return fail("otp_invalid");
    codeVerified = true;
    return ok(true);
  },

  signUp({ phone, password, name, dob, sex, goals, language }) {
    if (!codeVerified) return fail("otp_required");
    codeVerified = false;
    account = {
      password,
      profile: {
        id: USER_ID,
        full_name: name.trim(),
        phone,
        sex,
        date_of_birth: dob,
        preferred_lang: language,
        credits: 1,
        goals,
      },
    };
    return ok(account.profile);
  },

  signIn({ password }) {
    if (!account || account.password !== password) return fail("invalid_credentials");
    return ok(account.profile);
  },

  resetPassword({ password }) {
    if (!account || !codeVerified) return fail("reset_failed");
    codeVerified = false;
    account.password = password;
    return ok(true);
  },

  updateProfile(changes) {
    account.profile = { ...account.profile, ...changes };
    return ok(account.profile);
  },

  listExams: () => ok(sampleExams()),

  getCredits() {
    const [latest, first] = sampleExams();
    const row = (id, created_at, amount, reason, paid, balance_after) => ({
      id,
      created_at,
      amount,
      reason,
      paid_amount_dinar: paid,
      balance_after,
    });

    return ok({
      balance: account.profile.credits,
      transactions: [
        row("test-4", latest.received_at, -1, "scan", 0, 1),
        row("test-3", latest.received_at, 1, "credit_purchase", 10, 2),
        row("test-2", first.received_at, -1, "scan", 0, 0),
        row("test-1", first.received_at, 1, "free_signup", 0, 1),
      ],
    });
  },
};
