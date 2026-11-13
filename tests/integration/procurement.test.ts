import { expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users, supplierOffers, orders, orderItems } from "@/db/schema";
import {
  createProcurementRequest,
  getProcurementRequest,
  saveQuotation,
  decideQuotation,
} from "@/modules/procurement/service";
import { recordOrderPayment, getOrderPaymentSummary } from "@/modules/orders/payment-service";
import type { SessionUser } from "@/modules/auth/session";

it("turns a private multi-line request into a quoted order once, reserves its offer, and accounts payments/refunds", async () => {
  const db = await getDb();
  const [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const [buyer] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
  const manager = { ...admin, role: "SUPER_ADMIN" } as SessionUser;
  const customer = { ...buyer, role: "CUSTOMER" } as SessionUser;
  const request = await createProcurementRequest(
    {
      title: "Материалы для стройки",
      contactName: "Покупатель",
      contactPhone: "900001122",
      contactEmail: "buyer@example.test",
      lines: [
        { name: "Цемент", qty: "2", unit: "мешок" },
        { name: "Материал по спецификации", qty: "1", unit: "шт." },
      ],
    },
    customer,
  );
  await expect(getProcurementRequest(request.id, null)).rejects.toThrow();
  const [offer] = await db
    .select()
    .from(supplierOffers)
    .where(sql`stock_qty::numeric-reserved_qty::numeric >= 3 AND is_active='true'`)
    .limit(1);
  const quote = await saveQuotation(request.id, manager, {
    version: 0,
    send: true,
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    conditions: "Доставка на объект",
    deliveryDirams: "1000",
    lines: [
      { name: "Цемент", qty: "2", unit: "мешок", offerId: offer.id, basePriceDirams: "10000" },
      { name: "Материал по спецификации", qty: "1", unit: "шт.", basePriceDirams: "5000" },
    ],
  });
  expect(quote.totalDirams).toBe("27750");
  const view = await getProcurementRequest(request.id, customer);
  expect(JSON.stringify(view)).not.toContain("basePriceDirams");
  const accepted = await decideQuotation(request.id, customer, null, {
    action: "ACCEPT",
    version: quote.version,
    deliveryAddress: "Душанбе, стройка 1",
  });
  const again = await decideQuotation(request.id, customer, null, {
    action: "ACCEPT",
    version: quote.version,
    deliveryAddress: "Душанбе, стройка 1",
  });
  expect(again.orderId).toBe(accepted.orderId);
  const [order] = await db.select().from(orders).where(eq(orders.id, accepted.orderId!));
  expect(order.totalDirams).toBe("27750");
  expect(order.customerEmail).toBe("buyer@example.test");
  expect(order.paymentMethod).toBe("CASH_ON_DELIVERY");
  expect((await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))).length).toBe(
    2,
  );
  const [after] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, offer.id));
  expect(Number(after.reservedQty)).toBe(Number(offer.reservedQty) + 2);
  await expect(
    recordOrderPayment(order.id, customer, {
      kind: "PAYMENT",
      amountDirams: "100",
      reason: "Оплата",
      idempotencyKey: crypto.randomUUID(),
    }),
  ).rejects.toThrow();
  const key = crypto.randomUUID();
  const partial = {
    kind: "PAYMENT",
    amountDirams: "10000",
    reason: "Получен перевод",
    idempotencyKey: key,
  };
  await recordOrderPayment(order.id, manager, partial);
  await recordOrderPayment(order.id, manager, partial);
  expect((await getOrderPaymentSummary(order.id)).status).toBe("PARTIAL");
  await expect(
    recordOrderPayment(order.id, manager, {
      ...partial,
      amountDirams: "999999",
      idempotencyKey: crypto.randomUUID(),
    }),
  ).rejects.toThrow();
  await recordOrderPayment(order.id, manager, {
    ...partial,
    amountDirams: "17750",
    idempotencyKey: crypto.randomUUID(),
  });
  expect((await getOrderPaymentSummary(order.id)).status).toBe("PAID");
  await recordOrderPayment(order.id, manager, {
    kind: "REFUND",
    amountDirams: "27750",
    reason: "Возврат по согласованию",
    idempotencyKey: crypto.randomUUID(),
  });
  expect((await getOrderPaymentSummary(order.id)).status).toBe("REFUNDED");
  await db
    .update(supplierOffers)
    .set({ reservedQty: offer.reservedQty })
    .where(eq(supplierOffers.id, offer.id));
});

it("protects guest access and rejects expired quotations", async () => {
  const db = await getDb();
  const [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const manager = { ...admin, role: "SUPER_ADMIN" } as SessionUser;
  const r = await createProcurementRequest(
    {
      title: "Список гостя",
      contactName: "Покупатель",
      contactPhone: "900001133",
      lines: [{ name: "Кирпич", qty: "10", unit: "шт." }],
    },
    null,
  );
  await expect(getProcurementRequest(r.id, null, "wrong")).rejects.toThrow();
  expect((await getProcurementRequest(r.id, null, r.accessToken)).request.id).toBe(r.id);
  await expect(
    saveQuotation(r.id, manager, {
      version: 0,
      send: true,
      validUntil: new Date(Date.now() - 1000).toISOString(),
      deliveryDirams: "0",
      conditions: "",
      lines: [{ name: "Кирпич", qty: "10", unit: "шт.", basePriceDirams: "100" }],
    }),
  ).rejects.toThrow();
});
