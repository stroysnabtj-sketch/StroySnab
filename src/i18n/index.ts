import { ru } from "./ru";
import { tg } from "./tg";
import type { Locale, MessageKey } from "./types";

export function t(key: MessageKey, locale: Locale = "ru", vars?: Record<string, string | number>): string {
  let text = (locale === "tg" ? tg[key] : undefined) ?? ru[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function formatDate(value: Date | string, locale: Locale = "ru"): string {
  return new Intl.DateTimeFormat(locale === "tg" ? "tg-TJ" : "ru-RU", {
    timeZone: "Asia/Dushanbe", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string, locale: Locale = "ru"): string {
  return new Intl.DateTimeFormat(locale === "tg" ? "tg-TJ" : "ru-RU", {
    timeZone: "Asia/Dushanbe", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
export type { Locale, MessageKey } from "./types";
