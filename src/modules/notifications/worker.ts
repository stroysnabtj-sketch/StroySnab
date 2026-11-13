import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import type { AppDatabase, DbExecutor } from "@/db";
import { orders } from "@/db/schema";
import { guestOrderLink } from "@/modules/orders/guest-link";
import {
  notificationAttempts,
  notificationDispatchBudget,
  notificationOutbox,
} from "@/db/schema/notifications";
import type { SmsTransport } from "./transport";
import { notificationStatusLabel } from "./events";

type DispatchOptions = {
  batchSize?: number;
  dailyLimit?: number;
  now?: Date;
  onlyIds?: string[];
  channel?: "sms" | "email";
  createdSince?: Date;
};

export async function dispatchNotifications(
  db: AppDatabase,
  transport: SmsTransport | null,
  options: DispatchOptions = {},
) {
  if (!transport) return { connected: false, processed: 0 };
  const batchSize = Math.max(1, Math.min(100, options.batchSize ?? 20));
  const dailyLimit = Math.max(0, Math.min(10000, options.dailyLimit ?? 100));
  const channel = options.channel ?? "sms";
  let processed = 0;
  for (let n = 0; n < batchSize; n++) {
    const now = options.now ?? new Date();
    const claim = await db.transaction(async (tx) => {
      const due = and(
        eq(notificationOutbox.channel, channel),
        transport.supportedEvents
          ? inArray(notificationOutbox.event, transport.supportedEvents)
          : undefined,
        ne(notificationOutbox.audience, "shop"),
        options.createdSince ? gte(notificationOutbox.createdAt, options.createdSince) : undefined,
        eq(notificationOutbox.state, "queued"),
        lte(notificationOutbox.availableAt, now),
        or(isNull(notificationOutbox.leaseUntil), lte(notificationOutbox.leaseUntil, now)),
        options.onlyIds ? inArray(notificationOutbox.id, options.onlyIds) : undefined,
      );
      // A crashed final attempt must not leave an unclaimable row queued forever.
      const exhausted = await tx
        .update(notificationOutbox)
        .set({
          state: "failed",
          leaseUntil: null,
          claimToken: null,
          lastError: "attempt_limit_reached",
        })
        .where(
          and(due, sql`${notificationOutbox.attemptCount} >= ${notificationOutbox.maxAttempts}`),
        )
        .returning({ id: notificationOutbox.id });
      if (exhausted.length)
        await tx
          .update(notificationAttempts)
          .set({ state: "failed", error: "lease_expired", finishedAt: now })
          .where(
            and(
              inArray(
                notificationAttempts.notificationId,
                exhausted.map((row) => row.id),
              ),
              eq(notificationAttempts.state, "sending"),
            ),
          );
      const [row] = await tx
        .select()
        .from(notificationOutbox)
        .where(and(due, lt(notificationOutbox.attemptCount, notificationOutbox.maxAttempts)))
        .orderBy(notificationOutbox.availableAt, notificationOutbox.id)
        .limit(1)
        .for("update", { skipLocked: true });
      if (!row) return null;
      const day = now.toISOString().slice(0, 10);
      await tx
        .insert(notificationDispatchBudget)
        .values({ id: channel, day, used: 0 })
        .onConflictDoNothing();
      const [budget] = await tx
        .select()
        .from(notificationDispatchBudget)
        .where(eq(notificationDispatchBudget.id, channel))
        .for("update");
      const used = budget.day === day ? budget.used : 0;
      if (used >= dailyLimit) return null;
      await tx
        .update(notificationDispatchBudget)
        .set({ day, used: used + 1 })
        .where(eq(notificationDispatchBudget.id, channel));
      const claimToken = randomUUID();
      const [claimed] = await tx
        .update(notificationOutbox)
        .set({
          claimToken,
          leaseUntil: new Date(now.getTime() + 60000),
          attemptCount: row.attemptCount + 1,
          ...(transport.retrySafe === false ? { maxAttempts: row.attemptCount + 1 } : {}),
        })
        .where(eq(notificationOutbox.id, row.id))
        .returning();
      // An expired lease is indeterminate. Retries use the same provider idempotency key.
      await tx
        .update(notificationAttempts)
        .set({ state: "failed", error: "lease_expired", finishedAt: now })
        .where(
          and(
            eq(notificationAttempts.notificationId, row.id),
            eq(notificationAttempts.state, "sending"),
          ),
        );
      await tx
        .insert(notificationAttempts)
        .values({ notificationId: row.id, claimToken, state: "sending", createdAt: now });
      return claimed;
    });
    if (!claim) break;
    let providerMessageId: string | undefined;
    try {
      let body = claim.body;
      const [order] = /^(ORDER_|PAYMENT_CONFIRMED$)/.test(claim.event)
        ? await db
            .select({
              accessHash: orders.guestAccessTokenHash,
              customerId: orders.customerId,
              orderNumber: orders.orderNumber,
              vehicleType: orders.vehicleType,
            })
            .from(orders)
            .where(eq(orders.id, claim.entityId))
        : [];
      if (claim.audience === "customer" && /^(ORDER_|PAYMENT_CONFIRMED$)/.test(claim.event)) {
        if (order?.accessHash && !order.customerId) {
          const link = guestOrderLink(claim.entityId, order.accessHash, claim.createdAt);
          if (!link) throw new Error("guest_link_unavailable");
          body += ` ${link}`;
        }
      }
      const result = await transport.send({
        recipient: claim.recipient,
        body,
        idempotencyKey: claim.eventKey,
        event: claim.event,
        audience: claim.audience,
        orderNumber: order?.orderNumber,
        statusLabel: notificationStatusLabel(claim.event, order?.vehicleType === "PICKUP"),
      });
      if (!result.providerMessageId) throw new Error("provider_send_failed");
      providerMessageId = result.providerMessageId;
    } catch {
      /* Only a fixed code is logged; gateway errors can contain credentials or personal data. */
    }
    await db.transaction(async (tx) => {
      const completedAt = options.now ?? new Date();
      const success = !!providerMessageId;
      const [updated] = await tx
        .update(notificationOutbox)
        .set({
          state: success
            ? "accepted"
            : claim.attemptCount >= claim.maxAttempts
              ? "failed"
              : "queued",
          providerMessageId: providerMessageId ?? null,
          acceptedAt: success ? completedAt : null,
          lastError: success ? null : "provider_send_failed",
          claimToken: null,
          leaseUntil: null,
          availableAt: new Date(
            completedAt.getTime() + Math.min(3600000, 30000 * 2 ** (claim.attemptCount - 1)),
          ),
        })
        .where(
          and(
            eq(notificationOutbox.id, claim.id),
            eq(notificationOutbox.claimToken, claim.claimToken!),
          ),
        )
        .returning({ id: notificationOutbox.id });
      if (updated)
        await tx
          .update(notificationAttempts)
          .set({
            state: success ? "accepted" : "failed",
            error: success ? null : "provider_send_failed",
            finishedAt: completedAt,
          })
          .where(eq(notificationAttempts.claimToken, claim.claimToken!));
    });
    processed++;
  }
  return { connected: true, processed };
}

/** Explicit staff retry preserves history and provider idempotency, respecting the daily cap. */
export async function retryNotification(db: DbExecutor, id: string) {
  const [row] = await db
    .update(notificationOutbox)
    .set({
      state: "queued",
      attemptCount: 0,
      lastError: null,
      availableAt: new Date(),
      leaseUntil: null,
      claimToken: null,
    })
    .where(and(eq(notificationOutbox.id, id), eq(notificationOutbox.state, "failed")))
    .returning({ id: notificationOutbox.id });
  return row ?? null;
}
