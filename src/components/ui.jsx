import { useState } from "react";
import { useI18n } from "../i18n";
import { DIAL_CODE } from "../lib/phone";

// 16px text keeps iOS from zooming the page when an input is focused
const inputText = "text-base text-ink outline-none placeholder:text-slate-400";
const inputFrame = "h-12 rounded-xl border border-slate-300 bg-white";
const inputClass = `${inputFrame} ${inputText} w-full px-4 focus:border-brand focus:ring-2 focus:ring-brand/20`;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Button({ variant = "primary", className = "", ...props }) {
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-dark"
      : "border border-brand/30 bg-white text-brand hover:border-brand";

  return (
    <button
      type="button"
      className={`min-h-12 w-full cursor-pointer rounded-full px-6 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${styles} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={`min-h-11 cursor-pointer rounded-md text-sm font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline ${focusRing} ${className}`}
      {...props}
    />
  );
}

export function LanguageToggle() {
  const { t, locale, toggleLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      lang={locale === "ar" ? "en" : "ar"}
      className={`min-h-11 cursor-pointer rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-brand transition-colors hover:border-brand ${focusRing}`}
    >
      {t("otherLanguage")}
    </button>
  );
}

export function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function PhoneInput({ id, value, onChange, autoComplete = "tel" }) {
  return (
    // Always left-to-right: phone numbers read the same way in Arabic
    <div
      dir="ltr"
      className={`flex ${inputFrame} focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20`}
    >
      <span className="flex items-center border-e border-slate-200 px-3.5 font-semibold text-slate-500">
        {DIAL_CODE}
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder="091 234 5678"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-w-0 flex-1 rounded-e-xl bg-transparent px-3.5 ${inputText}`}
      />
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    // Always left-to-right, so the toggle never sits on top of what is typed
    <div dir="ltr" className="relative">
      <TextInput
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pe-12"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className={`absolute inset-y-0 end-0 flex w-12 cursor-pointer items-center justify-center rounded-e-xl text-slate-500 hover:text-brand ${focusRing}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m4 4 16 16" />}
          </g>
        </svg>
      </button>
    </div>
  );
}

export function Notice({ tone = "error", children }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-accent/50 bg-accent/15 text-ink";

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
