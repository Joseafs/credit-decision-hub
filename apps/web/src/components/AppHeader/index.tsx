import { NavLink } from "react-router-dom";

import { useAppPreferences } from "../../contexts/AppPreferencesContext";

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-primary-soft text-primary"
      : "text-muted hover:bg-surface-subtle hover:text-heading",
  ].join(" ");

export const AppHeader = () => {
  const { locale, setLocale, theme, toggleTheme, translate } =
    useAppPreferences();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink className="group flex items-center gap-3" to="/">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-bold text-on-primary shadow-lg shadow-primary/20 transition group-hover:-translate-y-0.5">
            CD
          </span>
          <span>
            <span className="block font-semibold tracking-tight text-heading">
              Credit Decision Hub
            </span>
            <span className="hidden text-xs text-muted sm:block">
              {translate("brand.description")}
            </span>
          </span>
        </NavLink>

        <div className="flex flex-1 items-center justify-end gap-2">
          <nav
            aria-label={translate("nav.mainLabel")}
            className="mr-auto flex items-center gap-1 sm:mr-2"
          >
            <NavLink className={navLinkClassName} end to="/">
              {translate("nav.home")}
            </NavLink>
            <NavLink className={navLinkClassName} to="/customers">
              {translate("nav.customers")}
            </NavLink>
            <NavLink className={navLinkClassName} to="/proposals">
              {translate("nav.proposals")}
            </NavLink>
          </nav>

          <div
            aria-label={translate("preferences.language")}
            className="flex rounded-lg border border-border bg-surface p-1"
            role="group"
          >
            <button
              aria-pressed={locale === "pt-BR"}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-muted transition aria-pressed:bg-primary-soft aria-pressed:text-primary"
              onClick={() => setLocale("pt-BR")}
              title={translate("preferences.portuguese")}
              type="button"
            >
              PT
            </button>
            <button
              aria-pressed={locale === "en"}
              className="rounded-md px-2 py-1.5 text-xs font-semibold text-muted transition aria-pressed:bg-primary-soft aria-pressed:text-primary"
              onClick={() => setLocale("en")}
              title={translate("preferences.english")}
              type="button"
            >
              EN
            </button>
          </div>

          <button
            aria-label={
              theme === "dark"
                ? translate("preferences.light")
                : translate("preferences.dark")
            }
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-lg text-heading transition hover:border-primary hover:text-primary"
            onClick={toggleTheme}
            type="button"
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
