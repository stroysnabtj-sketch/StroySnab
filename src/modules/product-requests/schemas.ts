import { z } from "zod";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dushanbe", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const maxDate = `${Number(today.slice(0, 4)) + 2}${today.slice(4)}`;
export const productRequestSchema = z.object({
  productName: z.string().trim().min(2).max(200), description: z.string().max(2000).optional().nullable(),
  quantity: z.string().trim().regex(/^\d+(?:[.,]\d{1,3})?$/).refine((value) => Number(value.replace(",", ".")) > 0, "quantity_positive").refine((value) => value.replace(/[.,]/g, "").length <= 14, "quantity_too_large").optional().nullable(),
  unit: z.string().trim().max(20).optional().nullable(), requiredDate: z.string().date().refine((value) => value >= today && value <= maxDate, "required_date_range").optional().nullable(),
  contactName: z.string().trim().min(2).max(120), contactPhone: z.string().min(9).max(30), contactEmail: z.string().trim().email().max(254).optional().nullable(), website: z.string().max(100).optional(),
}).superRefine((value, context) => { if (value.quantity && !value.unit) context.addIssue({ code: "custom", path: ["unit"], message: "unit_required" }); });
