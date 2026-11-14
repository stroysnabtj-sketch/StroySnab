import { expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, supplierOffers, priceHistory } from "@/db/schema";
it("records price changes atomically, ignores stock-only updates and protects history", async () => {
  const db = await getDb();
  const [offer] = await db.select().from(supplierOffers).limit(1);
  const before = await db.select().from(priceHistory).where(eq(priceHistory.entityId, offer.id));
  await db
    .update(supplierOffers)
    .set({ supplierPriceDirams: offer.supplierPriceDirams + 1n })
    .where(eq(supplierOffers.id, offer.id));
  const rows = await db.select().from(priceHistory).where(eq(priceHistory.entityId, offer.id));
  expect(rows).toHaveLength(before.length + 1);
  const latest = rows.find(
    (r) =>
      r.operation === "UPDATE" &&
      r.after?.supplierPriceDirams === (offer.supplierPriceDirams + 1n).toString(),
  );
  expect(latest).toBeTruthy();
  await db
    .update(supplierOffers)
    .set({ updatedAt: new Date() })
    .where(eq(supplierOffers.id, offer.id));
  expect(
    await db.select().from(priceHistory).where(eq(priceHistory.entityId, offer.id)),
  ).toHaveLength(rows.length);
  await expect(db.delete(priceHistory).where(eq(priceHistory.id, latest!.id))).rejects.toThrow();
  await expect(
    db.update(priceHistory).set({ operation: "DELETE" }).where(eq(priceHistory.id, latest!.id)),
  ).rejects.toThrow();
  await expect(db.execute(sql`TRUNCATE price_history`)).rejects.toThrow();
  await db
    .update(supplierOffers)
    .set({ supplierPriceDirams: offer.supplierPriceDirams })
    .where(eq(supplierOffers.id, offer.id));
});
it("rolls history back when a pricing transaction fails", async () => {
  const db = await getDb();
  const [p] = await db.select().from(products).limit(1);
  const before = await db.select().from(priceHistory).where(eq(priceHistory.entityId, p.id));
  await expect(
    db.transaction(async (tx) => {
      await tx.update(products).set({ markupPercent: "19" }).where(eq(products.id, p.id));
      throw Error("rollback-test");
    }),
  ).rejects.toThrow("rollback-test");
  expect(await db.select().from(priceHistory).where(eq(priceHistory.entityId, p.id))).toHaveLength(
    before.length,
  );
});
