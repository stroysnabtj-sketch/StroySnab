import { ApiError } from "@/server/api-error";

export function normalizePhone(input: string, fieldName = "phone"): string {
  if (!input || typeof input !== "string") {
    throw new ApiError(400, "validation_failed", "Некорректный номер телефона", {
      [fieldName]: "phone_invalid",
    });
  }

  const compact = input.trim().replace(/[\s\-()]/g, "");
  if (!compact) {
    throw new ApiError(400, "validation_failed", "Некорректный номер телефона", {
      [fieldName]: "phone_invalid",
    });
  }

  const hasPlus = compact.startsWith("+");
  const digits = hasPlus ? compact.slice(1) : compact;

  if (!/^\d+$/.test(digits)) {
    throw new ApiError(400, "validation_failed", "Некорректный номер телефона", {
      [fieldName]: "phone_invalid",
    });
  }

  if (hasPlus) {
    if (digits.length < 8 || digits.length > 15) {
      throw new ApiError(400, "validation_failed", "Некорректная длина международного номера", {
        [fieldName]: "phone_invalid",
      });
    }
    return `+${digits}`;
  }

  // Bare numbers without +
  if (/^0\d{9}$/.test(digits)) {
    // 0 + 9 digits local format -> +992...
    return `+992${digits.slice(1)}`;
  }

  if (/^\d{9}$/.test(digits)) {
    // 9 digits local format -> +992...
    return `+992${digits}`;
  }

  if (/^992\d{9}$/.test(digits)) {
    // 992 + 9 digits without plus -> +992...
    return `+${digits}`;
  }

  // Any other bare number is rejected (no arbitrary guessing of international numbers without +)
  throw new ApiError(400, "validation_failed", "Некорректный номер телефона", {
    [fieldName]: "phone_invalid",
  });
}

export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.replace(/[\s()\-]/g, "");
  if (cleaned.length < 7) return "***";
  const start = cleaned.slice(0, Math.min(4, Math.floor(cleaned.length / 2)));
  const end = cleaned.slice(-4);
  return `${start}***${end}`;
}
