import { useI18n } from "../i18n";
import logo from "../assets/logo.svg";
import { LanguageToggle } from "./ui";

export default function Header({ onSignOut }) {
  const { t } = useI18n();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-2">
        <img
          src={logo}
          alt={t("brand")}
          width="1167"
          height="728"
          className="h-12 w-auto"
        />

        <div className="flex items-center gap-2">
          <LanguageToggle />

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="min-h-11 cursor-pointer rounded-full px-3 text-sm font-semibold text-slate-600 hover:text-brand"
            >
              {t("logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
