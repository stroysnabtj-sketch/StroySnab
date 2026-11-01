import { z } from "zod";
export const emailSchema = z.string().trim().toLowerCase().max(254).email();
export function emptyToNull<T extends string | null | undefined>(value: T): string | null {
  return value?.trim() ? value.trim() : null;
}
