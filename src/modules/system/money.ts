import { ApiError } from "@/server/api-error";

export function toDirams(value: string, fieldName = "price"): bigint {
  if (!value || typeof value !== "string") {
    throw new ApiError(400, "validation_failed", "Некорректная сумма", {
      [fieldName]: "money_invalid",
    });
  }
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new ApiError(400, "validation_failed", "Некорректная сумма", {
      [fieldName]: "money_invalid",
    });
  }
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function fromDirams(value: bigint | number | string): string {
  const amount = BigInt(value);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  return `${negative ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function formatTJS(value: bigint | number | string): string {
  const [whole, fraction] = fromDirams(value).split(".");
  const grouped = whole.replace("-", "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${whole.startsWith("-") ? "−" : ""}${grouped},${fraction} TJS`;
}

export function applyPercent(value: bigint, percent: number): bigint {
  if (!Number.isInteger(percent) || percent < 0) {
    throw new ApiError(400, "validation_failed", "Некорректный процент наценки", {
      percent: "percent_invalid",
    });
  }
  return value + (value * BigInt(percent)) / 100n;
}
