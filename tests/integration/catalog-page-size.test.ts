import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products, supplierOffers, suppliers } from "@/db/schema";
import { listCatalog } from "@/modules/catalog/service";

const categoryId = randomUUID();
const slug = `pagination-${categoryId}`;
afterAll(async () => {
  const db = await getDb();
  await db.delete(products).where(eq(products.categoryId, categoryId));
  await db.delete(categories).where(eq(categories.id, categoryId));
});

it("returns complete 20, 50 and 100 product windows and clamps the final page", async () => {
  const db = await getDb();
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.status, "ACTIVE"))
    .limit(1);
  await db.insert(categories).values({ id: categoryId, slug, nameRu: "Pagination" });
  const rows = Array.from({ length: 105 }, (_, index) => ({
    id: randomUUID(),
    sku: `${categoryId}-${index}`,
    slug: `${categoryId}-${index}`,
    nameRu: `Товар ${String(index).padStart(3, "0")}`,
    categoryId,
    unit: "шт",
    status: "PUBLISHED",
  }));
  await db.insert(products).values(rows);
  await db
    .insert(supplierOffers)
    .values(
      rows.map((row) => ({
        productId: row.id,
        supplierId: supplier.id,
        supplierPriceDirams: 100n,
        stockQty: "10",
      })),
    );
  for (const pageSize of [20, 50, 100]) {
    const first = await listCatalog({ category: slug, pageSize, page: 1, sort: "name" });
    expect(first.pageSize).toBe(pageSize);
    expect(first.items.map((item) => item.id)).toEqual(
      rows.slice(0, pageSize).map((row) => row.id),
    );
    const last = await listCatalog({ category: slug, pageSize, page: 999, sort: "name" });
    expect(last.page).toBe(Math.ceil(105 / pageSize));
    expect(last.items.map((item) => item.id)).toEqual(
      rows.slice((last.page - 1) * pageSize).map((row) => row.id),
    );
  }
});
