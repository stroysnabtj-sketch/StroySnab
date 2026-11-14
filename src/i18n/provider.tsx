"use client";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./types";
import { translate } from "./storefront";
const Context = createContext<Locale>("ru");
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <Context.Provider value={locale}>{children}</Context.Provider>;
}
export function useLocale() {
  const locale = useContext(Context);
  return useMemo(() => ({ locale, tr: (text: string) => translate(text, locale) }), [locale]);
}
