import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "./locale";
import { translate } from "./storefront";
export async function getLocale() {
  return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
export async function getTranslator() {
  const locale = await getLocale();
  return (text: string) => translate(text, locale);
}
