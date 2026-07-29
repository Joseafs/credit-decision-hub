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

export const formatDateTime = (value: string, locale: AppLocale) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const formatPercent = (value: number, locale: AppLocale) =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value / 100);
