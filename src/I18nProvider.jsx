import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { I18nContext, LOCALE_KEY } from "./i18n";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

const messages = { ar, en };

function initialLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    // storage can be blocked; fall through to the browser language
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "ar";
}

export default function I18nProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale);

  // Layout effect: lang/dir must be set before the first paint, or English renders RTL then jumps
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.title = messages[locale].documentTitle;
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // the choice just won't be remembered
    }
  }, [locale]);

  const t = useCallback(
    (key, vars) => {
      const text = messages[locale][key] ?? messages.en[key] ?? key;
      if (!vars) return text;
      return text.replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      t,
      toggleLocale: () => setLocale((current) => (current === "ar" ? "en" : "ar")),
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
