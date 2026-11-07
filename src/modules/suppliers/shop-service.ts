import { enqueueOrderNotifications } from "@/modules/notifications/events";
import { validateProductCategory } from "@/modules/catalog/product-attribute-validation";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  orderItems,
  orders,
  productAttributes,
  productImages,
  products,
  supplierOffers,
  supplierUsers,
  users,
} from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { uploadProductImage } from "@/modules/catalog/image-service";
import { ApiError } from "@/server/api-error";
import { getSupplierForUser } from "./service";
import { offerInput, serializeOffer } from "./offer-service";
import { SHOP_ORDER_TRANSITIONS } from "./order-status";

const productInput = z.object({
  nameRu: z.string().trim().min(2).max(250),
  categoryId: z.string().uuid(),
  unit: z.string().trim().min(1).max(30),
  brand: z.string().trim().max(150).default(""),
  descriptionRu: z.string().trim().max(10000).default(""),
  attributes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        value: z.string().trim().min(1).max(500),
      }),
    )
    .max(60)
    .default([]),
});
const inputSchema = z
  .object({
    product: productInput.optional(),
    offer: offerInput.omit({ productId: true }).optional(),
  })
  .refine((v) => v.product || v.offer);
export async function shopMembership(actor: SessionUser, mutate = false) {
  if (!["SUPPLIER_OWNER", "SUPPLIER_STAFF"].includes(actor.role))
    throw new ApiError(403, "forbidden", "Требуется доступ к магазину");
  return getSupplierForUser(actor.id, mutate);
}
export async function listShopProducts(actor: SessionUser) {
  const { supplier } = await shopMembership(actor);
  const db = await getDb();
  const rows = await db
    .select({ product: products, offer: supplierOffers })
    .from(products)
    .leftJoin(
      supplierOffers,
      and(eq(supplierOffers.productId, products.id), eq(supplierOffers.supplierId, supplier.id)),
    )
    .where(
      or(eq(products.createdBySupplierId, supplier.id), eq(supplierOffers.supplierId, supplier.id)),
    )
    .orderBy(desc(products.updatedAt));
  return rows.map((row) => ({
    product: row.product,
    offer: row.offer ? serializeOffer(row.offer) : null,
  }));
}
export async function getShopProduct(actor: SessionUser, id: string) {
  const rows = await listShopProducts(actor);
  const row = rows.find((item) => item.product.id === id);
  if (!row) throw new ApiError(404, "not_found", "Товар не найден");
  const db = await getDb();
  const { supplier } = await shopMembership(actor);
  const shared = await db
    .select({ id: supplierOffers.id })
    .from(supplierOffers)
    .where(and(eq(supplierOffers.productId, id), ne(supplierOffers.supplierId, supplier.id)))
    .limit(1);
  return {
    ...row,
    canEditProduct: row.product.createdBySupplierId === supplier.id && shared.length === 0,
    attributes: await db
      .select({ name: productAttributes.name, value: productAttributes.value })
      .from(productAttributes)
      .where(eq(productAttributes.productId, id)),
    images: (
      await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(productImages.sort)
    ).map((image) => ({ id: image.id, url: `/api/files/${image.fileId}` })),
  };
}
export async function createShopProduct(actor: SessionUser, input: unknown) {
  const data = inputSchema.parse(input);
  if (!data.product || !data.offer)
    throw new ApiError(400, "validation_failed", "Заполните карточку и условия продажи");
  const { supplier } = await shopMembership(actor, true);
  const db = await getDb();
  data.product.attributes = (await validateProductCategory(
    db,
    data.product.categoryId,
    data.product.attributes,
  ))!;
  const id = randomUUID();
  await db.transaction(async (tx) => {
    const { attributes, ...details } = data.product!;
    await tx.insert(products).values({
      ...details,
      id,
      sku: `SHOP-${id.slice(0, 8).toUpperCase()}`,
      slug: `shop-${id}`,
      status: "PENDING",
      createdBySupplierId: supplier.id,
    });
    if (attributes.length)
      await tx
        .insert(productAttributes)
        .values(attributes.map((attr) => ({ ...attr, productId: id })));
    await tx.insert(supplierOffers).values({
      ...data.offer!,
      productId: id,
      supplierId: supplier.id,
      supplierPriceDirams: BigInt(data.offer!.supplierPriceDirams),
      stockQty: data.offer!.stockQty.replace(",", "."),
      minOrderQty: data.offer!.minOrderQty.replace(",", "."),
    });
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "shop.product.submitted",
      entity: "products",
      entityId: id,
    });
  });
  return getShopProduct(actor, id);
}
export async function updateShopProduct(actor: SessionUser, id: string, input: unknown) {
  const data = inputSchema.parse(input);
  const { supplier } = await shopMembership(actor, true);
  const before = await getShopProduct(actor, id);
  if (data.product && !before.canEditProduct)
    throw new ApiError(
      403,
      "shared_product",
      "Общую карточку изменяет платформа. Вы можете менять свои условия продажи.",
    );
  const db = await getDb();
  if (data.product) {
    data.product.attributes = (await validateProductCategory(
      db,
      data.product.categoryId,
      data.product.attributes,
    ))!;
  }
  await db.transaction(async (tx) => {
    if (data.product) {
      const { attributes, ...details } = data.product;
      await tx
        .update(products)
        .set({ ...details, status: "PENDING", rejectReason: null, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.createdBySupplierId, supplier.id)));
      await tx.delete(productAttributes).where(eq(productAttributes.productId, id));
      if (attributes.length)
        await tx
          .insert(productAttributes)
          .values(attributes.map((attr) => ({ ...attr, productId: id })));
    }
    if (data.offer) {
      if (Number(data.offer.stockQty.replace(",", ".")) < Number(before.offer?.reservedQty ?? "0"))
        throw new ApiError(
          409,
          "reserved_stock",
          "Остаток не может быть меньше зарезервированного количества",
        );
      const values = {
        ...data.offer,
        supplierPriceDirams: BigInt(data.offer.supplierPriceDirams),
        stockQty: data.offer.stockQty.replace(",", "."),
        minOrderQty: data.offer.minOrderQty.replace(",", "."),
        updatedAt: new Date(),
      };
      const [updatedOffer] = await tx
        .insert(supplierOffers)
        .values({ ...values, productId: id, supplierId: supplier.id })
        .onConflictDoUpdate({
          target: [supplierOffers.productId, supplierOffers.supplierId],
          set: values,
          setWhere: sql`${supplierOffers.reservedQty}::numeric <= ${values.stockQty}::numeric`,
        })
        .returning({ id: supplierOffers.id });
      if (!updatedOffer)
        throw new ApiError(
          409,
          "reserved_stock",
          "Остаток не может быть меньше зарезервированного количества",
        );
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "shop.product.updated",
      entity: "products",
      entityId: id,
    });
  });
  return getShopProduct(actor, id);
}
export async function uploadShopImage(actor: SessionUser, id: string, file: File) {
  await shopMembership(actor, true);
  const row = await getShopProduct(actor, id);
  if (!row.canEditProduct)
    throw new ApiError(403, "shared_product", "Изображения общей карточки изменяет платформа");
  const image = await uploadProductImage(actor, id, file);
  const db = await getDb();
  await db
    .update(products)
    .set({ status: "PENDING", updatedAt: new Date() })
    .where(eq(products.id, id));
  return image;
}
function ownedOrderItems(supplierId: string) {
  return or(
    eq(orderItems.supplierId, supplierId),
    and(
      isNull(orderItems.supplierId),
      sql`exists(select 1 from supplier_offers source_offer where source_offer.id=${orderItems.offerId} and source_offer.supplier_id=${supplierId})`,
    ),
  );
}
export async function listShopOrders(actor: SessionUser) {
  const { supplier } = await shopMembership(actor);
  const db = await getDb();
  const rows = await db
    .select({ order: orders, item: orderItems })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(ownedOrderItems(supplier.id))
    .orderBy(desc(orders.createdAt));
  const grouped = new Map<
    string,
    {
      id: string;
      orderNumber: string;
      status: string;
      shopStatus: string;
      shopUpdatedAt: Date;
      markupPercent: number | null;
      vehicleType: string;
      createdAt: Date;
      customerName: string;
      customerPhone: string;
      deliveryCity: string;
      deliveryAddress: string;
      deliveryNotes: string | null;
      items: (typeof orderItems.$inferSelect)[];
    }
  >();
  for (const { order, item } of rows) {
    if (!grouped.has(order.id))
      grouped.set(order.id, {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        shopStatus: item.shopStatus,
        shopUpdatedAt: item.shopUpdatedAt,
        markupPercent: order.markupPercent,
        vehicleType: order.vehicleType,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryCity: order.deliveryCity,
        deliveryAddress: order.deliveryAddress,
        deliveryNotes: order.deliveryNotes,
        items: [],
      });
    grouped.get(order.id)!.items.push(item);
  }
  return [...grouped.values()].map((order) => ({
    ...order,
    canManage: supplier.status !== "SUSPENDED",
    supplierTotalDirams: order.items.every((item) => item.supplierSubtotalDirams !== null)
      ? order.items.reduce((sum, item) => sum + BigInt(item.supplierSubtotalDirams!), 0n).toString()
      : null,
    retailTotalDirams: order.items
      .reduce((sum, item) => sum + BigInt(item.subtotalDirams), 0n)
      .toString(),
  }));
}
export async function getShopOrder(actor: SessionUser, id: string) {
  const row = (await listShopOrders(actor)).find((order) => order.id === id);
  if (!row) throw new ApiError(404, "not_found", "Заказ не найден");
  return row;
}
export async function updateShopOrderStatus(actor: SessionUser, id: string, input: unknown) {
  if (!z.string().uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заказ не найден");
  const body = z
    .object({
      status: z.enum(["ACCEPTED", "READY", "HANDED_OVER"]),
      expectedStatus: z.enum(["NEW", "ACCEPTED", "READY", "HANDED_OVER"]),
    })
    .parse(input);
  const { supplier } = await shopMembership(actor, true);
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!order) throw new ApiError(404, "not_found", "Заказ не найден");
    const own = await tx
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.orderId, id), ownedOrderItems(supplier.id)));
    if (!own.length) throw new ApiError(404, "not_found", "Заказ не найден");
    if (["CANCELLED", "DELIVERED"].includes(order.status))
      throw new ApiError(409, "order_closed", "Заказ уже завершён или отменён");
    if (own.every((item) => item.shopStatus === body.status)) return { id, status: body.status };
    if (body.status === "HANDED_OVER" && !["CONFIRMED", "DISPATCHED"].includes(order.status))
      throw new ApiError(
        409,
        "order_not_confirmed",
        "Передача доступна после подтверждения заказа платформой",
      );
    if (own.some((item) => item.shopStatus !== body.expectedStatus))
      throw new ApiError(
        409,
        "status_conflict",
        "Статус уже изменён другим сотрудником. Обновите страницу",
      );
    if (!SHOP_ORDER_TRANSITIONS[body.expectedStatus]?.includes(body.status))
      throw new ApiError(400, "invalid_transition", "Недопустимый переход статуса");
    const updatedAt = new Date();
    await tx
      .update(orderItems)
      .set({ shopStatus: body.status, shopUpdatedAt: updatedAt })
      .where(and(eq(orderItems.orderId, id), ownedOrderItems(supplier.id)));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "shop.order.status_changed",
      entity: "orders",
      entityId: id,
      data: { supplierId: supplier.id, before: body.expectedStatus, after: body.status },
    });
    await enqueueOrderNotifications(tx, {
      orderId: id,
      event: "SHOP_STATUS_CHANGED",
      version: updatedAt.toISOString(),
      supplierId: supplier.id,
      shopStatus: body.status,
    });
    return { id, status: body.status };
  });
}
export async function getShopTeam(actor: SessionUser) {
  const { supplier, role } = await shopMembership(actor);
  const db = await getDb();
  const members = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      status: users.status,
      role: supplierUsers.role,
    })
    .from(supplierUsers)
    .innerJoin(users, eq(users.id, supplierUsers.userId))
    .where(eq(supplierUsers.supplierId, supplier.id));
  return { supplier, role, members };
}
