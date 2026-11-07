import { it, expect } from "vitest";
import { z } from "zod";
import { parseExplicitPatch } from "@/modules/system/patch";
it("keeps omitted defaulted fields out of a partial update", () => {
  const schema = z.object({
    name: z.string(),
    status: z.string().default("DRAFT"),
    attributes: z.array(z.string()).default([]),
  });
  expect(parseExplicitPatch(schema, { name: "Новое имя" })).toEqual({ name: "Новое имя" });
  expect(parseExplicitPatch(schema, { status: "PUBLISHED" })).toEqual({ status: "PUBLISHED" });
});
