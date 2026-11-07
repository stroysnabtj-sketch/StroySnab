import { z } from "zod";
import { emailSchema } from "@/modules/system/utils";

export const passwordSchema = z.string().min(8, "password_min").max(128, "password_max");
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "name_min").max(120, "name_max"),
  phone: z.string().min(8, "phone_invalid"),
  email: z.union([z.literal(""), emailSchema]).optional(),
  password: passwordSchema,
  termsAccepted: z.literal(true, { message: "terms_required" }),
  refCode: z.string().trim().max(16).optional(),
});
export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1).max(128),
});
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z.object({ token: z.string().min(20), password: passwordSchema });
export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().min(8),
});
