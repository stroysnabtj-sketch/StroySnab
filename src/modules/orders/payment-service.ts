import { enqueueOrderNotifications } from "@/modules/notifications/events";
import { and, eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, type DbExecutor } from "@/db";
import { orderPayments, orders } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { ApiError } from "@/server/api-error";
import { writeAudit } from "@/modules/audit/service";
export const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Не оплачен",
  PARTIAL: "Частично оплачен",
  PAID: "Оплачен",
  REFUNDED: "Возвращено",
};
export async function getOrderPaymentSummary(orderId: string, executor?: DbExecutor) {
  const db = executor ?? (await getDb());
  const [order] = await db
    .select({ total: orders.totalDirams })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) throw new ApiError(404, "not_found", "Заказ не найден");
  const rows = await db.select().from(orderPayments).where(eq(orderPayments.orderId, orderId));
  let paid = 0n,
    refund = 0n;
  for (const row of rows) {
    if (row.kind === "PAYMENT") paid += BigInt(row.amountDirams);
    else refund += BigInt(row.amountDirams);
  }
  const net = paid - refund,
    total = BigInt(order.total);
  return {
    status: net === 0n ? (refund > 0n ? "REFUNDED" : "UNPAID") : net >= total ? "PAID" : "PARTIAL",
    paidDirams: net.toString(),
    totalDirams: total.toString(),
    balanceDirams: (total - net).toString(),
  };
}
const paymentInput = z.object({
  kind: z.enum(["PAYMENT", "REFUND"]),
  amountDirams: z.string().regex(/^[1-9]\d{0,14}$/),
  reason: z.string().trim().min(3).max(1000),
  reference: z.string().trim().max(200).optional(),
  method: z.enum(["BANK_TRANSFER", "CASH", "OTHER"]).default("BANK_TRANSFER"),
  idempotencyKey: z.string().uuid(),
});
export async function recordOrderPayment(orderId: string, actor: SessionUser, input: unknown) {
  if (!hasPermission(actor.role, "orders:manage"))
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  const data = paymentInput.parse(input);
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM orders WHERE id=${orderId}::uuid FOR UPDATE`);
    const [old] = await tx
      .select()
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.orderId, orderId),
          eq(orderPayments.idempotencyKey, data.idempotencyKey),
        ),
      );
    if (old) {
      if (
        old.kind !== data.kind ||
        old.amountDirams !== data.amountDirams ||
        old.reason !== data.reason ||
        old.method !== data.method ||
        (old.reference ?? null) !== (data.reference ?? null)
      )
        throw new ApiError(409, "idempotency_conflict", "Ключ уже использован для другого платежа");
      return getOrderPaymentSummary(orderId, tx);
    }
    const summary = await getOrderPaymentSummary(orderId, tx);
    const amount = BigInt(data.amountDirams);
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (
      data.kind === "PAYMENT" &&
      (order.status === "CANCELLED" || amount > BigInt(summary.balanceDirams))
    )
      throw new ApiError(409, "invalid_payment", "Сумма превышает остаток или заказ отменён");
    if (data.kind === "REFUND" && amount > BigInt(summary.paidDirams))
      throw new ApiError(409, "invalid_refund", "Возврат превышает полученную сумму");
    const [recorded] = await tx
      .insert(orderPayments)
      .values({ ...data, orderId, actorId: actor.id })
      .returning({ id: orderPayments.id });
    if (data.kind === "PAYMENT")
      await enqueueOrderNotifications(tx, {
        orderId,
        event: "PAYMENT_CONFIRMED",
        version: recorded.id,
      });
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "orders.payment.recorded",
      entity: "orders",
      entityId: orderId,
      data: { kind: data.kind, amountDirams: data.amountDirams, reason: data.reason },
    });
    return getOrderPaymentSummary(orderId, tx);
  });
}
export async function listOrderPayments(orderId: string) {
  const db = await getDb();
  return db
    .select({
      id: orderPayments.id,
      kind: orderPayments.kind,
      amountDirams: orderPayments.amountDirams,
      reason: orderPayments.reason,
      reference: orderPayments.reference,
      method: orderPayments.method,
      createdAt: orderPayments.createdAt,
    })
    .from(orderPayments)
    .where(eq(orderPayments.orderId, orderId))
    .orderBy(desc(orderPayments.createdAt));
}
