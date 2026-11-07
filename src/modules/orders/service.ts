import { enqueueOrderNotifications } from "@/modules/notifications/events";
import { visibleCategoryIds } from "@/modules/catalog/category-visibility";
import { VEHICLE_CODES, validDeliveryDate, knownCartWeight } from "@/modules/delivery/preferences";
import { writeAudit } from "@/modules/audit/service";
import { ORDER_STATUS_TRANSITIONS } from "./status";
import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type DbExecutor } from "@/db";
import {
  auditLog,
  carts,
  cartItems,
  customers,
  orders,
  orderItems,
  procurementRequests,
  products,
  supplierOffers,
  suppliers,
} from "@/db/schema";
import { calculateOrderMarkup, lineBase, quantityMillis } from "@/modules/pricing/order-markup";
import { ApiError } from "@/server/api-error";
import { nextDocNumber } from "@/modules/system/doc-number";
import { normalizePhone } from "@/modules/system/phone";
import { hasPermission, type Role } from "@/modules/rbac/permissions";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const orderInputSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    expectedTotalDirams: z.string().regex(/^\d+$/).optional(),
    customerName: z.string().trim().min(2).max(120),
    customerPhone: z.string().regex(/^\+?[\d ()-]{9,24}$/),
    deliveryCity: z.string().trim().min(2).max(100),
    deliveryAddress: z.string().trim().max(500).default(""),
    deliveryNotes: z.string().trim().max(1000).optional(),
    deliveryLat: z.number().finite().min(-90).max(90).optional(),
    deliveryLng: z.number().finite().min(-180).max(180).optional(),
    fulfillment: z.enum(["DELIVERY", "PICKUP"]),
    vehicleType: z.enum(VEHICLE_CODES).optional(),
    unloadingType: z.enum(["SELF", "LOADERS", "CRANE_BOOM", "DUMP"]).optional(),
    preferredDeliveryDate: z.string().optional(),
    preferredTimeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
    cargoWeightKg: z.number().positive().max(1000000).optional(),
    cargoVolumeM3: z.number().positive().max(10000).optional(),
    paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_INVOICE"]),
  })
  .superRefine((v, c) => {
    if ((v.deliveryLat === undefined) !== (v.deliveryLng === undefined))
      c.addIssue({ code: "custom", path: ["deliveryLat"], message: "Укажите обе координаты" });
    if (v.preferredDeliveryDate && !validDeliveryDate(v.preferredDeliveryDate))
      c.addIssue({
        code: "custom",
        path: ["preferredDeliveryDate"],
        message: "Выберите сегодняшнюю или будущую дату доставки",
      });
    if (v.preferredTimeSlot && !v.preferredDeliveryDate)
      c.addIssue({
        code: "custom",
        path: ["preferredDeliveryDate"],
        message: "Укажите дату доставки",
      });
    if (v.fulfillment === "DELIVERY" && v.deliveryAddress.length < 5)
      c.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Укажите адрес доставки" });
  });
type Identity = { userId?: string; guestToken?: string };
type OrderInput = z.infer<typeof orderInputSchema> & Identity;
async function identity(db: DbExecutor, input: Identity) {
  const [customer] = input.userId
    ? await db.select().from(customers).where(eq(customers.userId, input.userId)).limit(1)
    : [];
  if (input.userId && !customer)
    throw new ApiError(403, "customer_required", "Оформление доступно покупателю");
  const tokenHash = !customer && input.guestToken ? hash(input.guestToken) : null;
  const condition = customer
    ? eq(carts.customerId, customer.id)
    : tokenHash
      ? eq(carts.sessionTokenHash, tokenHash)
      : null;
  const [cart] = condition ? await db.select().from(carts).where(condition).limit(1) : [];
  return { customerId: customer?.id ?? null, tokenHash, cart };
}
async function quote(db: DbExecutor, cartId: string) {
  const rows = await db
    .select({
      item: cartItems,
      offer: supplierOffers,
      product: products,
      supplier: suppliers,
      categoryVisible: sql<boolean>`${products.categoryId} in (${visibleCategoryIds})`,
    })
    .from(cartItems)
    .innerJoin(supplierOffers, eq(cartItems.offerId, supplierOffers.id))
    .innerJoin(products, eq(supplierOffers.productId, products.id))
    .innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
    .where(eq(cartItems.cartId, cartId));
  if (!rows.length) throw new ApiError(400, "empty_cart", "Корзина пуста");
  const items = rows.map(({ item, offer, product, supplier, categoryVisible }) => {
    if (
      !categoryVisible ||
      offer.isActive !== "true" ||
      product.status !== "PUBLISHED" ||
      supplier.status !== "ACTIVE"
    )
      throw new ApiError(409, "unavailable", "Материал больше недоступен");
    const qty = quantityMillis(item.qty);
    if (
      qty < quantityMillis(offer.minOrderQty) ||
      qty > decimalMillis(offer.stockQty) - decimalMillis(offer.reservedQty)
    )
      throw new ApiError(409, "out_of_stock", "Количество превышает доступный остаток");
    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierPriceDirams: offer.supplierPriceDirams.toString(),
      supplierSubtotalDirams: lineBase(offer.supplierPriceDirams, item.qty).toString(),
      offerId: offer.id,
      productId: product.id,
      productName: product.nameRu,
      sku: product.sku,
      unit: product.unit,
      qty: item.qty,
      priceDirams: offer.supplierPriceDirams.toString(),
      subtotalDirams: lineBase(offer.supplierPriceDirams, item.qty).toString(),
    };
  });
  const pricing = calculateOrderMarkup(
    items.reduce((sum, item) => sum + BigInt(item.subtotalDirams), 0n),
  );
  let allocated = 0n;
  for (const [index, item] of items.entries()) {
    const base = BigInt(item.subtotalDirams);
    const markup =
      index === items.length - 1
        ? pricing.markupDirams - allocated
        : (base * BigInt(pricing.percent)) / 100n;
    allocated += markup;
    item.subtotalDirams = (base + markup).toString();
    const unitPrice = BigInt(item.priceDirams);
    item.priceDirams = (unitPrice + (unitPrice * BigInt(pricing.percent)) / 100n).toString();
  }
  // The store has not provided a verified delivery tariff. Never add a guessed
  // vehicle rate to the customer's checkout total.
  const delivery = 0n;
  return {
    items,
    baseDirams: pricing.baseDirams.toString(),
    markupPercent: pricing.percent,
    markupDirams: pricing.markupDirams.toString(),
    materialsTotalDirams: pricing.totalDirams.toString(),
    deliveryTotalDirams: delivery.toString(),
    totalDirams: (pricing.totalDirams + delivery).toString(),
  };
}
function decimalMillis(value: string) {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value))
    throw new ApiError(409, "invalid_stock", "Остаток требует проверки");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
}
export async function quoteOrder(input: Identity & { fulfillment: "DELIVERY" | "PICKUP" }) {
  const db = await getDb();
  const who = await identity(db, input);
  if (!who.cart) throw new ApiError(400, "empty_cart", "Корзина пуста");
  return quote(db, who.cart.id);
}
export async function createOrder(input: OrderInput) {
  const body = orderInputSchema.parse(input);
  const phone = normalizePhone(body.customerPhone, "customerPhone");
  const db = await getDb();
  return db.transaction(async (tx) => {
    const who = await identity(tx, input);
    if (!who.cart) throw new ApiError(400, "empty_cart", "Корзина пуста");
    await tx.execute(sql`SELECT id FROM carts WHERE id=${who.cart.id} FOR UPDATE`);
    const key = hash(`${who.customerId ?? who.tokenHash}:${body.idempotencyKey}`);
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, key))
      .limit(1);
    if (existing)
      return { id: existing.id, orderNumber: existing.orderNumber, status: existing.status };
    const calculated = await quote(tx, who.cart.id);
    const knownWeight = knownCartWeight(calculated.items);
    if (
      knownWeight !== null &&
      body.cargoWeightKg !== undefined &&
      body.cargoWeightKg + 0.001 < knownWeight
    )
      throw new ApiError(
        400,
        "invalid_cargo_weight",
        "Вес не может быть меньше массы товаров в заказе",
        { cargoWeightKg: `Не менее ${knownWeight} кг` },
      );
    if (body.expectedTotalDirams && body.expectedTotalDirams !== calculated.totalDirams)
      throw new ApiError(
        409,
        "quote_changed",
        "Стоимость изменилась. Обновите расчёт и проверьте сумму заказа.",
      );
    for (const item of [...calculated.items].sort((a, b) => a.offerId.localeCompare(b.offerId))) {
      const reserved = await tx
        .update(supplierOffers)
        .set({
          reservedQty: sql`(${supplierOffers.reservedQty}::numeric + ${item.qty}::numeric)::text`,
        })
        .where(
          and(
            eq(supplierOffers.id, item.offerId),
            eq(supplierOffers.isActive, "true"),
            sql`${supplierOffers.stockQty}::numeric - ${supplierOffers.reservedQty}::numeric >= ${item.qty}::numeric`,
          ),
        )
        .returning({ id: supplierOffers.id });
      if (!reserved.length)
        throw new ApiError(409, "out_of_stock", "Материал уже зарезервирован другим покупателем");
    }
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: await nextDocNumber(tx, "ORD"),
        customerId: who.customerId,
        guestAccessTokenHash: who.tokenHash,
        idempotencyKey: key,
        customerName: body.customerName,
        customerPhone: phone,
        deliveryCity: body.deliveryCity,
        deliveryAddress:
          body.fulfillment === "PICKUP"
            ? "Самовывоз: место выдачи согласуется с магазином"
            : body.deliveryAddress,
        deliveryNotes: body.deliveryNotes,
        deliveryLat:
          body.fulfillment === "DELIVERY" && body.deliveryLat !== undefined
            ? String(body.deliveryLat)
            : null,
        deliveryLng:
          body.fulfillment === "DELIVERY" && body.deliveryLng !== undefined
            ? String(body.deliveryLng)
            : null,
        vehicleType: body.fulfillment === "PICKUP" ? "PICKUP" : (body.vehicleType ?? "UNASSIGNED"),
        unloadingType:
          body.fulfillment === "PICKUP" ? "SELF_PICKUP" : (body.unloadingType ?? "SELF"),
        preferredDeliveryDate:
          body.fulfillment === "DELIVERY" ? (body.preferredDeliveryDate ?? null) : null,
        preferredTimeSlot:
          body.fulfillment === "DELIVERY" ? (body.preferredTimeSlot ?? null) : null,
        paymentMethod: body.paymentMethod,
        status: "NEW",
        goodsBaseDirams: calculated.baseDirams,
        markupPercent: calculated.markupPercent,
        markupDirams: calculated.markupDirams,
        materialsTotalDirams: calculated.materialsTotalDirams,
        deliveryTotalDirams: calculated.deliveryTotalDirams,
        totalDirams: calculated.totalDirams,
        driverName: null,
        driverPhone: null,
        vehiclePlate: null,
        estimatedWeightKg:
          body.cargoWeightKg !== undefined
            ? String(body.cargoWeightKg)
            : knownWeight !== null
              ? String(knownWeight)
              : null,
        estimatedVolumeM3: body.cargoVolumeM3 !== undefined ? String(body.cargoVolumeM3) : null,
      })
      .returning();
    await tx
      .insert(orderItems)
      .values(calculated.items.map((item) => ({ ...item, orderId: order.id })));
    await enqueueOrderNotifications(tx, {
      orderId: order.id,
      event: "ORDER_CREATED",
      version: order.id,
    });
    await tx.delete(cartItems).where(eq(cartItems.cartId, who.cart.id));
    await writeAudit(tx, {
      actorUserId: input.userId ?? null,
      action: "orders.created",
      entity: "orders",
      entityId: order.id,
      data: { status: "NEW", orderNumber: order.orderNumber },
    });
    return { id: order.id, orderNumber: order.orderNumber, status: order.status };
  });
}

export type OrderHistoryItem = {
  id: string;
  status: string;
  title: string;
  description: string;
  timestamp: Date;
};

export type OrderItemWithSupplier = typeof orderItems.$inferSelect & {
  supplierName: string | null;
};

export type FullOrder = typeof orders.$inferSelect & {
  items: OrderItemWithSupplier[];
  history: OrderHistoryItem[];
};

async function loadOrderDetails(
  db: DbExecutor,
  order: typeof orders.$inferSelect,
): Promise<FullOrder> {
  const items = await db
    .select({
      id: orderItems.id,
      imageIds: orderItems.imageIds,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      offerId: orderItems.offerId,
      productName: orderItems.productName,
      sku: orderItems.sku,
      unit: orderItems.unit,
      qty: orderItems.qty,
      priceDirams: orderItems.priceDirams,
      subtotalDirams: orderItems.subtotalDirams,
      supplierId: orderItems.supplierId,
      supplierName: sql<string | null>`coalesce(${orderItems.supplierName},${suppliers.name})`,
      supplierPriceDirams: orderItems.supplierPriceDirams,
      supplierSubtotalDirams: orderItems.supplierSubtotalDirams,
      shopStatus: orderItems.shopStatus,
      shopUpdatedAt: orderItems.shopUpdatedAt,
    })
    .from(orderItems)
    .leftJoin(supplierOffers, eq(orderItems.offerId, supplierOffers.id))
    .leftJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
    .where(eq(orderItems.orderId, order.id));

  const auditRows = await db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.entity, "orders"), eq(auditLog.entityId, order.id)))
    .orderBy(auditLog.createdAt);

  const history: OrderHistoryItem[] = [
    {
      id: "created",
      status: "NEW",
      title: "Заказ оформлен",
      description: "Заказ принят системой и направлен на подтверждение магазином",
      timestamp: order.createdAt,
    },
  ];

  for (const row of auditRows) {
    if (row.action === "orders.status.changed" && row.data && typeof row.data === "object") {
      const after = (row.data as { after?: string }).after;
      if (after) {
        const isPickup = order.vehicleType === "PICKUP";
        const titleMap: Record<string, string> = {
          CONFIRMED: "Заказ подтверждён",
          DISPATCHED: isPickup ? "Заказ готов к выдаче" : "Заказ передан в доставку",
          DELIVERED: isPickup ? "Заказ получен покупателем" : "Заказ доставлен",
          CANCELLED: "Заказ отменён",
        };
        const descMap: Record<string, string> = {
          CONFIRMED: "Наличие материалов подтверждено, заказ комплектуется на складе",
          DISPATCHED: isPickup
            ? "Материалы скомплектованы в пункте выдачи"
            : "Машина загружена, материалы отправлены по адресу доставки",
          DELIVERED: isPickup
            ? "Материалы выданы покупателю"
            : "Материалы успешно доставлены и переданы получателю",
          CANCELLED: "Резерв товаров возвращён в каталог",
        };
        history.push({
          id: row.id,
          status: after,
          title: titleMap[after] ?? `Статус: ${after}`,
          description: descMap[after] ?? "",
          timestamp: row.createdAt,
        });
      }
    }
  }

  return { ...order, items, history };
}

export async function getOrder(id: string, input: Identity): Promise<FullOrder | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [customer] = input.userId
    ? await db.select().from(customers).where(eq(customers.userId, input.userId)).limit(1)
    : [];
  const owns = order.customerId
    ? customer?.id === order.customerId
    : !!input.guestToken && order.guestAccessTokenHash === hash(input.guestToken);
  if (!owns) return null;
  return loadOrderDetails(db, order);
}

/** The actor must come from the authenticated server session, never request JSON. */
export async function getManagedOrder(
  actor: { id: string; role: Role },
  id: string,
): Promise<FullOrder | null> {
  if (!hasPermission(actor.role, "orders:read"))
    throw new ApiError(403, "forbidden", "Нет доступа к заказу");
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return order ? loadOrderDetails(db, order) : null;
}

export async function changeOrderStatus(
  actor: { id: string; role: Role },
  id: string,
  input: unknown,
) {
  if (!hasPermission(actor.role, "orders:manage"))
    throw new ApiError(403, "forbidden", "Нет права изменять заказ");
  if (!z.string().uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заказ не найден");
  const body = z
    .object({
      status: z.enum(["CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"]),
      expectedStatus: z.string(),
    })
    .parse(input);
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1).for("update");
    if (!before) throw new ApiError(404, "not_found", "Заказ не найден");
    if (before.status === body.status) return { id, status: before.status };
    if (body.status === "CANCELLED") {
      const [handed] = await tx
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(and(eq(orderItems.orderId, id), eq(orderItems.shopStatus, "HANDED_OVER")))
        .limit(1);
      if (handed)
        throw new ApiError(
          409,
          "goods_already_handed_over",
          "Нельзя отменить заказ: магазин уже передал товары. Сначала согласуйте возврат",
        );
    }
    if (
      before.status !== body.expectedStatus ||
      !ORDER_STATUS_TRANSITIONS[before.status]?.includes(body.status)
    )
      throw new ApiError(
        409,
        "status_conflict",
        "Статус заказа изменился или переход недоступен. Обновите страницу.",
      );
    const changed = await tx
      .update(orders)
      .set({ status: body.status, updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, body.expectedStatus)))
      .returning({ id: orders.id, updatedAt: orders.updatedAt });
    if (!changed.length)
      throw new ApiError(409, "status_conflict", "Заказ уже изменён другим сотрудником");
    if (body.status === "CANCELLED" || body.status === "DELIVERED") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      const quantities = new Map<string, bigint>();
      for (const item of items)
        if (item.offerId)
          quantities.set(
            item.offerId,
            (quantities.get(item.offerId) ?? 0n) + quantityMillis(item.qty),
          );
      for (const [offerId, millis] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
        const qty = `${millis / 1000n}.${(millis % 1000n).toString().padStart(3, "0")}`;
        const result = await tx
          .update(supplierOffers)
          .set({
            reservedQty: sql`(${supplierOffers.reservedQty}::numeric - ${qty}::numeric)::text`,
            ...(body.status === "DELIVERED"
              ? { stockQty: sql`(${supplierOffers.stockQty}::numeric - ${qty}::numeric)::text` }
              : {}),
          })
          .where(
            and(
              eq(supplierOffers.id, offerId),
              sql`${supplierOffers.reservedQty}::numeric >= ${qty}::numeric`,
              ...(body.status === "DELIVERED"
                ? [sql`${supplierOffers.stockQty}::numeric >= ${qty}::numeric`]
                : []),
            ),
          )
          .returning({ id: supplierOffers.id });
        if (!result.length)
          throw new ApiError(
            409,
            "reservation_conflict",
            "Остаток или резерв требует сверки. Изменения заказа отменены.",
          );
      }
    }
    if (body.status === "DELIVERED" || body.status === "CANCELLED")
      await tx
        .update(procurementRequests)
        .set({
          status: body.status === "DELIVERED" ? "COMPLETED" : "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(procurementRequests.orderId, id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "orders.status.changed",
      entity: "orders",
      entityId: id,
      data: { before: before.status, after: body.status },
    });
    await enqueueOrderNotifications(tx, {
      orderId: id,
      event: `ORDER_${body.status}`,
      version: changed[0].updatedAt.toISOString(),
    });
    return { id, status: body.status };
  });
}
