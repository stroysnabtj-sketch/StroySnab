import { describe, expect, it } from "vitest";
import { applyPercent, formatTJS, fromDirams, toDirams } from "@/modules/system/money";
import { normalizePhone } from "@/modules/system/phone";
import { t } from "@/i18n";

describe("money", () => {
  it.each([
    ["0,10", 10n],
    ["0.29", 29n],
    ["1 234,56", 123456n],
    ["8500,00", 850000n],
    ["9007199254740992.50", 900719925474099250n],
  ])("parses %s exactly", (input, expected) => {
    expect(toDirams(input)).toBe(expected);
  });

  it("handles numbers larger than Number.MAX_SAFE_INTEGER", () => {
    const huge = "9007199254740995.99";
    const dirams = toDirams(huge);
    expect(dirams).toBe(900719925474099599n);
    expect(fromDirams(dirams)).toBe(huge);
  });

  it("rejects floating point and negatives", () => {
    expect(() => toDirams("1.234")).toThrow();
    expect(() => toDirams("-1")).toThrow();
  });

  it("formats and applies integer markup", () => {
    expect(fromDirams(850000n)).toBe("8500.00");
    expect(formatTJS(850000n)).toBe("8 500,00 TJS");
    expect(applyPercent(10000n, 10)).toBe(11000n);
  });
});

describe("phone", () => {
  it.each([
    ["92 123 45 67", "+992921234567"],
    ["921234567", "+992921234567"],
    ["992921234567", "+992921234567"],
    ["0921234567", "+992921234567"],
    ["+992 (92) 123-45-67", "+992921234567"],
    ["+12025550199", "+12025550199"],
    ["+79991234567", "+79991234567"],
  ])("normalizes valid phone %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("does not prepend 992 to international numbers starting with +", () => {
    expect(normalizePhone("+442071838750")).toBe("+442071838750");
  });

  it("rejects bare 8, 10, or 11 digits without + unless matching local 0-prefix or 992-prefix", () => {
    expect(() => normalizePhone("12345678")).toThrow();
    expect(() => normalizePhone("1234567890")).toThrow(); // 10 digits without leading 0
    expect(() => normalizePhone("79991234567")).toThrow(); // 11 digits without +
  });

  it("rejects invalid characters", () => {
    expect(() => normalizePhone("abc")).toThrow();
    expect(() => normalizePhone("+")).toThrow();
  });
});

describe("i18n", () => {
  it("translates available Tajik copy", () => expect(t("common.catalog", "tg")).toBe("Феҳрист"));
  it("falls back only for untranslated copy", () =>
    expect(t("terms.s1.body", "tg")).toBe(t("terms.s1.body", "ru")));
});
