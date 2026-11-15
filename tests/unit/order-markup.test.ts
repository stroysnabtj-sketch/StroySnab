import { describe, expect, it } from "vitest";
import { calculateOrderMarkup, quantityMillis, lineBase } from "@/modules/pricing/order-markup";
describe("whole-basket order markup", () => {
  it.each([
    [4999999n, 7, 5349999n],
    [5000000n, 5, 5250000n],
    [10000000n, 5, 10500000n],
    [10000001n, 3, 10300001n],
  ] as const)("prices %s dirams at %s percent", (base, rate, expected) => {
    const result = calculateOrderMarkup(base);
    expect(result.percent).toBe(rate);
    expect(result.totalDirams).toBe(expected);
  });
  it("keeps large integers exact and rejects invalid quantities", () => {
    expect(lineBase(9007199254740999n, "1.125")).toBe(10133099161583624n);
    expect(quantityMillis("0.125")).toBe(125n);
    expect(() => quantityMillis("1.0001")).toThrow();
  });
});
