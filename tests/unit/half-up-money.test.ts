import { expect, it } from "vitest";
import { productPrice, productLinePrice } from "@/modules/pricing/product-price";
import { lineBase } from "@/modules/pricing/order-markup";
import { applyPercent } from "@/modules/system/money";
it("rounds new markups and fractional lines half up at an integer diram boundary", () => {
  expect(productPrice(999n, "12.50")).toBe(1124n);
  expect(productLinePrice(999n, "0.5", "12.50")).toMatchObject({
    priceDirams: 1124n,
    baseDirams: 500n,
    subtotalDirams: 562n,
    markupDirams: 62n,
  });
  expect(lineBase(101n, "0.5")).toBe(51n);
  expect(lineBase(101n, "0.499")).toBe(50n);
  expect(applyPercent(101n, 50)).toBe(152n);
});
it("can reproduce legacy line arithmetic for historical documents without changing their stored money", () => {
  expect(lineBase(101n, "0.5", "LEGACY_FLOOR")).toBe(50n);
  expect(lineBase(101n, "0.5", "HALF_UP")).toBe(51n);
});
