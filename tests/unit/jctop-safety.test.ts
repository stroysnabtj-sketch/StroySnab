import { expect, it } from "vitest";
import { cleanAndEnrichItems, ensureJctopCatalog, type JctopItem } from "@/modules/catalog/jctop-sync";
import type { AppDatabase } from "@/db";
it("never starts catalog synchronization implicitly", async () => {
  const db = new Proxy({}, { get() { throw new Error("unexpected database access"); } });
  expect(await ensureJctopCatalog(db as AppDatabase)).toEqual({ synced: false });
});
it("does not invent missing specifications or copy them from a sibling model", () => {
  const items = [
    { id: 1, code: "SX0601", name: "Drill", spec: "", } as JctopItem,
    { id: 2, code: "SX0601SH", name: "Drill", spec: "21V", } as JctopItem,
  ];
  const result = cleanAndEnrichItems(items);
  expect(result[0].spec).toBe("");
  expect(result[1].spec).toBe("21V");
});
