import { expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { supplierOffers, users } from "@/db/schema";
import { addCartItem } from "@/modules/cart/service";
import { createOrder, getOrder, quoteOrder, changeOrderStatus } from "@/modules/orders/service";
it("prices from offers, reserves once, protects guest access and rejects excess stock", async () => {
  const db = await getDb();
  const [offer] = await db
    .select()
    .from(supplierOffers)
    .where(sql`stock_qty::numeric - reserved_qty::numeric >= 2 AND min_order_qty::numeric <= 1`)
    .limit(1);
  const token = randomBytes(32).toString("hex");
  await addCartItem({ offerId: offer.id, qty: "1", guestToken: token });
  const input = {
    guestToken: token,
    idempotencyKey: crypto.randomUUID(),
    customerName: "Покупатель",
    customerPhone: "+992900001122",
    deliveryCity: "Кушониён",
    deliveryAddress: "Улица 10",
    fulfillment: "PICKUP" as const,
    paymentMethod: "CASH_ON_DELIVERY" as const,
  };
  const quote = await quoteOrder(input);
  expect(quote.baseDirams).toBe(offer.supplierPriceDirams.toString());
  expect(quote.deliveryTotalDirams).toBe("0");
  await expect(createOrder({ ...input, expectedTotalDirams: "1" } as typeof input)).rejects.toThrow(
    "Стоимость изменилась",
  );
  const result = await createOrder({ ...input, totalDirams: "1" } as typeof input);
  const again = await createOrder(input);
  expect(again.id).toBe(result.id);
  const [reserved] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, offer.id));
  expect(Number(reserved.reservedQty)).toBe(Number(offer.reservedQty) + 1);
  expect(await getOrder(result.id, {})).toBeNull();
  expect(await getOrder(result.id, { guestToken: token })).not.toBeNull();
  expect(await getOrder(result.id, { guestToken: "wrong" })).toBeNull();
  const token2 = randomBytes(32).toString("hex");
  await addCartItem({ offerId: offer.id, qty: "1", guestToken: token2 });
  await db
    .update(supplierOffers)
    .set({ reservedQty: reserved.stockQty })
    .where(eq(supplierOffers.id, offer.id));
  await expect(
    createOrder({ ...input, guestToken: token2, idempotencyKey: crypto.randomUUID() }),
  ).rejects.toThrow();
  await db
    .update(supplierOffers)
    .set({ reservedQty: offer.reservedQty })
    .where(eq(supplierOffers.id, offer.id));
});

it("allows only the owning customer and keeps customer prices on linked lines", async () => {
  const db = await getDb();
  const { users, customers, carts } = await import("@/db/schema");
  const [{ id: userId }] = await db
    .insert(users)
    .values({ phone: `test-order-${crypto.randomUUID()}`, passwordHash: "test", role: "CUSTOMER" })
    .returning();
  await db.insert(customers).values({ userId, fullName: "Покупатель" });
  const [offer] = await db
    .select()
    .from(supplierOffers)
    .where(sql`stock_qty::numeric - reserved_qty::numeric >= 2 AND min_order_qty::numeric <= 1`)
    .limit(1);
  try {
    await addCartItem({ offerId: offer.id, qty: "1", userId });
    const input = {
      userId,
      idempotencyKey: crypto.randomUUID(),
      customerName: "Покупатель",
      customerPhone: "90 000 11 22",
      deliveryCity: "Кушониён",
      deliveryAddress: "Улица 10",
      fulfillment: "DELIVERY" as const,
      paymentMethod: "BANK_INVOICE" as const,
    };
    const quote = await quoteOrder(input);
    expect(quote.deliveryTotalDirams).toBe("0");
    const [result, retry] = await Promise.all([createOrder(input), createOrder(input)]);
    expect(retry.id).toBe(result.id);
    const order = await getOrder(result.id, { userId });
    expect(order?.totalDirams).toBe(quote.totalDirams);
    expect(order?.customerPhone).toBe("+992900001122");
    expect(order?.orderNumber).toMatch(/^ORD-\d+$/);
    expect(order?.items[0].offerId).toBe(offer.id);
    expect(order?.items[0].productId).toBe(offer.productId);
    expect(
      order?.items.reduce((sum, item) => sum + BigInt(item.subtotalDirams), 0n).toString(),
    ).toBe(order?.materialsTotalDirams);
    expect(order?.driverName).toBeNull();
    expect(order?.guestAccessTokenHash).toBeNull();
    expect(await getOrder(result.id, { userId: crypto.randomUUID() })).toBeNull();
    expect(await getOrder(result.id, { guestToken: "anything" })).toBeNull();
    expect(
      await db.select().from(carts).where(eq(carts.customerId, order!.customerId!)),
    ).toHaveLength(1);
  } finally {
    await db
      .update(supplierOffers)
      .set({ reservedQty: offer.reservedQty })
      .where(eq(supplierOffers.id, offer.id));
    await db.delete(users).where(eq(users.id, userId));
  }
});

async function makeStatusOrder() {
  const db = await getDb();
  const [offer] = await db
    .select()
    .from(supplierOffers)
    .where(sql`stock_qty::numeric - reserved_qty::numeric >= 2 AND min_order_qty::numeric <= 1`)
    .limit(1);
  const token = randomBytes(32).toString("hex");
  await addCartItem({ offerId: offer.id, qty: "1", guestToken: token });
  const order = await createOrder({
    guestToken: token,
    idempotencyKey: crypto.randomUUID(),
    customerName: "Статус заказа",
    customerPhone: "+992900001122",
    deliveryCity: "Душанбе",
    deliveryAddress: "Тестовый адрес",
    fulfillment: "PICKUP",
    paymentMethod: "CASH_ON_DELIVERY",
  });
  const [user] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
  return { db, offer, order, actor: { id: user.id, role: "ADMIN" as const } };
}
it("cancels atomically and releases its reserve exactly once", async () => {
  const { db, offer, order, actor } = await makeStatusOrder();
  await changeOrderStatus(actor, order.id, { status: "CANCELLED", expectedStatus: "NEW" });
  await changeOrderStatus(actor, order.id, { status: "CANCELLED", expectedStatus: "NEW" });
  const [after] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, offer.id));
  expect(Number(after.reservedQty)).toBe(Number(offer.reservedQty));
  expect(after.stockQty).toBe(offer.stockQty);
  await expect(
    changeOrderStatus({ ...actor, role: "CUSTOMER" }, order.id, {
      status: "CONFIRMED",
      expectedStatus: "CANCELLED",
    }),
  ).rejects.toThrow("Нет права");
});
it("completes the allowed lifecycle and deducts stock exactly once", async () => {
  const { db, offer, order, actor } = await makeStatusOrder();
  await expect(
    changeOrderStatus(actor, order.id, { status: "DELIVERED", expectedStatus: "NEW" }),
  ).rejects.toThrow();
  await changeOrderStatus(actor, order.id, { status: "CONFIRMED", expectedStatus: "NEW" });
  await changeOrderStatus(actor, order.id, { status: "DISPATCHED", expectedStatus: "CONFIRMED" });
  await changeOrderStatus(actor, order.id, { status: "DELIVERED", expectedStatus: "DISPATCHED" });
  await changeOrderStatus(actor, order.id, { status: "DELIVERED", expectedStatus: "DISPATCHED" });
  const [after] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, offer.id));
  expect(Number(after.reservedQty)).toBe(Number(offer.reservedQty));
  expect(Number(after.stockQty)).toBe(Number(offer.stockQty) - 1);
});
