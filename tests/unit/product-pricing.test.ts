import { expect, it } from "vitest";
import {
  productPrice,
  productLinePrice,
  summarizeProductPrices,
} from "@/modules/pricing/product-price";

it("prices each product independently and sums the displayed unit prices", () => {
  const a = productLinePrice(10000n, "2", "15");
  const b = productLinePrice(20000n, "1", "10");
  expect(a.priceDirams).toBe(11500n);
  expect(b.priceDirams).toBe(22000n);
  expect(summarizeProductPrices([a, b])).toMatchObject({
    baseDirams: 40000n,
    totalDirams: 45000n,
    markupDirams: 5000n,
  });
  expect(productLinePrice(10000n, "1000", "15").priceDirams).toBe(a.priceDirams);
});

it("supports zero and decimal markup, integer rounding and fractional quantities", () => {
  expect(productPrice(999n, "0")).toBe(999n);
  expect(productPrice(999n, "12.50")).toBe(1123n);
  expect(productLinePrice(999n, "0.5", "12.50").subtotalDirams).toBe(561n);
  for (const invalid of ["-1", "1001", "1.001", "NaN"])
    expect(() => productPrice(100n, invalid)).toThrow();
});
