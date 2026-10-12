import { useI18n } from "../i18n";
import logo from "../assets/logo.svg";
import { LogoutIcon } from "./icons";
import { LanguageToggle } from "./ui";

export default function Header({ onSignOut }) {
  const { t } = useI18n();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-3 py-1.5 sm:px-5 sm:py-2">
        <img
          src={logo}
          alt={t("brand")}
          width="1167"
          height="728"
          className="h-11 w-auto"
        />

        <div className="flex items-center gap-1">
          <LanguageToggle />

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-600 hover:text-brand"
            >
              <LogoutIcon className="size-4 rtl:-scale-x-100" />
              {t("logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
