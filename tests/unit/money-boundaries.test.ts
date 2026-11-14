import { expect, it } from "vitest";
import { toDirams, fromDirams, formatTJS } from "@/modules/system/money";
import { productLinePrice, summarizeProductPrices } from "@/modules/pricing/product-price";
it("keeps large money exact through parsing, formatting, JSON and line totals", () => {
  const amount = toDirams("9007199254740993.99");
  expect(amount).toBe(900719925474099399n);
  expect(fromDirams(amount)).toBe("9007199254740993.99");
  expect(formatTJS(amount)).toContain(",99 TJS");
  const lines = [productLinePrice(amount, "0.125", "7.25"), productLinePrice(101n, "0.333", "0")];
  const total = summarizeProductPrices(lines);
  expect(total.baseDirams + total.markupDirams).toBe(total.totalDirams);
  const saved = JSON.parse(JSON.stringify({ total: total.totalDirams.toString() }));
  expect(BigInt(saved.total)).toBe(total.totalDirams);
  expect(productLinePrice(101n, "0.333", "0").subtotalDirams).toBe(33n);
});
