import { createHash } from "node:crypto";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DbTransaction } from "@/db";
import { orderItems, orders, suppliers, supplierOffers, supplierUsers, users } from "@/db/schema";
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
const shopLabels: Record<string, string> = {
  NEW: "новый",
  CONFIRMED: "подтверждён",
  ACCEPTED: "принят магазином",
  HANDED_OVER: "передан",
  READY: "готов к выдаче",
  DISPATCHED: "отправлен",
  DELIVERED: "доставлен",
  CANCELLED: "отменён",
};

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
    if (!process.env.APP_URL) return "";
    const base = new URL(process.env.APP_URL);
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
    recipient: string;
    audience: "customer" | "shop";
    supplierId?: string;
    body: string;
  },
) {
  const recipient = phone(input.recipient);
  if (!recipient) return;
  // Dedupe by event/version/number, including when a person is also a shop contact.
  const eventKey = createHash("sha256")
    .update(JSON.stringify([input.entityId, input.event, input.version, recipient, "sms"]))
    .digest("hex");
  await tx
    .insert(notificationOutbox)
    .values({ ...input, recipient, eventKey })
    .onConflictDoNothing({ target: notificationOutbox.eventKey });
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
  if (input.event !== "SHOP_STATUS_CHANGED")
    await enqueue(tx, {
      entityId: order.id,
      event: input.event,
      version: input.version,
      recipient: order.customerPhone,
      audience: "customer",
      body: body + (order.customerId ? secureLink(`/orders/${order.id}`) : ""),
    });
  // Payment information is customer-only. Shops receive no totals, item lists or customer credentials.
  if (input.event === "PAYMENT_CONFIRMED") return;
  if (input.event === "SHOP_STATUS_CHANGED" && !input.supplierId)
    throw new Error("Shop event requires supplierId");
  const supplierId = sql<
    string | null
  >`coalesce(${orderItems.supplierId}, ${supplierOffers.supplierId})`;
  const lines = await tx
    .selectDistinct({ supplierId })
    .from(orderItems)
    .leftJoin(supplierOffers, eq(orderItems.offerId, supplierOffers.id))
    .where(
      and(
        eq(orderItems.orderId, order.id),
        input.supplierId ? eq(supplierId, input.supplierId) : undefined,
      ),
    );
  const ids = lines.flatMap((line) => (line.supplierId ? [line.supplierId] : []));
  if (!ids.length) return;
  const contacts = await tx
    .select({ supplierId: suppliers.id, phone: suppliers.phone })
    .from(suppliers)
    .where(inArray(suppliers.id, ids));
  const team = await tx
    .select({ supplierId: supplierUsers.supplierId, phone: users.phone })
    .from(supplierUsers)
    .innerJoin(users, eq(users.id, supplierUsers.userId))
    .where(
      and(
        inArray(supplierUsers.supplierId, ids),
        eq(users.status, "ACTIVE"),
        isNull(users.deletedAt),
        eq(supplierUsers.role, "OWNER"),
      ),
    );
  for (const contact of [...contacts, ...team])
    await enqueue(tx, {
      entityId: order.id,
      event: input.event,
      version: input.version,
      recipient: contact.phone,
      audience: "shop",
      supplierId: contact.supplierId,
      body:
        input.event === "SHOP_STATUS_CHANGED"
          ? `Заказ ${safeLabel(order.orderNumber)}: ваша часть — ${shopLabels[input.shopStatus ?? ""] ?? "статус изменён"}.`
          : body + secureLink(`/seller/orders/${order.id}`),
    });
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
    body: `КП ${safeLabel(input.quoteNumber)} готово. Откройте вашу заявку для просмотра.${input.customerUserId ? secureLink(`/requests/${input.requestId}`) : ""}`,
  });
}
