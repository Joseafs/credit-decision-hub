import type { AppLocale } from "../contexts/AppPreferencesContext/types";

export const formatCurrency = (value: number, locale: AppLocale) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const formatDate = (value: string, locale: AppLocale) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
  }).format(new Date(value));
