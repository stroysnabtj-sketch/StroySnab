import { describe, expect, it } from "vitest";
import { formatQuantity, parseQuantity, quantityToNumericString } from "@/modules/system/quantity";

describe("quantity system module", () => {
  it("parses exact decimal quantities into integer thousandths", () => {
    expect(parseQuantity("0.001")).toBe(1n);
    expect(parseQuantity("0,001")).toBe(1n);
    expect(parseQuantity("2.5")).toBe(2500n);
    expect(parseQuantity("2,5")).toBe(2500n);
    expect(parseQuantity("100")).toBe(100000n);
    expect(parseQuantity("99999999999.999")).toBe(99999999999999n);
  });

  it("formats quantities cleanly", () => {
    expect(formatQuantity(1n)).toBe("0.001");
    expect(formatQuantity(2500n)).toBe("2.5");
    expect(formatQuantity(100000n)).toBe("100");
    expect(quantityToNumericString(2500n)).toBe("2.500");
  });

  it("rejects negative quantities", () => {
    expect(() => parseQuantity("-1")).toThrow();
    expect(() => parseQuantity("-0.001")).toThrow();
  });

  it("rejects quantities with more than 3 decimal places", () => {
    expect(() => parseQuantity("1.0001")).toThrow();
  });

  it("rejects numbers exceeding numeric(14,3) maximum limit", () => {
    expect(() => parseQuantity("100000000000.000")).toThrow();
  });
});

