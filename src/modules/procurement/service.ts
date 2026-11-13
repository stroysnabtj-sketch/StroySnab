import { publicProductText } from "@/modules/catalog/public-text";
import {
  enqueueOrderNotifications,
  enqueueQuoteReadyNotification,
} from "@/modules/notifications/events";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  auditLog,
  procurementRequests,
  quotations,
  quotationJobs,
  quotationImages,
  procurementAttachments,
  customers,
  supplierOffers,
  products,
  suppliers,
  orders,
  orderItems,
  type QuotationLine,
} from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { nextDocNumber } from "@/modules/system/doc-number";
import { normalizePhone } from "@/modules/system/phone";
import { lineBase, quantityMillis } from "@/modules/pricing/order-markup";
import {
  markupPercentInput,
  productLinePrice,
  summarizeProductPrices,
} from "@/modules/pricing/product-price";
import { visibleCategoryIds } from "@/modules/catalog/category-visibility";
import { writeAudit } from "@/modules/audit/service";
import { getOrderPaymentSummary } from "@/modules/orders/payment-service";
import { ApiError } from "@/server/api-error";
export const PROCUREMENT_LABELS: Record<string, string> = {
  NEW: "Новая",
  IN_REVIEW: "В работе",
  QUOTED: "КП отправлено",
  ACCEPTED: "КП принято",
  REJECTED: "Отклонена",
  COMPLETED: "Выполнена",
  CANCELLED: "Отменена",
};
export const QUOTATION_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  SENT: "Отправлено",
  ACCEPTED: "Принято",
  DECLINED: "Отклонено",
};
export const procurementManager = (actor: SessionUser | null) =>
  Boolean(actor && hasPermission(actor.role, "product_requests:manage"));
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const qty = z
  .string()
  .trim()
  .transform((v) => v.replace(",", "."))
  .refine((v) => {
    try {
      quantityMillis(v);
      return true;
    } catch {
      return false;
    }
  }, "Укажите положительное количество, до трёх знаков после запятой");
const line = z.object({
  name: z.string().trim().min(2).max(300),
  qty,
  unit: z.string().trim().min(1).max(30),
});
const money = z.string().regex(/^\d{1,14}$/, "Некорректная сумма в дирам");
const requestInput = z.object({
  title: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().min(8).max(30),
  contactEmail: z.union([z.string().email().max(254), z.literal("")]).optional(),
  note: z.string().max(5000).optional(),
  lines: z.array(line).min(1).max(200),
});

export async function createProcurementRequest(input: unknown, actor: SessionUser | null) {
  const data = requestInput.parse(input);
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [record] = await tx
      .insert(procurementRequests)
      .values({
        ...data,
        number: await nextDocNumber(tx, "RFQ"),
        contactPhone: normalizePhone(data.contactPhone),
        userId: actor?.role === "CUSTOMER" ? actor.id : null,
        guestTokenHash: actor?.role === "CUSTOMER" ? null : hash(token),
      })
      .returning();
    await writeAudit(tx, {
      actorUserId: actor?.id,
      actorRole: actor?.role ?? "GUEST",
      action: "procurement.created",
      entity: "procurement_requests",
      entityId: record.id,
      data: { number: record.number },
    });
    return {
      id: record.id,
      number: record.number,
      accessToken: record.guestTokenHash ? token : undefined,
    };
  });
}
export async function getProcurementRequest(
  id: string,
  actor: SessionUser | null,
  token?: string | null,
) {
  z.string().uuid().parse(id);
  const db = await getDb();
  const [r] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, id));
  const manager = procurementManager(actor);
  if (
    !r ||
    !(
      manager ||
      (actor?.role === "CUSTOMER" && r.userId === actor.id) ||
      (token && r.guestTokenHash === hash(token))
    )
  )
    throw new ApiError(404, "not_found", "Заявка не найдена");
  const [q] = await db.select().from(quotations).where(eq(quotations.requestId, id));
  const [ai] = await db.select().from(quotationJobs).where(eq(quotationJobs.requestId, id));
  const files = await db
    .select({
      id: procurementAttachments.id,
      name: procurementAttachments.name,
      mime: procurementAttachments.mime,
      size: procurementAttachments.size,
    })
    .from(procurementAttachments)
    .where(eq(procurementAttachments.requestId, id));
  // Older rejected drafts could have been marked DECLINED before ever being sent.
  const [publication] =
    !manager && q?.status === "DECLINED"
      ? await db
          .select({ id: auditLog.id })
          .from(auditLog)
          .where(
            and(
              eq(auditLog.entity, "procurement_requests"),
              eq(auditLog.entityId, id),
              eq(auditLog.action, "procurement.quote.sent"),
              sql`${auditLog.data}->>'version' = ${String(q.version)}`,
            ),
          )
          .limit(1)
      : [];
  const quote =
    q && (manager || (q.status !== "DRAFT" && (q.status !== "DECLINED" || publication)))
      ? {
          id: q.id,
          number: q.number,
          status: q.status,
          version: q.version,
          validUntil: q.validUntil,
          conditions: q.conditions,
          deliveryDirams: q.deliveryDirams,
          totalDirams: q.totalDirams,
          lines: q.lines.map((l) =>
            manager
              ? l
              : {
                  id: l.id,
                  imageIds: l.imageIds ?? [],
                  name: publicProductText(l.name),
                  qty: l.qty,
                  unit: l.unit,
                  priceDirams: l.priceDirams,
                  subtotalDirams: l.subtotalDirams,
                },
          ),
          ...(manager
            ? {
                baseDirams: q.baseDirams,
                markupDirams: q.markupDirams,
                markupPercent: q.markupPercent,
              }
            : {}),
        }
      : null;
  return {
    request: {
      id: r.id,
      number: r.number,
      title: r.title,
      contactName: r.contactName,
      contactPhone: r.contactPhone,
      contactEmail: r.contactEmail,
      note: r.note,
      status: r.status,
      lines: r.lines,
      orderId: r.orderId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    },
    quotation: quote,
    preparation: ai
      ? {
          state: ai.state,
          updatedAt: ai.updatedAt,
          ...(manager
            ? { lines: ai.lines, warnings: ai.warnings, error: ai.error }
            : {
                lines: ai.lines.map((l) => ({
                  name: publicProductText(l.name),
                  qty: l.qty,
                  unit: l.unit,
                  requestedName: l.requestedName ? publicProductText(l.requestedName) : undefined,
                  alternative: l.alternative,
                  issue: l.issue,
                })),
              }),
        }
      : null,
    attachments: files,
    payment: r.orderId ? await getOrderPaymentSummary(r.orderId) : null,
    isManager: manager,
  };
}
const quoteInput = z.object({
  version: z.number().int().min(0),
  send: z.boolean().default(false),
  validUntil: z.string().datetime(),
  conditions: z.string().max(5000).default(""),
  deliveryDirams: money.default("0"),
  lines: z
    .array(
      line.extend({
        id: z.uuid().optional(),
        imageIds: z.array(z.uuid()).max(3).default([]),
        offerId: z.string().uuid().nullable().optional(),
        basePriceDirams: money.refine((v) => BigInt(v) > 0n, "Укажите цену"),
        markupPercent: markupPercentInput.optional(),
      }),
    )
    .min(1)
    .max(200),
});
export async function saveQuotation(
  id: string,
  actor: SessionUser,
  input: unknown,
  preparationGuard?: { jobId: string; requestUpdatedAt: Date },
) {
  if (!procurementManager(actor)) throw new ApiError(403, "forbidden", "Недостаточно прав");
  const data = quoteInput.parse(input);
  if (new Date(data.validUntil) <= new Date())
    throw new ApiError(400, "expired", "Укажите будущий срок действия КП");
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM procurement_requests WHERE id=${id}::uuid FOR UPDATE`);
    const [request] = await tx
      .select()
      .from(procurementRequests)
      .where(eq(procurementRequests.id, id));
    if (!request) throw new ApiError(404, "not_found", "Заявка не найдена");
    if (preparationGuard) {
      const [job] = await tx
        .select()
        .from(quotationJobs)
        .where(and(eq(quotationJobs.id, preparationGuard.jobId), eq(quotationJobs.requestId, id)))
        .for("update");
      if (
        !job ||
        job.state !== "review" ||
        request.status !== "IN_REVIEW" ||
        request.updatedAt.getTime() !== preparationGuard.requestUpdatedAt.getTime()
      )
        throw new ApiError(409, "request_changed", "Заявка изменена менеджером");
    }
    if (["ACCEPTED", "COMPLETED", "CANCELLED"].includes(request.status))
      throw new ApiError(409, "closed", "Заявка уже завершена или принята");
    const imageIds = [...new Set(data.lines.flatMap((line) => line.imageIds))];
    if (imageIds.length > 20) throw new ApiError(400, "image_limit", "Не более 20 фото в КП");
    if (imageIds.length) {
      const images = await tx
        .select({ id: quotationImages.id })
        .from(quotationImages)
        .where(eq(quotationImages.requestId, id));
      const allowed = new Set(images.map((image) => image.id));
      if (imageIds.some((image) => !allowed.has(image)))
        throw new ApiError(400, "image_owner", "Изображение не принадлежит заявке");
    }
    const lineIds = data.lines.map((line) => line.id).filter(Boolean);
    if (new Set(lineIds).size !== lineIds.length)
      throw new ApiError(400, "line_ids", "Повторяющаяся строка КП");
    const [old] = await tx.select().from(quotations).where(eq(quotations.requestId, id));
    if ((old?.version ?? 0) !== data.version)
      throw new ApiError(409, "version_conflict", "КП изменилось. Обновите страницу");
    const calculated: QuotationLine[] = [];
    let base = 0n;
    for (const l of data.lines) {
      if (preparationGuard && !l.offerId)
        throw new ApiError(409, "offer_unavailable", "Товар недоступен");
      const subtotal = lineBase(BigInt(l.basePriceDirams), l.qty);
      base += subtotal;
      let info:
        | { productId: string; supplierId: string; supplierName: string; markupPercent: string }
        | undefined;
      if (l.offerId) {
        const [o] = await tx
          .select({
            productId: products.id,
            supplierId: suppliers.id,
            supplierName: suppliers.name,
            markupPercent: products.markupPercent,
            supplierPriceDirams: supplierOffers.supplierPriceDirams,
            stockQty: supplierOffers.stockQty,
            reservedQty: supplierOffers.reservedQty,
            minOrderQty: supplierOffers.minOrderQty,
            unit: products.unit,
          })
          .from(supplierOffers)
          .innerJoin(products, eq(products.id, supplierOffers.productId))
          .innerJoin(suppliers, eq(suppliers.id, supplierOffers.supplierId))
          .where(
            and(
              eq(supplierOffers.id, l.offerId),
              eq(supplierOffers.isActive, "true"),
              eq(products.status, "PUBLISHED"),
              eq(suppliers.status, "ACTIVE"),
              sql`${products.categoryId} IN (${visibleCategoryIds})`,
            ),
          );
        if (!o) throw new ApiError(409, "offer_unavailable", "Предложение недоступно");
        if (
          preparationGuard &&
          (BigInt(o.supplierPriceDirams) !== BigInt(l.basePriceDirams) ||
            o.unit !== l.unit ||
            Number(o.stockQty) - Number(o.reservedQty) < Number(l.qty) ||
            Number(o.minOrderQty) > Number(l.qty))
        )
          throw new ApiError(409, "offer_changed", "Цена или остаток товара изменились");
        info = {
          productId: o.productId,
          supplierId: o.supplierId,
          supplierName: o.supplierName,
          markupPercent: o.markupPercent,
        };
      }
      calculated.push({
        ...l,
        id: l.id ?? crypto.randomUUID(),
        ...info,
        markupPercent: info?.markupPercent ?? l.markupPercent ?? "7",
        baseSubtotalDirams: subtotal.toString(),
        priceDirams: "0",
        subtotalDirams: "0",
      });
    }
    if (base <= 0n || base > 99999999999999n)
      throw new ApiError(400, "invalid_total", "Проверьте общую стоимость");
    if (preparationGuard) {
      const totals = new Map<string, bigint>();
      for (const l of calculated)
        totals.set(l.offerId!, (totals.get(l.offerId!) ?? 0n) + quantityMillis(l.qty));
      for (const [offerId, qty] of totals) {
        const [offer] = await tx
          .select()
          .from(supplierOffers)
          .where(eq(supplierOffers.id, offerId));
        if (
          !offer ||
          BigInt(Math.round((Number(offer.stockQty) - Number(offer.reservedQty)) * 1000)) < qty
        )
          throw new ApiError(409, "offer_changed", "Недостаточный остаток товара");
      }
    }
    const prices = calculated.map((l) =>
      productLinePrice(BigInt(l.basePriceDirams), l.qty, l.markupPercent),
    );
    const markup = summarizeProductPrices(prices);
    calculated.forEach((l, index) => {
      l.subtotalDirams = prices[index].subtotalDirams.toString();
      l.priceDirams = prices[index].priceDirams.toString();
    });
    const values = {
      version: (old?.version ?? 0) + 1,
      status: data.send ? "SENT" : "DRAFT",
      validUntil: new Date(data.validUntil),
      conditions: data.conditions,
      lines: calculated,
      baseDirams: base.toString(),
      markupPercent: markup.percent,
      markupDirams: markup.markupDirams.toString(),
      deliveryDirams: data.deliveryDirams,
      totalDirams: (markup.totalDirams + BigInt(data.deliveryDirams)).toString(),
      updatedAt: new Date(),
    };
    const [result] = old
      ? await tx.update(quotations).set(values).where(eq(quotations.id, old.id)).returning()
      : await tx
          .insert(quotations)
          .values({ ...values, requestId: id, number: await nextDocNumber(tx, "QUO") })
          .returning();
    await tx
      .update(procurementRequests)
      .set({ status: data.send ? "QUOTED" : "IN_REVIEW", updatedAt: new Date() })
      .where(eq(procurementRequests.id, id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: data.send ? "procurement.quote.sent" : "procurement.quote.saved",
      entity: "procurement_requests",
      entityId: id,
      data: { number: result.number, version: result.version, totalDirams: result.totalDirams },
    });
    if (data.send)
      await enqueueQuoteReadyNotification(tx, {
        requestId: id,
        quoteId: result.id,
        quoteNumber: result.number,
        version: String(result.version),
        customerPhone: request.contactPhone,
        customerUserId: request.userId,
        customerEmail: request.contactEmail,
      });
    return result;
  });
}
export async function decideQuotation(
  id: string,
  actor: SessionUser | null,
  token: string | null | undefined,
  input: unknown,
) {
  await getProcurementRequest(id, actor, token);
  const data = z
    .object({
      action: z.enum(["ACCEPT", "DECLINE"]),
      version: z.number().int().positive(),
      deliveryAddress: z.string().trim().max(500).optional(),
      deliveryCity: z.string().trim().min(2).max(100).optional(),
      deliveryLat: z.number().finite().min(-90).max(90).optional(),
      deliveryLng: z.number().finite().min(-180).max(180).optional(),
    })
    .refine(
      (v) => (v.deliveryLat === undefined) === (v.deliveryLng === undefined),
      "Укажите обе координаты",
    )
    .parse(input);
  if (procurementManager(actor))
    throw new ApiError(403, "buyer_required", "Решение принимает покупатель");
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM procurement_requests WHERE id=${id}::uuid FOR UPDATE`);
    const [r] = await tx.select().from(procurementRequests).where(eq(procurementRequests.id, id));
    const [q] = await tx.select().from(quotations).where(eq(quotations.requestId, id));
    if (!q) throw new ApiError(409, "no_quote", "КП ещё не подготовлено");
    if (q.status === "ACCEPTED" && data.action === "ACCEPT")
      return { orderId: r.orderId, status: "ACCEPTED" };
    if (q.status !== "SENT" || q.version !== data.version)
      throw new ApiError(409, "quote_changed", "КП изменилось. Обновите страницу");
    if (new Date(q.validUntil) <= new Date())
      throw new ApiError(409, "expired", "Срок действия КП истёк");
    if (data.action === "DECLINE") {
      await tx
        .update(quotations)
        .set({ status: "DECLINED", updatedAt: new Date() })
        .where(eq(quotations.id, q.id));
      await tx
        .update(procurementRequests)
        .set({ status: "REJECTED", updatedAt: new Date() })
        .where(eq(procurementRequests.id, id));
      await writeAudit(tx, {
        actorUserId: actor?.id,
        actorRole: actor?.role ?? "GUEST",
        action: "procurement.quote.declined",
        entity: "procurement_requests",
        entityId: id,
      });
      return { orderId: null, status: "REJECTED" };
    }
    if (!data.deliveryAddress || data.deliveryAddress.length < 5)
      throw new ApiError(400, "address_required", "Укажите адрес доставки");
    const quantities = new Map<string, bigint>();
    for (const l of q.lines)
      if (l.offerId)
        quantities.set(l.offerId, (quantities.get(l.offerId) ?? 0n) + quantityMillis(l.qty));
    for (const [offerId, millis] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
      const quantity = `${millis / 1000n}.${String(millis % 1000n).padStart(3, "0")}`;
      const [available] = await tx
        .select({ id: supplierOffers.id })
        .from(supplierOffers)
        .innerJoin(products, eq(products.id, supplierOffers.productId))
        .innerJoin(suppliers, eq(suppliers.id, supplierOffers.supplierId))
        .where(
          and(
            eq(supplierOffers.id, offerId),
            eq(products.status, "PUBLISHED"),
            eq(suppliers.status, "ACTIVE"),
            sql`${products.categoryId} IN (${visibleCategoryIds})`,
          ),
        );
      if (!available)
        throw new ApiError(409, "unavailable", "Материал больше недоступен. Запросите новое КП");
      const updated = await tx
        .update(supplierOffers)
        .set({
          reservedQty: sql`(${supplierOffers.reservedQty}::numeric+${quantity}::numeric)::text`,
        })
        .where(
          and(
            eq(supplierOffers.id, offerId),
            eq(supplierOffers.isActive, "true"),
            sql`${supplierOffers.stockQty}::numeric-${supplierOffers.reservedQty}::numeric>=${quantity}::numeric`,
            sql`${supplierOffers.minOrderQty}::numeric<=${quantity}::numeric`,
          ),
        )
        .returning({ id: supplierOffers.id });
      if (!updated.length)
        throw new ApiError(
          409,
          "out_of_stock",
          "Недостаточно свободного остатка. Запросите новое КП",
        );
    }
    const [customer] = r.userId
      ? await tx.select().from(customers).where(eq(customers.userId, r.userId))
      : [];
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: await nextDocNumber(tx, "ORD"),
        customerId: customer?.id ?? null,
        guestAccessTokenHash: customer ? null : r.guestTokenHash,
        idempotencyKey: `quotation:${q.id}`,
        customerName: r.contactName,
        customerPhone: r.contactPhone,
        customerEmail: r.contactEmail,
        deliveryCity: data.deliveryCity ?? "Таджикистан",
        deliveryLat: data.deliveryLat === undefined ? null : String(data.deliveryLat),
        deliveryLng: data.deliveryLng === undefined ? null : String(data.deliveryLng),
        deliveryAddress: data.deliveryAddress,
        deliveryNotes: q.conditions,
        vehicleType: "UNASSIGNED",
        unloadingType: "SELF",
        status: "NEW",
        paymentMethod: "CASH_ON_DELIVERY",
        goodsBaseDirams: q.baseDirams,
        markupPercent: q.markupPercent,
        markupDirams: q.markupDirams,
        materialsTotalDirams: (BigInt(q.totalDirams) - BigInt(q.deliveryDirams)).toString(),
        deliveryTotalDirams: q.deliveryDirams,
        totalDirams: q.totalDirams,
      })
      .returning();
    await tx.insert(orderItems).values(
      q.lines.map((l, i) => ({
        orderId: order.id,
        productId: l.productId ?? null,
        offerId: l.offerId ?? null,
        supplierId: l.supplierId ?? null,
        supplierName: l.supplierName ?? null,
        supplierPriceDirams: l.basePriceDirams,
        supplierSubtotalDirams: l.baseSubtotalDirams,
        imageIds: l.imageIds ?? [],
        productName: l.name,
        sku: `${q.number}-${i + 1}`,
        unit: l.unit,
        qty: l.qty,
        priceDirams: l.priceDirams,
        subtotalDirams: l.subtotalDirams,
      })),
    );
    await enqueueOrderNotifications(tx, {
      orderId: order.id,
      event: "ORDER_CREATED",
      version: order.id,
    });
    await tx
      .update(quotations)
      .set({ status: "ACCEPTED", updatedAt: new Date() })
      .where(eq(quotations.id, q.id));
    await tx
      .update(procurementRequests)
      .set({ status: "ACCEPTED", orderId: order.id, updatedAt: new Date() })
      .where(eq(procurementRequests.id, id));
    await writeAudit(tx, {
      actorUserId: actor?.id,
      actorRole: actor?.role ?? "GUEST",
      action: "procurement.quote.accepted",
      entity: "procurement_requests",
      entityId: id,
      data: { orderId: order.id, quoteNumber: q.number },
    });
    await writeAudit(tx, {
      actorUserId: actor?.id,
      action: "orders.created",
      entity: "orders",
      entityId: order.id,
      data: { source: "quotation", quotation: q.number },
    });
    return { orderId: order.id, status: "ACCEPTED" };
  });
}
export async function updateProcurementStatus(id: string, actor: SessionUser, input: unknown) {
  if (!procurementManager(actor)) throw new ApiError(403, "forbidden", "Недостаточно прав");
  const data = z
    .object({
      status: z.enum(["IN_REVIEW", "REJECTED"]),
      reason: z.string().trim().min(3).max(1000),
    })
    .parse(input);
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM procurement_requests WHERE id=${id}::uuid FOR UPDATE`);
    const [r] = await tx.select().from(procurementRequests).where(eq(procurementRequests.id, id));
    if (!r) throw new ApiError(404, "not_found", "Заявка не найдена");
    if (["ACCEPTED", "COMPLETED", "CANCELLED"].includes(r.status))
      throw new ApiError(409, "closed", "Заявка уже связана с заказом");
    await tx
      .update(procurementRequests)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(procurementRequests.id, id));
    if (data.status === "REJECTED")
      await tx
        .update(quotations)
        .set({ status: "DECLINED", updatedAt: new Date() })
        .where(and(eq(quotations.requestId, id), eq(quotations.status, "SENT")));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "procurement.status.changed",
      entity: "procurement_requests",
      entityId: id,
      data: { status: data.status, reason: data.reason },
    });
    return { status: data.status };
  });
}
export async function listProcurementRequests(
  actor: SessionUser,
  params: { q?: string; status?: string; payment?: string; page?: number } = {},
) {
  const manager = procurementManager(actor);
  if (!manager && actor.role !== "CUSTOMER")
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  const db = await getDb();
  const where = and(
    !manager ? eq(procurementRequests.userId, actor.id) : undefined,
    params.status && PROCUREMENT_LABELS[params.status]
      ? eq(procurementRequests.status, params.status)
      : undefined,
    params.q
      ? or(
          ilike(procurementRequests.number, `%${params.q.slice(0, 200)}%`),
          ilike(procurementRequests.title, `%${params.q.slice(0, 200)}%`),
        )
      : undefined,
  );
  const records = await db
    .select({
      id: procurementRequests.id,
      number: procurementRequests.number,
      title: procurementRequests.title,
      status: procurementRequests.status,
      contactName: procurementRequests.contactName,
      createdAt: procurementRequests.createdAt,
      orderId: procurementRequests.orderId,
      quoteNumber: quotations.number,
      quoteStatus: quotations.status,
      totalDirams: quotations.totalDirams,
    })
    .from(procurementRequests)
    .leftJoin(quotations, eq(quotations.requestId, procurementRequests.id))
    .where(where)
    .orderBy(desc(procurementRequests.createdAt));
  const enriched = await Promise.all(
    records.map(async (r) => ({
      ...r,
      ...(!manager && ["DRAFT", "DECLINED"].includes(r.quoteStatus ?? "")
        ? { quoteNumber: null, quoteStatus: null, totalDirams: null }
        : {}),
      payment: r.orderId ? await getOrderPaymentSummary(r.orderId) : null,
    })),
  );
  const filtered = params.payment
    ? enriched.filter((r) => (r.payment?.status ?? "NO_ORDER") === params.payment)
    : enriched;
  const pages = Math.max(1, Math.ceil(filtered.length / 20)),
    page = Math.min(pages, Math.max(1, Number.isSafeInteger(params.page) ? params.page! : 1));
  return { items: filtered.slice((page - 1) * 20, page * 20), total: filtered.length, page, pages };
}
