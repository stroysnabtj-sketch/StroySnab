import { publicSiteOrigin } from "@/modules/system/site-url";
import { sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { DbTransaction } from "@/db";
import { orders, users } from "@/db/schema";
import { notificationOutbox } from "@/db/schema/notifications";

export type OrderNotificationEvent =
  | "ORDER_CREATED"
  | "ORDER_CONFIRMED"
  | "ORDER_DISPATCHED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "PAYMENT_CONFIRMED"
  | "SHOP_STATUS_CHANGED";
const labels: Record<OrderNotificationEvent, string> = {
  ORDER_CREATED: "принят",
  ORDER_CONFIRMED: "подтверждён",
  ORDER_DISPATCHED: "отправлен",
  ORDER_DELIVERED: "доставлен",
  ORDER_CANCELLED: "отменён",
  PAYMENT_CONFIRMED: "платёж получен",
  SHOP_STATUS_CHANGED: "статус вашей части заказа изменён",
};
export function notificationStatusLabel(event: string, pickup: boolean) {
  if (pickup && event === "ORDER_DISPATCHED") return "готов к выдаче";
  if (pickup && event === "ORDER_DELIVERED") return "выдан";
  return labels[event as OrderNotificationEvent];
}

function phone(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  const normalized = digits.length === 9 ? `992${digits}` : digits;
  return /^992\d{9}$/.test(normalized) ? `+${normalized}` : null;
}

function safeLabel(value: string) {
  return value.replace(/[\r\n\x00-\x1f]/g, " ").slice(0, 64);
}

function secureLink(path: string) {
  try {
    const base = new URL(publicSiteOrigin());
    if (base.protocol !== "https:" || base.username || base.password) return "";
    return ` ${new URL(path, base.origin).href}`;
  } catch {
    return "";
  }
}

async function enqueue(
  tx: DbTransaction,
  input: {
    entityId: string;
    event: string;
    version: string;
    recipient: string | null;
    audience: "customer" | "admin";
    supplierId?: string;
    body: string;
    channel?: "sms" | "email";
  },
) {
  if (!input.recipient) return;
  const channel = input.channel ?? "sms";
  const recipient =
    channel === "sms" ? phone(input.recipient) : input.recipient.trim().toLowerCase();
  if (!recipient) return;
  // Dedupe by event/version/number, including when a person is also a shop contact.
  const eventKey = createHash("sha256")
    .update(JSON.stringify([input.entityId, input.event, input.version, recipient, channel]))
    .digest("hex");
  await tx
    .insert(notificationOutbox)
    .values({ ...input, recipient, eventKey, channel })
    .onConflictDoNothing({ target: notificationOutbox.eventKey });
  await tx.execute(sql`select pg_notify('stroysnab_notifications', '')`);
}

/** Must run inside the transaction which writes the order/payment/status change. */
export async function enqueueOrderNotifications(
  tx: DbTransaction,
  input: {
    orderId: string;
    event: OrderNotificationEvent;
    version: string;
    supplierId?: string;
    shopStatus?: string;
  },
) {
  const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId));
  if (!order) throw new Error("Notification order not found");
  const statusLabel =
    order.vehicleType === "PICKUP" && input.event === "ORDER_DISPATCHED"
      ? "готов к выдаче"
      : order.vehicleType === "PICKUP" && input.event === "ORDER_DELIVERED"
        ? "выдан"
        : labels[input.event];
  const body = `Заказ ${safeLabel(order.orderNumber)}: ${statusLabel}.`;
  if (input.event !== "SHOP_STATUS_CHANGED") {
    const message = {
      entityId: order.id,
      event: input.event,
      version: input.version,
      audience: "customer" as const,
      body,
    };
    await enqueue(tx, { ...message, recipient: order.customerPhone });
    if (order.customerEmail)
      await enqueue(tx, {
        ...message,
        body: body + (order.customerId ? secureLink(`/orders/${order.id}`) : ""),
        recipient: order.customerEmail,
        channel: "email",
      });
  }
  if (input.event !== "ORDER_CREATED") return;
  const admins = await tx
    .select({ phone: users.phone, email: users.email })
    .from(users)
    .where(
      and(
        inArray(users.role, ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER"]),
        eq(users.status, "ACTIVE"),
        isNull(users.deletedAt),
      ),
    );
  for (const admin of admins) {
    const message = {
      entityId: order.id,
      event: input.event,
      version: input.version,
      audience: "admin" as const,
      body: `Получен новый заказ №${safeLabel(order.orderNumber)}.`,
    };
    await enqueue(tx, { ...message, recipient: admin.phone });
    await enqueue(tx, {
      ...message,
      body: message.body + secureLink(`/admin/orders/${order.id}`),
      recipient: admin.email,
      channel: "email",
    });
  }
}

/** Call only when a version is published, using the request's stored contact. */
export async function enqueueQuoteReadyNotification(
  tx: DbTransaction,
  input: {
    requestId: string;
    quoteId: string;
    quoteNumber: string;
    version: string;
    customerPhone: string;
    customerUserId?: string | null;
  },
) {
  await enqueue(tx, {
    entityId: input.requestId,
    event: "QUOTE_READY",
    version: `${input.quoteId}:${input.version}`,
    recipient: input.customerPhone,
    audience: "customer",
    body: `КП ${safeLabel(input.quoteNumber)} готово.`,
  });
}
