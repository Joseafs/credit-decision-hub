import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  enTranslations,
  ptBRTranslations,
  type TranslationKey,
} from "../../i18n/translations";
import type {
  AppLocale,
  AppPreferences,
  AppPreferencesProviderProps,
  AppTheme,
} from "./types";

const THEME_STORAGE_KEY = "cdh-theme";
const LOCALE_STORAGE_KEY = "cdh-locale";

const AppPreferencesContext = createContext<AppPreferences | null>(null);

const isAppTheme = (value: string | null): value is AppTheme =>
  value === "light" || value === "dark";

const isAppLocale = (value: string | null): value is AppLocale =>
  value === "pt-BR" || value === "en";

const getInitialTheme = (): AppTheme => {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (isAppTheme(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getInitialLocale = (): AppLocale => {
  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  return isAppLocale(storedLocale) ? storedLocale : "pt-BR";
};

const interpolate = (
  message: string,
  variables: Record<string, string | number>,
) =>
  Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  );

export const AppPreferencesProvider = ({
  children,
}: AppPreferencesProviderProps) => {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const preferences = useMemo<AppPreferences>(() => {
    const catalog = locale === "pt-BR" ? ptBRTranslations : enTranslations;

    return {
      locale,
      setLocale,
      theme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === "dark" ? "light" : "dark",
        ),
      translate: (
        key: TranslationKey,
        variables: Record<string, string | number> = {},
      ) => interpolate(catalog[key], variables),
    };
  }, [locale, theme]);

  return (
    <AppPreferencesContext.Provider value={preferences}>
      {children}
    </AppPreferencesContext.Provider>
  );
};

export const useAppPreferences = () => {
  const preferences = useContext(AppPreferencesContext);

  if (!preferences) {
    throw new Error(
      "useAppPreferences must be used within AppPreferencesProvider",
    );
  }

  return preferences;
};
