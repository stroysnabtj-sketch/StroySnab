import { expect, it } from "vitest";
import { resolveLocale } from "@/i18n/locale";
import { translate } from "@/i18n/storefront";
it("accepts only supported locales", () => {
  expect(resolveLocale("tg")).toBe("tg");
  expect(resolveLocale("ru")).toBe("ru");
  expect(resolveLocale("<script>")).toBe("ru");
});
it("translates interface copy without altering unknown product text", () => {
  expect(translate("Корзина", "tg")).toBe("Сабад");
  expect(translate("Арматура A500C", "tg")).toBe("Арматура A500C");
  expect(translate("Корзина", "ru")).toBe("Корзина");
});
