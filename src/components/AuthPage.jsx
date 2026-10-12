import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { getDobBounds, isValidDob } from "../lib/dob";
import { getOtpStatus, recordOtpSend } from "../lib/otpLimit";
import { formatPhone, isValidPhone, normalizePhone } from "../lib/phone";
import {
  MIN_PASSWORD_LENGTH,
  phoneExists,
  requestOtp,
  resetPassword,
  signIn,
  signUp,
  verifyOtp,
} from "../lib/supabase";
import logo from "../assets/logo.svg";
import {
  Button,
  Field,
  LanguageToggle,
  LinkButton,
  Notice,
  PasswordInput,
  PhoneInput,
  TextInput,
} from "./ui";

const TOTAL_STEPS = 3;
const STEP_NUMBER = { phone: 1, otp: 2, details: 3 };

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AuthPage({ onAuth }) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [step, setStep] = useState("phone"); // phone | otp | details (signup and forgot only)
  const [phoneInput, setPhoneInput] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [dobBounds] = useState(getDobBounds);
  const [now, setNow] = useState(Date.now);

  const phone = normalizePhone(phoneInput);
  const otpStatus = getOtpStatus(phone, now);

  // Drives the resend countdown
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  const clearMessages = () => {
    setError("");
    setNotice("");
    setAccountExists(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStep("phone");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    clearMessages();
  };

  const failWith = (requestError, fallbackKey) => {
    setError(t(requestError?.code === "network" ? "networkError" : fallbackKey));
  };

  // Sends a code unless the limits say no. Returns true when the user should move on to enter one.
  const sendCode = async () => {
    const status = getOtpStatus(phone);

    if (status.hasRecentCode) {
      setNotice(t("codeAlreadySent"));
      return true;
    }
    if (status.secondsUntilNext > 0) {
      setError(t("otpHourlyLimit", { time: formatTime(status.secondsUntilNext) }));
      return false;
    }

    const { error: sendError } = await requestOtp({ phone, language: locale });
    if (sendError) {
      failWith(sendError, sendError.code === "otp_rate_limited" ? "otpRateLimited" : "otpSendFailed");
      return false;
    }

    recordOtpSend(phone);
    setNow(Date.now());
    setOtp("");
    return true;
  };

  const validNewPassword = () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordLengthError"));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMatchError"));
      return false;
    }
    return true;
  };

  const submitLogin = async () => {
    if (!isValidPhone(phone)) return setError(t("validPhoneError"));
    if (!password) return setError(t("passwordError"));

    const { data, error: loginError } = await signIn({ phone, password });
    if (loginError) return failWith(loginError, "loginFailed");
    onAuth(data);
  };

  const submitPhone = async () => {
    if (!isValidPhone(phone)) return setError(t("validPhoneError"));

    const { data: exists, error: existsError } = await phoneExists(phone);
    if (existsError) return failWith(existsError, "genericError");
    if (mode === "signup" && exists) return setAccountExists(true);
    if (mode === "forgot" && !exists) return setError(t("phoneNotFound"));

    if (await sendCode()) setStep("otp");
  };

  const submitOtp = async () => {
    if (otp.length !== 6) return setError(t("otpLengthError"));

    const { error: verifyError } = await verifyOtp({ phone, otp });
    if (verifyError) return failWith(verifyError, "otpVerifyFailed");
    setStep("details");
  };

  const submitSignupDetails = async () => {
    if (!name.trim()) return setError(t("fullNameError"));
    if (!isValidDob(dob)) return setError(t("dobError"));
    if (!sex) return setError(t("genderError"));
    if (!validNewPassword()) return;

    const { data, error: signupError } = await signUp({
      phone,
      password: newPassword,
      name,
      dob,
      sex,
      language: locale,
    });
    if (signupError) return failWith(signupError, "signupFailed");
    onAuth(data);
  };

  const submitNewPassword = async () => {
    if (!validNewPassword()) return;

    const { error: resetError } = await resetPassword({ phone, password: newPassword });
    if (resetError) return failWith(resetError, "resetPasswordFailed");

    const { data, error: loginError } = await signIn({ phone, password: newPassword });
    if (loginError) return switchMode("login");
    onAuth(data);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    clearMessages();
    setBusy(true);

    try {
      if (mode === "login") await submitLogin();
      else if (step === "phone") await submitPhone();
      else if (step === "otp") await submitOtp();
      else if (mode === "signup") await submitSignupDetails();
      else await submitNewPassword();
    } catch {
      setError(t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    clearMessages();
    setBusy(true);
    try {
      await sendCode();
    } catch {
      setError(t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  const submitLabel = () => {
    if (mode === "login") return busy ? t("loggingIn") : t("login");
    if (step === "phone") return busy ? t("sending") : t("sendCode");
    if (step === "otp") return busy ? t("verifying") : t("verify");
    if (mode === "signup") return busy ? t("creatingAccount") : t("createAccount");
    return busy ? t("resettingPassword") : t("resetPassword");
  };

  const resendLabel = () => {
    if (otpStatus.secondsUntilNext === 0) return t("resendCode");
    const time = formatTime(otpStatus.secondsUntilNext);
    return otpStatus.resendsLeft > 0 ? t("resendIn", { time }) : t("noResendsLeft", { time });
  };

  // Login has no steps, so it always shows the phone field and the intro line
  const onPhoneStep = mode === "login" || step === "phone";

  return (
    <>
      <div className="flex justify-end px-5 pt-4">
        <LanguageToggle />
      </div>

      <main className="mx-auto max-w-md px-5 pt-2 pb-10 sm:pt-[6vh]">
        <img
          src={logo}
          alt={t("brand")}
          width="1167"
          height="728"
          className="mx-auto h-16 w-auto"
        />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-16px_rgb(22_41_59/0.18)] sm:p-8">
          {mode !== "login" && (
            <div
              role="img"
              aria-label={t("step", { step: STEP_NUMBER[step], total: TOTAL_STEPS })}
              className="mb-5 flex justify-center gap-1.5"
            >
              {Object.values(STEP_NUMBER).map((number) => (
                <span
                  key={number}
                  className={`h-1 w-8 rounded-full ${
                    number <= STEP_NUMBER[step] ? "bg-brand" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          )}

          <h1 className="text-center text-2xl font-extrabold text-ink">{t(`${mode}Title`)}</h1>

          {onPhoneStep && (
            <p className="mt-1.5 text-center text-slate-600">{t(`${mode}Subtitle`)}</p>
          )}

          {mode !== "login" && step === "otp" && (
            <p className="mt-1.5 text-center text-slate-600">
              {t("otpSentTo")}
              <span className="flex items-center justify-center gap-3">
                <bdi dir="ltr" className="font-semibold whitespace-nowrap text-ink">
                  {formatPhone(phone)}
                </bdi>
                <LinkButton
                  onClick={() => {
                    clearMessages();
                    setStep("phone");
                  }}
                >
                  {t("changeNumber")}
                </LinkButton>
              </span>
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {onPhoneStep && (
              <Field label={t("phoneNumber")} id="phone">
                <PhoneInput
                  id="phone"
                  value={phoneInput}
                  onChange={setPhoneInput}
                  autoComplete={mode === "login" ? "username" : "tel"}
                />
              </Field>
            )}

            {mode === "login" && (
              <div>
                <Field label={t("password")} id="password">
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />
                </Field>

                <div className="-mb-2 flex justify-end">
                  <LinkButton onClick={() => switchMode("forgot")}>{t("forgotPassword")}</LinkButton>
                </div>
              </div>
            )}

            {mode !== "login" && step === "otp" && (
              <Field label={t("codeLabel")} id="otp">
                <TextInput
                  id="otp"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl font-bold tracking-[0.4em]"
                />
              </Field>
            )}

            {mode === "signup" && step === "details" && (
              <>
                <Field label={t("fullName")} id="name">
                  <TextInput
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>

                <Field label={t("dob")} id="dob">
                  <TextInput
                    id="dob"
                    type="date"
                    min={dobBounds.min}
                    max={dobBounds.max}
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                  />
                </Field>

                <Field label={t("gender")} id="sex-male">
                  <div className="grid grid-cols-2 gap-2">
                    {["male", "female"].map((value) => (
                      <button
                        key={value}
                        id={`sex-${value}`}
                        type="button"
                        aria-pressed={sex === value}
                        onClick={() => setSex(value)}
                        className={`h-12 cursor-pointer rounded-xl border font-semibold transition-colors ${
                          sex === value
                            ? "border-brand bg-brand/5 text-brand ring-1 ring-brand"
                            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {t(value)}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {mode !== "login" && step === "details" && (
              <>
                <Field label={t(mode === "signup" ? "createPassword" : "newPassword")} id="new-password">
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                  />
                </Field>

                <Field label={t("confirmPassword")} id="confirm-password">
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                </Field>
              </>
            )}

            {notice && <Notice tone="info">{notice}</Notice>}
            {error && <Notice>{error}</Notice>}
            {accountExists && (
              <Notice tone="info">
                {t("accountExists")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="cursor-pointer font-bold text-brand underline"
                >
                  {t("login")}
                </button>
              </Notice>
            )}

            <Button type="submit" disabled={busy}>
              {submitLabel()}
            </Button>

            {mode !== "login" && step === "otp" && (
              <div className="-mb-2 flex flex-col items-center">
                <LinkButton
                  onClick={handleResend}
                  disabled={busy || otpStatus.secondsUntilNext > 0}
                >
                  {resendLabel()}
                </LinkButton>

                {otpStatus.resendsLeft > 0 && (
                  <p className="-mt-1.5 pb-2 text-xs text-slate-500">
                    {t("resendsLeft", { count: otpStatus.resendsLeft })}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === "login" && `${t("noAccount")} `}
          {mode === "signup" && `${t("haveAccount")} `}
          <LinkButton onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" && t("createAccount")}
            {mode === "signup" && t("login")}
            {mode === "forgot" && t("backToLogin")}
          </LinkButton>
        </p>
      </main>
    </>
  );
}
