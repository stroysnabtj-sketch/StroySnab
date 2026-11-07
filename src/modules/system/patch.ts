import type { z } from "zod";
export function parseExplicitPatch<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  input: unknown,
) {
  const parsed = schema.partial().parse(input);
  const fields = parsed as Record<string, unknown>;
  for (const key of Object.keys(fields))
    if (!Object.prototype.hasOwnProperty.call(input, key)) delete fields[key];
  return parsed;
}
