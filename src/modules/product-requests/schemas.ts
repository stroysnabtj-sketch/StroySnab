import { z } from "zod";

export function getDushanbeDateStrings(now: Date = new Date()): { today: string; maxDate: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dushanbe",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(now);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const day = Number(today.slice(8, 10));

  const targetYear = year + 2;
  const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
  const targetDay = (month === 2 && day === 29 && !isLeap) ? 28 : day;
  const maxDate = `${targetYear}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

  return { today, maxDate };
}

export function makeProductRequestSchema(now: Date = new Date()) {
  const { today, maxDate } = getDushanbeDateStrings(now);

  return z.object({
    productName: z.string()
      .trim()
      .min(2, "product_name_min")
      .max(200, "product_name_max"),
    description: z.string()
      .max(2000, "description_max")
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val.trim() : null)),
    quantity: z.union([z.string(), z.number(), z.null(), z.undefined()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined) return null;
        if (typeof val === "number") {
          if (!Number.isFinite(val)) return "__invalid__";
          return String(val);
        }
        const trimmed = val.trim();
        return trimmed === "" ? null : trimmed;
      })
      .pipe(
        z.string()
          .refine((val) => /^\d+(?:[.,]\d{1,3})?$/.test(val), "quantity_invalid")
          .refine((val) => Number(val.replace(",", ".")) > 0, "quantity_positive")
          .refine((val) => val.replace(/[.,]/g, "").length <= 14, "quantity_too_large")
          .transform((val) => val.replace(",", "."))
          .nullable()
      ),
    unit: z.string()
      .max(20, "unit_max")
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val.trim() : null)),
    requiredDate: z.string()
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val.trim() : null))
      .refine(
        (val) => {
          if (!val) return true;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
          return val >= today && val <= maxDate;
        },
        "required_date_range"
      ),
    contactName: z.string()
      .trim()
      .min(2, "name_min")
      .max(120, "name_max"),
    contactPhone: z.string()
      .min(8, "phone_invalid")
      .max(30, "phone_max"),
    contactEmail: z.union([z.literal(""), z.string().trim().email("email_invalid").max(254)])
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val.trim().toLowerCase() : null)),
    website: z.string().max(100).optional(),
  }).superRefine((val, ctx) => {
    if (val.quantity && !val.unit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "unit_required",
      });
    }
  });
}

export const productRequestSchema = makeProductRequestSchema();

export const respondProductRequestSchema = z.object({
  status: z.enum(["IN_REVIEW", "AVAILABLE", "UNAVAILABLE"], {
    message: "status_invalid",
  }),
  responseNote: z.string()
    .max(2000, "note_max")
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  estimatedPriceDirams: z.union([z.string(), z.number(), z.bigint(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === "bigint") return val.toString();
      if (typeof val === "number") {
        if (!Number.isFinite(val) || val < 0) return "__invalid__";
        return Math.round(val).toString();
      }
      const trimmed = val.trim();
      return trimmed === "" ? null : trimmed;
    })
    .pipe(
      z.string()
        .regex(/^\d+$/, "price_invalid")
        .nullable()
    ),
  estimatedDeliveryDays: z.union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = Number(val);
      if (!Number.isInteger(num)) return -1;
      return num;
    })
    .pipe(
      z.number()
        .min(0, "delivery_days_min")
        .max(365, "delivery_days_max")
        .nullable()
    ),
  resolvedProductId: z.union([z.literal(""), z.string().uuid("uuid_invalid"), z.null()])
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  assignedTo: z.union([z.literal(""), z.string().uuid("uuid_invalid"), z.null()])
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  version: z.number().int().positive("version_required"),
}).superRefine((val, ctx) => {
  if ((val.status === "AVAILABLE" || val.status === "UNAVAILABLE") && !val.responseNote) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["responseNote"],
      message: "note_required",
    });
  }
  if (val.status !== "AVAILABLE" && val.resolvedProductId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["resolvedProductId"],
      message: "resolved_product_not_available",
    });
  }
});

export const customerCancelSchema = z.object({
  version: z.number().int().positive("version_required"),
  reason: z.string().max(500, "reason_max").optional().nullable(),
});
