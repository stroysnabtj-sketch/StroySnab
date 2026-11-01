import { describe, expect, it } from "vitest";
import { applyPercent, formatTJS, fromDirams, toDirams } from "@/modules/system/money";
import { normalizePhone } from "@/modules/system/phone";
import { t } from "@/i18n";

describe("money", () => {
  it.each([["0,10", 10n], ["0.29", 29n], ["1 234,56", 123456n], ["8500,00", 850000n]])("parses %s exactly", (input, expected) => {
    expect(toDirams(input)).toBe(expected);
  });
  it("rejects floating point and negatives", () => {
    expect(() => toDirams("1.234")).toThrow("money_invalid");
    expect(() => toDirams("-1")).toThrow("money_invalid");
  });
  it("formats and applies integer markup", () => {
    expect(fromDirams(850000n)).toBe("8500.00");
    expect(formatTJS(850000n)).toBe("8 500,00 TJS");
    expect(applyPercent(10000n, 10)).toBe(11000n);
  });
});

describe("phone", () => {
  it.each([["92 123 45 67", "+992921234567"], ["921234567", "+992921234567"], ["992921234567", "+992921234567"], ["0921234567", "+992921234567"], ["+992 (92) 123-45-67", "+992921234567"]])("normalizes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
  it("rejects invalid phone", () => expect(() => normalizePhone("abc")).toThrow("phone_invalid"));
});

describe("i18n", () => {
  it("falls back to Russian", () => expect(t("common.catalog", "tg")).toBe("Каталог"));
});
