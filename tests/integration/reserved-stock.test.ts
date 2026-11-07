import { it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, supplierOffers, suppliers, users } from "@/db/schema";
import { upsertOffer, updateOffer } from "@/modules/suppliers/offer-service";
it("never reduces stock below its reservation through create/update/import paths", async () => {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const actor = { ...user, role: "SUPER_ADMIN" as const };
  const [product] = await db.select().from(products).limit(1);
  const [shop] = await db
    .insert(suppliers)
    .values({ name: "Проверка резерва", phone: "+992931234567", status: "ACTIVE" })
    .returning();
  const [offer] = await db
    .insert(supplierOffers)
    .values({
      supplierId: shop.id,
      productId: product.id,
      supplierPriceDirams: 10000n,
      stockQty: "10",
      reservedQty: "2",
      minOrderQty: "1",
      isActive: "false",
    })
    .returning();
  try {
    await expect(
      upsertOffer(actor, shop.id, {
        productId: product.id,
        supplierPriceDirams: "10000",
        stockQty: "1",
        minOrderQty: "1",
        leadTimeDays: 0,
        isActive: "false",
      }),
    ).rejects.toThrow(/резерв/);
    await expect(updateOffer(actor, offer.id, shop.id, { stockQty: "1" })).rejects.toThrow(
      /резерв/,
    );
    await updateOffer(actor, offer.id, shop.id, { supplierPriceDirams: "20000" });
    const [after] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, offer.id));
    expect(Number(after.stockQty)).toBe(10);
    expect(Number(after.reservedQty)).toBe(2);
    expect(after.isActive).toBe("false");
  } finally {
    await db.delete(supplierOffers).where(eq(supplierOffers.id, offer.id));
    await db.delete(suppliers).where(eq(suppliers.id, shop.id));
  }
});
