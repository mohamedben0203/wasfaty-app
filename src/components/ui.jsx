import { useState } from "react";
import { useI18n } from "../i18n";
import { DIAL_CODE } from "../lib/phone";
import { AlertIcon, EyeIcon, GlobeIcon, InfoIcon } from "./icons";

// 16px text keeps iOS from zooming the page when an input is focused
const inputText = "text-base text-ink outline-none placeholder:text-slate-400";
const inputFrame = "h-12 rounded-xl border border-slate-300 bg-white";
const inputClass = `${inputFrame} ${inputText} w-full px-4 focus:border-brand focus:ring-2 focus:ring-brand/20`;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Button({ variant = "primary", className = "", href, ...props }) {
  const styles =
    variant === "primary"
      ? "bg-brand text-white shadow-sm hover:bg-brand-dark"
      : "border border-slate-300 bg-white text-brand hover:border-brand";
  const classes = `flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${styles} ${className}`;

  // With an href it is a link that looks like a button, for actions that open another page
  if (href) return <a href={href} className={classes} {...props} />;
  return <button type="button" className={classes} {...props} />;
}

// Ends an edit form: Cancel beside the submit button
export function FormActions({ busy, onCancel }) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="secondary" onClick={onCancel} disabled={busy}>
        {t("cancel")}
      </Button>
      <Button type="submit" disabled={busy}>
        {busy ? t("saving") : t("save")}
      </Button>
    </div>
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
      className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand ${focusRing}`}
    >
      <GlobeIcon className="size-4 text-slate-500" />
      {t("otherLanguage")}
    </button>
  );
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(22_41_59/0.04),0_8px_24px_-16px_rgb(22_41_59/0.12)] ${className}`}
      {...props}
    />
  );
}

export function IconChip({ tone = "accent", children }) {
  const styles = tone === "accent" ? "bg-accent-soft text-accent-dark" : "bg-slate-100 text-slate-500";

  return (
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles}`}>
      {children}
    </span>
  );
}

export function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
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
      <span className="flex items-center border-e border-slate-200 px-3.5 font-medium text-slate-500">
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
        <EyeIcon crossed={visible} />
      </button>
    </div>
  );
}

export function Notice({ tone = "error", children }) {
  const error = tone === "error";
  const styles = error ? "border-red-200 bg-red-50 text-red-800" : "border-accent/50 bg-accent-soft text-ink";

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${styles}`}
    >
      {error ? (
        <AlertIcon className="mt-px size-[1.125rem] text-red-600" />
      ) : (
        <InfoIcon className="mt-px size-[1.125rem] text-accent-dark" />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
