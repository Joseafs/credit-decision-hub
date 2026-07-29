import type { PropsWithChildren } from "react";

import type { TranslationKey } from "../../i18n/translations";

export type AppLocale = "pt-BR" | "en";
export type AppTheme = "light" | "dark";

export type AppPreferences = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  theme: AppTheme;
  toggleTheme: () => void;
  translate: (
    key: TranslationKey,
    variables?: Record<string, string | number>,
  ) => string;
};

export type AppPreferencesProviderProps = PropsWithChildren;
