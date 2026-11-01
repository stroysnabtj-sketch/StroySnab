import { ApiError } from "@/server/api-error";

export const MAX_QUANTITY_BIGINT = 99999999999999n; // 99999999999.999 in thousandths

/**
 * Parses a decimal quantity string or number into an integer thousandths (bigint).
 * Supports both dot and comma (e.g. "0.001", "2,5").
 * Enforces up to 3 decimal places, strictly non-negative, and <= 99999999999.999.
 */
export function parseQuantity(value: string | number | bigint, fieldName = "quantity"): bigint {
  if (typeof value === "bigint") {
    if (value < 0n || value > MAX_QUANTITY_BIGINT) {
      throw new ApiError(400, "validation_failed", "Количество вне допустимого диапазона", {
        [fieldName]: "quantity_invalid",
      });
    }
    return value;
  }

  const raw = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    throw new ApiError(400, "validation_failed", "Некорректное количество", {
      [fieldName]: "quantity_invalid",
    });
  }

  const [wholePart, fracPart = ""] = raw.split(".");
  if (fracPart.length > 3) {
    throw new ApiError(400, "validation_failed", "Количество не может содержать более 3 знаков после запятой", {
      [fieldName]: "quantity_excess_decimals",
    });
  }

  const whole = BigInt(wholePart);
  const frac = BigInt(fracPart.padEnd(3, "0"));
  const total = whole * 1000n + frac;

  if (total < 0n) {
    throw new ApiError(400, "validation_failed", "Количество должно быть положительным", {
      [fieldName]: "quantity_positive",
    });
  }

  if (total > MAX_QUANTITY_BIGINT) {
    throw new ApiError(400, "validation_failed", "Количество превышает максимальный предел", {
      [fieldName]: "quantity_too_large",
    });
  }

  return total;
}

/**
 * Formats thousandths bigint to a clean decimal string, omitting unnecessary trailing zeroes.
 * e.g. 1n -> "0.001", 2500n -> "2.5", 100000n -> "100"
 */
export function formatQuantity(value: bigint | number | string): string {
  const thousandths = typeof value === "bigint" ? value : parseQuantity(value);
  const negative = thousandths < 0n;
  const abs = negative ? -thousandths : thousandths;
  const whole = abs / 1000n;
  const frac = (abs % 1000n).toString().padStart(3, "0");

  const fracTrimmed = frac.replace(/0+$/, "");
  const result = fracTrimmed.length > 0 ? `${whole}.${fracTrimmed}` : `${whole}`;
  return `${negative ? "-" : ""}${result}`;
}

/**
 * Returns fixed 3-decimal string representation suitable for SQL numeric(14,3).
 * e.g. 2500n -> "2.500"
 */
export function quantityToNumericString(value: bigint | number | string): string {
  const thousandths = typeof value === "bigint" ? value : parseQuantity(value);
  const negative = thousandths < 0n;
  const abs = negative ? -thousandths : thousandths;
  const whole = abs / 1000n;
  const frac = (abs % 1000n).toString().padStart(3, "0");
  return `${negative ? "-" : ""}${whole}.${frac}`;
}
