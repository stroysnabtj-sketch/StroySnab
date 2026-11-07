import { ApiError } from "@/server/api-error";
export function quantityMillis(qty: string): bigint {
  if (!/^\d+(?:\.\d{1,3})?$/.test(qty))
    throw new ApiError(400, "validation_error", "Некорректное количество");
  const [whole, fraction = ""] = qty.split(".");
  const value = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
  if (value <= 0n || value > 100000000n)
    throw new ApiError(400, "validation_error", "Некорректное количество");
  return value;
}
export function lineBase(price: bigint, qty: string) {
  return (price * quantityMillis(qty)) / 1000n;
}
export function calculateOrderMarkup(baseDirams: bigint) {
  if (baseDirams < 0n) throw new Error("Negative goods subtotal");
  const percent = baseDirams < 5000000n ? 7 : baseDirams <= 10000000n ? 5 : 3;
  const markupDirams = (baseDirams * BigInt(percent)) / 100n;
  return { baseDirams, percent, markupDirams, totalDirams: baseDirams + markupDirams };
}
