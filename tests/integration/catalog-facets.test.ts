import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  products,
  productAttributes,
  supplierOffers,
  suppliers,
  files,
  productImages,
} from "@/db/schema";
import { listCatalog } from "@/modules/catalog/service";
const categoryId = randomUUID();
const childId = randomUUID();
const leafId = randomUUID();
const fileId = randomUUID();
afterAll(async () => {
  const db = await getDb();
  await db.delete(products).where(eq(products.categoryId, categoryId));
  for (const id of [leafId, childId]) {
    await db.delete(products).where(eq(products.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));
  }
  await db.delete(categories).where(eq(categories.id, categoryId));
  await db.delete(files).where(eq(files.id, fileId));
});
describe("catalog facet intersection", () => {
  it("supports brand OR, attribute AND, self excluding counts, and honest prices", async () => {
    const db = await getDb();
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.status, "ACTIVE"))
      .limit(1);
    await db
      .insert(categories)
      .values({ id: categoryId, slug: `test-${categoryId}`, nameRu: "Test" });
    await db
      .insert(files)
      .values({ id: fileId, storageKey: `catalog-test-${fileId}`, mime: "image/png", size: 1 });
    for (const [brand, color, size, stock] of [
      ["A", "red", "small", "10"],
      ["B", "blue", "small", "10"],
      ["C", "red", "large", "10"],
      ["A", "green", "small", "0"],
    ]) {
      const id = randomUUID();
      await db
        .insert(products)
        .values({
          id,
          sku: id,
          slug: id,
          nameRu: id,
          categoryId,
          brand,
          unit: "шт",
          status: "PUBLISHED",
        });
      if (brand === "B") await db.insert(productImages).values({ productId: id, fileId });
      await db.insert(productAttributes).values([
        { productId: id, name: "Color", value: color },
        { productId: id, name: "Size", value: size },
      ]);
      await db
        .insert(supplierOffers)
        .values({
          productId: id,
          supplierId: supplier.id,
          supplierPriceDirams: 10001n,
          stockQty: stock,
        });
    }
    const result = await listCatalog({
      category: `test-${categoryId}`,
      brands: ["A", "B"],
      inStock: true,
      attributes: { Color: ["red", "blue"], Size: "small" },
    });
    expect(result.items.find((item) => item.brand === "B")?.imageUrl).toBe(`/api/files/${fileId}`);
    expect(result.total).toBe(2);
    expect(
      (await listCatalog({ category: `test-${categoryId}`, brands: ["A"], inStock: true })).total,
    ).toBe(1);
    expect((await listCatalog({ category: `missing-${categoryId}` })).total).toBe(0);
    expect(result.items.map((item) => item.brand).sort()).toEqual(["A", "B"]);
    expect(
      result.items.every(
        (item) =>
          item.priceDirams === "10701" && !item.oldPriceDirams && !item.isHit && !item.isNew,
      ),
    ).toBe(true);
    expect(result.facets.find((f) => f.key === "Color")?.options).toEqual(
      expect.arrayContaining([
        { value: "red", count: 1 },
        { value: "blue", count: 1 },
      ]),
    );
    const excluded = await listCatalog({
      category: `test-${categoryId}`,
      inStock: true,
      attributes: { Color: "red", Size: "small" },
    });
    expect(excluded.facets.find((f) => f.key === "Size")?.options).toEqual(
      expect.arrayContaining([
        { value: "small", count: 1 },
        { value: "large", count: 1 },
      ]),
    );
    expect(
      excluded.facets.find((f) => f.key === "Color")?.options.find((o) => o.value === "green")
        ?.count ?? 0,
    ).toBe(0);
    await db
      .insert(categories)
      .values({ id: childId, parentId: categoryId, slug: `child-${childId}`, nameRu: "Child" });
    await db
      .insert(categories)
      .values({ id: leafId, parentId: childId, slug: `leaf-${leafId}`, nameRu: "Leaf" });
    const nestedId = randomUUID();
    await db
      .insert(products)
      .values({
        id: nestedId,
        sku: nestedId,
        slug: nestedId,
        nameRu: "Nested",
        categoryId: leafId,
        unit: "шт",
        status: "PUBLISHED",
      });
    await db
      .insert(supplierOffers)
      .values({
        productId: nestedId,
        supplierId: supplier.id,
        supplierPriceDirams: 100n,
        stockQty: "1",
      });
    expect((await listCatalog({ category: `test-${categoryId}` })).total).toBe(5);
    expect(
      (await listCatalog({ category: `child-${childId}` })).items.map((item) => item.id),
    ).toEqual([nestedId]);
  });
});

it("normalizes units and applies numeric bounds with self-excluding facet limits", async () => {
  const db = await getDb();
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.status, "ACTIVE"))
    .limit(1);
  const id = randomUUID();
  const productIds: string[] = [];
  await db.insert(categories).values({ id, slug: "gipsokarton", nameRu: "Гипсокартон" });
  try {
    for (const [index, value] of ["10 мм", "1 см", "12,5 мм", "20 мм"].entries()) {
      const productId = randomUUID();
      productIds.push(productId);
      await db
        .insert(products)
        .values({
          id: productId,
          sku: productId,
          slug: productId,
          nameRu: `Лист ${index}`,
          categoryId: id,
          unit: "шт.",
          status: "PUBLISHED",
        });
      await db
        .insert(productAttributes)
        .values({ productId, name: index % 2 ? "tolshchina-lista" : "Толщина листа", value });
      await db
        .insert(supplierOffers)
        .values({
          productId,
          supplierId: supplier.id,
          supplierPriceDirams: 10000n,
          stockQty: "10",
        });
    }
    const result = await listCatalog({
      category: "gipsokarton",
      attributeRanges: { "tolshchina-lista": { min: 12, max: 18 } },
    });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe("Лист 2");
    const facet = result.facets.find((field) => field.key === "tolshchina-lista")!;
    expect(facet.type).toBe("range");
    expect(facet.min).toBe(10);
    expect(facet.max).toBe(20);
    expect(facet.options.find((option) => option.value === "10")?.count).toBe(2);
  } finally {
    for (const productId of productIds) await db.delete(products).where(eq(products.id, productId));
    await db.delete(categories).where(eq(categories.id, id));
  }
});
