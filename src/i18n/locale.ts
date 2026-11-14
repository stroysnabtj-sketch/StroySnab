import type { Locale } from "./types";
export const LOCALE_COOKIE = "stroysnab_locale";
export function resolveLocale(value?: string | null): Locale {
  return value === "tg" ? "tg" : "ru";
}
