import { describe, expect, it } from "vitest";
import { calculateOrderMarkup, quantityMillis, lineBase } from "@/modules/pricing/order-markup";
describe("whole-basket order markup", () => {
  it.each([
    [4999999n, 7],
    [5000000n, 5],
    [10000000n, 5],
    [10000001n, 3],
  ] as const)("prices %s dirams at %s percent", (base, rate) => {
    const result = calculateOrderMarkup(base);
    expect(result.percent).toBe(rate);
    expect(result.totalDirams).toBe(base + (base * BigInt(rate)) / 100n);
  });
  it("keeps large integers exact and rejects invalid quantities", () => {
    expect(lineBase(9007199254740999n, "1.125")).toBe(10133099161583623n);
    expect(quantityMillis("0.125")).toBe(125n);
    expect(() => quantityMillis("1.0001")).toThrow();
  });
});
