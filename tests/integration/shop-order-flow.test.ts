import { customerOrderView } from "@/modules/orders/customer-view";
import { expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, products, supplierOffers, supplierUsers, suppliers, users } from "@/db/schema";
import { addCartItem } from "@/modules/cart/service";
import { createOrder, quoteOrder, getOrder, changeOrderStatus } from "@/modules/orders/service";
import { getShopOrder, updateShopOrderStatus } from "@/modules/suppliers/shop-service";
it("routes shop orders, snapshots base prices and applies 7/5/3 percent to the whole basket", async () => {
  const db = await getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.status, "PUBLISHED"))
    .limit(1);
  async function shop() {
    const [supplier] = await db
      .insert(suppliers)
      .values({ name: `Магазин ${crypto.randomUUID()}`, phone: "+992931234567", status: "ACTIVE" })
      .returning();
    const [user] = await db
      .insert(users)
      .values({
        phone: `shop-${crypto.randomUUID()}`,
        passwordHash: "test",
        role: "SUPPLIER_OWNER",
      })
      .returning();
    await db
      .insert(supplierUsers)
      .values({ supplierId: supplier.id, userId: user.id, role: "OWNER" });
    const [offer] = await db
      .insert(supplierOffers)
      .values({
        supplierId: supplier.id,
        productId: product.id,
        supplierPriceDirams: 2500000n,
        stockQty: "20",
        minOrderQty: "1",
      })
      .returning();
    return { supplier, actor: { ...user, role: "SUPPLIER_OWNER" as const }, offer };
  }
  const a = await shop(),
    b = await shop();
  let sharedId = "",
    firstId = "",
    firstToken = "";
  for (const scenario of [
    { a: 1, b: 0, rate: 7 },
    { a: 1, b: 1, rate: 5 },
    { a: 3, b: 2, rate: 3 },
  ]) {
    const guestToken = crypto.randomUUID();
    await addCartItem({ offerId: a.offer.id, qty: String(scenario.a), guestToken });
    if (scenario.b) await addCartItem({ offerId: b.offer.id, qty: String(scenario.b), guestToken });
    const quote = await quoteOrder({ guestToken, fulfillment: "PICKUP" });
    expect(quote.markupPercent).toBe(scenario.rate);
    const order = await createOrder({
      guestToken,
      idempotencyKey: crypto.randomUUID(),
      expectedTotalDirams: quote.totalDirams,
      customerName: "Покупатель",
      customerPhone: "+992931234567",
      deliveryCity: "Душанбе",
      deliveryAddress: "",
      fulfillment: "PICKUP",
      paymentMethod: "CASH_ON_DELIVERY",
    });
    const own = await getShopOrder(a.actor, order.id);
    expect(own.items).toHaveLength(1);
    expect(own.supplierTotalDirams).toBe(String(2500000 * scenario.a));
    expect(own.markupPercent).toBe(scenario.rate);
    if (scenario.b) {
      const other = await getShopOrder(b.actor, order.id);
      expect(other.items).toHaveLength(1);
      expect(other.items[0].supplierId).toBe(b.supplier.id);
      sharedId = order.id;
    } else {
      firstId = order.id;
      firstToken = guestToken;
      await expect(getShopOrder(b.actor, order.id)).rejects.toThrow("Заказ не найден");
      await expect(
        updateShopOrderStatus(b.actor, order.id, { status: "ACCEPTED", expectedStatus: "NEW" }),
      ).rejects.toMatchObject({ status: 404 });
      expect(await getOrder(order.id, { guestToken: crypto.randomUUID() })).toBeNull();
    }
  }
  await updateShopOrderStatus(a.actor, sharedId, { status: "ACCEPTED", expectedStatus: "NEW" });
  await updateShopOrderStatus(a.actor, sharedId, { status: "READY", expectedStatus: "ACCEPTED" });
  expect((await getShopOrder(b.actor, sharedId)).shopStatus).toBe("NEW");
  expect((await db.select().from(orders).where(eq(orders.id, sharedId)))[0].status).toBe("NEW");
  await expect(
    updateShopOrderStatus(a.actor, sharedId, { status: "HANDED_OVER", expectedStatus: "READY" }),
  ).rejects.toThrow(/подтверждения/);
  const [platformUser] = await db
    .select()
    .from(users)
    .where(eq(users.role, "SUPER_ADMIN"))
    .limit(1);
  const platformActor = { id: platformUser.id, role: "SUPER_ADMIN" as const };
  await changeOrderStatus(platformActor, sharedId, { status: "CONFIRMED", expectedStatus: "NEW" });
  await updateShopOrderStatus(a.actor, sharedId, {
    status: "HANDED_OVER",
    expectedStatus: "READY",
  });
  await expect(
    changeOrderStatus(platformActor, sharedId, {
      status: "CANCELLED",
      expectedStatus: "CONFIRMED",
    }),
  ).rejects.toThrow(/передан/);
  expect((await db.select().from(orders).where(eq(orders.id, sharedId)))[0].status).toBe(
    "CONFIRMED",
  );
  await db
    .update(supplierOffers)
    .set({ supplierPriceDirams: 999n })
    .where(eq(supplierOffers.id, a.offer.id));
  expect((await getShopOrder(a.actor, firstId)).supplierTotalDirams).toBe("2500000");
  await db.delete(supplierOffers).where(eq(supplierOffers.id, a.offer.id));
  expect((await getShopOrder(a.actor, firstId)).items).toHaveLength(1);
  const publicView = customerOrderView((await getOrder(firstId, { guestToken: firstToken }))!);
  expect(publicView).not.toHaveProperty("guestAccessTokenHash");
  expect(publicView).not.toHaveProperty("goodsBaseDirams");
  expect(publicView.items[0]).not.toHaveProperty("supplierPriceDirams");
  expect(publicView.items[0]).not.toHaveProperty("supplierSubtotalDirams");
});
