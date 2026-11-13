import { z } from "zod";
import { lineBase } from "./order-markup";

export const markupPercentInput = z
  .string()
  .trim()
  .regex(/^\d{1,4}(?:\.\d{1,2})?$/)
  .refine((v) => Number(v) <= 1000, "Наценка от 0 до 1000%");

export function productPrice(base: bigint, percent = "7") {
  const value = markupPercentInput.parse(percent);
  if (base < 0n) throw new Error("Negative price");
  const [whole, fraction = ""] = value.split(".");
  const basisPoints = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return base + (base * basisPoints) / 10000n;
}

export function productLinePrice(base: bigint, qty: string, percent = "7") {
  const priceDirams = productPrice(base, percent);
  const baseDirams = lineBase(base, qty);
  const subtotalDirams = lineBase(priceDirams, qty);
  return { priceDirams, baseDirams, subtotalDirams, markupDirams: subtotalDirams - baseDirams };
}

export function summarizeProductPrices(lines: ReturnType<typeof productLinePrice>[]) {
  const baseDirams = lines.reduce((sum, line) => sum + line.baseDirams, 0n);
  const totalDirams = lines.reduce((sum, line) => sum + line.subtotalDirams, 0n);
  // Legacy order field: zero means per-product pricing; exact money is snapshotted on every line.
  return { baseDirams, totalDirams, markupDirams: totalDirams - baseDirams, percent: 0 };
}
