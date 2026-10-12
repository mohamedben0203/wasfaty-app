import { createContext, useContext } from "react";

export const LOCALE_KEY = "wasfati_locale";

export const I18nContext = createContext(null);

export function useI18n() {
  return useContext(I18nContext);
}
