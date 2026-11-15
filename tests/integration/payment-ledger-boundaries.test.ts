import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import { getDb } from "@/db";
import { auditLog, notificationOutbox, orderPayments, orders, users } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { getOrderPaymentSummary, recordOrderPayment } from "@/modules/orders/payment-service";

async function fixture(status: "CONFIRMED" | "CANCELLED" = "CONFIRMED") {
  const db = await getDb();
  const [actor] = await db
    .insert(users)
    .values({
      phone: `payment-test-${randomUUID()}`,
      passwordHash: "test",
      role: "ADMIN",
    })
    .returning();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `PAY-${randomUUID()}`,
      customerName: "Ledger test",
      customerPhone: "+992900111224",
      deliveryAddress: "Test address",
      totalDirams: "1000",
      status,
    })
    .returning();
  return {
    db,
    order,
    actor: actor as SessionUser,
    snapshot: async () => ({
      summary: await getOrderPaymentSummary(order.id),
      ledger: await db.select().from(orderPayments).where(eq(orderPayments.orderId, order.id)),
      audit: await db.select().from(auditLog).where(eq(auditLog.entityId, order.id)),
      outbox: await db
        .select()
        .from(notificationOutbox)
        .where(eq(notificationOutbox.entityId, order.id)),
    }),
    clean: async () => {
      await db.delete(notificationOutbox).where(eq(notificationOutbox.entityId, order.id));
      await db.delete(auditLog).where(eq(auditLog.entityId, order.id));
      await db.delete(orderPayments).where(eq(orderPayments.orderId, order.id));
      await db.delete(orders).where(eq(orders.id, order.id));
      await db.delete(users).where(eq(users.id, actor.id));
    },
  };
}

function payment(amountDirams = "600") {
  return {
    kind: "PAYMENT" as const,
    amountDirams,
    reason: "Bank receipt",
    reference: "receipt-1",
    method: "BANK_TRANSFER" as const,
    idempotencyKey: randomUUID(),
  };
}

it("replays a payment once and rejects changed financial or receipt fields without side effects", async () => {
  // Removing idempotency comparison/deduplication must change ledger, audit or outbox here.
  const f = await fixture();
  const input = payment();
  try {
    await recordOrderPayment(f.order.id, f.actor, input);
    const before = await f.snapshot();
    expect(before.summary).toEqual({
      status: "PARTIAL",
      paidDirams: "600",
      totalDirams: "1000",
      balanceDirams: "400",
    });
    expect(before.ledger).toHaveLength(1);
    expect(before.audit).toHaveLength(1);
    expect(before.outbox).toEqual([
      expect.objectContaining({ event: "PAYMENT_CONFIRMED", state: "queued" }),
    ]);
    expect(await recordOrderPayment(f.order.id, f.actor, input)).toEqual(before.summary);
    for (const change of [
      { amountDirams: "601" },
      { kind: "REFUND" },
      { reason: "Different receipt" },
      { method: "CASH" },
      { reference: "receipt-2" },
      { reference: undefined },
    ]) {
      await expect(
        recordOrderPayment(f.order.id, f.actor, { ...input, ...change }),
      ).rejects.toMatchObject({ status: 409, code: "idempotency_conflict" });
    }
    expect(await f.snapshot()).toEqual(before);
  } finally {
    await f.clean();
  }
});

it("serializes competing payments and refunds at the available balance", async () => {
  // Missing balance enforcement would allow both competing operations to commit.
  const f = await fixture();
  try {
    const results = await Promise.allSettled([
      recordOrderPayment(f.order.id, f.actor, payment("600")),
      recordOrderPayment(f.order.id, f.actor, payment("600")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { status: 409, code: "invalid_payment" },
    });
    const refunds = await Promise.allSettled(
      [1, 2].map(() =>
        recordOrderPayment(f.order.id, f.actor, {
          ...payment("400"),
          kind: "REFUND",
        }),
      ),
    );
    expect(refunds.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(refunds.find((r) => r.status === "rejected")).toMatchObject({
      reason: { status: 409, code: "invalid_refund" },
    });
    const after = await f.snapshot();
    expect(after.summary).toEqual({
      status: "PARTIAL",
      paidDirams: "200",
      totalDirams: "1000",
      balanceDirams: "800",
    });
    expect(after.ledger).toHaveLength(2);
    expect(after.audit).toHaveLength(2);
    expect(after.outbox).toHaveLength(1);
  } finally {
    await f.clean();
  }
});

it("rejects unauthorized and malformed ledger entries without changing accounting or notifications", async () => {
  // Missing permission or positive-integer validation would allow one of these writes.
  const f = await fixture();
  try {
    const before = await f.snapshot();
    for (const role of [
      "CUSTOMER",
      "LOGISTICS",
      "PROCUREMENT_MANAGER",
      "CONTENT_MANAGER",
      "SUPPLIER_OWNER",
    ] as const) {
      for (const kind of ["PAYMENT", "REFUND"] as const) {
        await expect(
          recordOrderPayment(f.order.id, { ...f.actor, role }, { ...payment(), kind }),
        ).rejects.toMatchObject({ status: 403, code: "forbidden" });
      }
    }
    for (const amountDirams of ["0", "-1", "1.5", "01", "1000000000000000"]) {
      await expect(
        recordOrderPayment(f.order.id, f.actor, payment(amountDirams)),
      ).rejects.toThrow();
    }
    await expect(
      recordOrderPayment(f.order.id, f.actor, { ...payment("1"), kind: "REFUND" }),
    ).rejects.toMatchObject({ status: 409, code: "invalid_refund" });
    expect(await f.snapshot()).toEqual(before);
  } finally {
    await f.clean();
  }
});

it("blocks new payment after cancellation while allowing exact refund and its retry", async () => {
  // A missing cancelled-order guard or refund deduplication would change the stored ledger.
  const f = await fixture();
  try {
    await recordOrderPayment(f.order.id, f.actor, payment("1000"));
    expect((await getOrderPaymentSummary(f.order.id)).status).toBe("PAID");
    await f.db.update(orders).set({ status: "CANCELLED" }).where(eq(orders.id, f.order.id));
    const refund = { ...payment("1000"), kind: "REFUND" as const };
    await recordOrderPayment(f.order.id, f.actor, refund);
    const before = await f.snapshot();
    expect(before.summary).toEqual({
      status: "REFUNDED",
      paidDirams: "0",
      totalDirams: "1000",
      balanceDirams: "1000",
    });
    expect(await recordOrderPayment(f.order.id, f.actor, refund)).toEqual(before.summary);
    await expect(recordOrderPayment(f.order.id, f.actor, payment("1"))).rejects.toMatchObject({
      status: 409,
      code: "invalid_payment",
    });
    await expect(
      recordOrderPayment(f.order.id, f.actor, { ...payment("1"), kind: "REFUND" }),
    ).rejects.toMatchObject({ status: 409, code: "invalid_refund" });
    expect(await f.snapshot()).toEqual(before);
  } finally {
    await f.clean();
  }
});
