import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products, supplierOffers, users } from "@/db/schema";
import { listCatalog } from "@/modules/catalog/service";
import {
  getHomeCollections,
  replaceHomeCollection,
  homeCollectionInput,
} from "@/modules/merchandising/service";
import type { SessionUser } from "@/modules/auth/session";

const editor: SessionUser = { id: randomUUID(), role: "CONTENT_MANAGER", email: null, phone: "" };
beforeAll(async () => {
  const db = await getDb();
  editor.id = (await db.select({ id: users.id }).from(users).limit(1))[0].id;
  const migration = await readFile("drizzle/0012_home_collections.sql", "utf8");
  await db.execute(sql.raw(migration));
});

describe("managed home collections", () => {
  it("accepts exactly twelve distinct selections", () => {
    expect(homeCollectionInput.parse(Array.from({ length: 12 }, () => randomUUID()))).toHaveLength(
      12,
    );
  });
  it("rejects unauthorized edits, duplicates and more than twelve selections", async () => {
    await expect(replaceHomeCollection({ ...editor, role: "CUSTOMER" }, "new", [])).rejects.toThrow(
      "Недостаточно прав",
    );
    await expect(
      replaceHomeCollection(
        editor,
        "new",
        Array.from({ length: 13 }, () => randomUUID()),
      ),
    ).rejects.toThrow();
    const id = randomUUID();
    await expect(replaceHomeCollection(editor, "sale", [id, id])).rejects.toThrow();
  });
  it("saves and publishes all twelve positions", async () => {
    const items = (await listCatalog({ pageSize: 12 })).items;
    expect(items).toHaveLength(12);
    await replaceHomeCollection(
      editor,
      "sale",
      items.map((item) => item.id),
    );
    expect((await getHomeCollections()).sale.map((item) => item.id)).toEqual(
      items.map((item) => item.id),
    );
    await replaceHomeCollection(editor, "sale", []);
  });
  it("preserves editorial order, uses real prices and supports empty selections", async () => {
    const catalog = await listCatalog({ pageSize: 2 });
    const ids = catalog.items.map((item) => item.id).reverse();
    await replaceHomeCollection(editor, "sale", ids);
    const home = await getHomeCollections();
    expect(home.sale.map((item) => item.id)).toEqual(ids);
    for (const item of home.sale) {
      expect(item.priceDirams).toBe(catalog.items.find((row) => row.id === item.id)!.priceDirams);
      expect(item.oldPriceDirams).toBeUndefined();
    }
    await replaceHomeCollection(editor, "sale", []);
    expect((await getHomeCollections()).sale).toEqual([]);
  });
  it("removes unpublished and hidden-category selections from the storefront", async () => {
    const db = await getDb();
    const item = (await listCatalog({ pageSize: 1 })).items[0];
    await replaceHomeCollection(editor, "new", [item.id]);
    await db.update(products).set({ status: "DRAFT" }).where(eq(products.id, item.id));
    try {
      expect((await getHomeCollections()).new).toEqual([]);
    } finally {
      await db.update(products).set({ status: "PUBLISHED" }).where(eq(products.id, item.id));
    }
    await db
      .update(categories)
      .set({ isActive: "false" })
      .where(eq(categories.id, item.categoryId));
    try {
      expect((await getHomeCollections()).new).toEqual([]);
    } finally {
      await db
        .update(categories)
        .set({ isActive: "true" })
        .where(eq(categories.id, item.categoryId));
    }
    await replaceHomeCollection(editor, "new", []);
  });
  it("omits products without a valid active offer", async () => {
    const db = await getDb();
    const item = (await listCatalog({ pageSize: 1 })).items[0];
    const offers = await db
      .select()
      .from(supplierOffers)
      .where(eq(supplierOffers.productId, item.id));
    await replaceHomeCollection(editor, "new", [item.id]);
    await db
      .update(supplierOffers)
      .set({ isActive: "false" })
      .where(eq(supplierOffers.productId, item.id));
    try {
      expect((await getHomeCollections()).new).toEqual([]);
    } finally {
      for (const offer of offers)
        await db
          .update(supplierOffers)
          .set({ isActive: offer.isActive })
          .where(eq(supplierOffers.id, offer.id));
      await replaceHomeCollection(editor, "new", []);
    }
  });
});
