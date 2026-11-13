import { parseExplicitPatch } from "@/modules/system/patch";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { products, supplierOffers, suppliers } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { toDirams } from "@/modules/system/money";
import { ApiError } from "@/server/api-error";

const qty = z
  .string()
  .regex(/^\d+(?:[.,]\d{1,3})?$/)
  .refine((value) => Number(value.replace(",", ".")) >= 0);

export const offerInput = z.object({
  productId: z.string().uuid(),
  supplierPriceDirams: z
    .string()
    .regex(/^\d+$/)
    .refine((value) => BigInt(value) > 0n),
  stockQty: qty,
  minOrderQty: qty.refine((value) => Number(value.replace(",", ".")) > 0),
  leadTimeDays: z.number().int().min(0).max(365),
  isActive: z.enum(["true", "false"]).default("true"),
});

export type OfferDTO = {
  id: string;
  productId: string;
  sku?: string;
  productName?: string;
  unit?: string;
  markupPercent?: string;
  supplierId: string;
  supplierName?: string;
  supplierPriceDirams: string;
  stockQty: string;
  reservedQty: string;
  minOrderQty: string;
  leadTimeDays: number;
  isActive: string;
  updatedAt?: string;
};

export function serializeOffer(row: {
  id: string;
  productId: string;
  sku?: string | null;
  productName?: string | null;
  unit?: string | null;
  markupPercent?: string | null;
  supplierId: string;
  supplierName?: string | null;
  supplierPriceDirams: bigint | string | number;
  stockQty: string;
  reservedQty: string;
  minOrderQty: string;
  leadTimeDays: number;
  isActive: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}): OfferDTO {
  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku ?? undefined,
    productName: row.productName ?? undefined,
    unit: row.unit ?? undefined,
    markupPercent: row.markupPercent ?? undefined,
    supplierId: row.supplierId,
    supplierName: row.supplierName ?? undefined,
    supplierPriceDirams: row.supplierPriceDirams.toString(),
    stockQty: row.stockQty,
    reservedQty: row.reservedQty,
    minOrderQty: row.minOrderQty,
    leadTimeDays: row.leadTimeDays,
    isActive: row.isActive,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : (row.updatedAt?.toString() ?? undefined),
  };
}

export async function listOffers(supplierId?: string): Promise<OfferDTO[]> {
  const db = await getDb();
  const condition = supplierId ? eq(supplierOffers.supplierId, supplierId) : undefined;
  const rows = await db
    .select({
      id: supplierOffers.id,
      productId: supplierOffers.productId,
      sku: products.sku,
      productName: products.nameRu,
      unit: products.unit,
      markupPercent: products.markupPercent,
      supplierId: supplierOffers.supplierId,
      supplierName: suppliers.name,
      supplierPriceDirams: sql<string>`${supplierOffers.supplierPriceDirams}::text`,
      stockQty: supplierOffers.stockQty,
      reservedQty: supplierOffers.reservedQty,
      minOrderQty: supplierOffers.minOrderQty,
      leadTimeDays: supplierOffers.leadTimeDays,
      isActive: supplierOffers.isActive,
      updatedAt: supplierOffers.updatedAt,
    })
    .from(supplierOffers)
    .innerJoin(products, eq(supplierOffers.productId, products.id))
    .innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
    .where(condition)
    .orderBy(desc(supplierOffers.updatedAt))
    .limit(1000);

  return rows.map((r) => serializeOffer(r));
}
export async function searchOffers(query: {
  supplierId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  const page = Number.isSafeInteger(query.page) ? Math.max(1, Math.min(100000, query.page!)) : 1,
    pageSize = 24;
  const filters = [];
  if (query.supplierId) filters.push(eq(supplierOffers.supplierId, query.supplierId));
  if (query.q?.trim())
    filters.push(
      or(ilike(products.nameRu, `%${query.q.trim()}%`), ilike(products.sku, `%${query.q.trim()}%`)),
    );
  const where = filters.length ? and(...filters) : undefined;
  const [[count], rows] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(supplierOffers)
      .innerJoin(products, eq(products.id, supplierOffers.productId))
      .where(where),
    db
      .select({
        offer: supplierOffers,
        sku: products.sku,
        productName: products.nameRu,
        unit: products.unit,
        markupPercent: products.markupPercent,
        supplierName: suppliers.name,
      })
      .from(supplierOffers)
      .innerJoin(products, eq(products.id, supplierOffers.productId))
      .innerJoin(suppliers, eq(suppliers.id, supplierOffers.supplierId))
      .where(where)
      .orderBy(desc(supplierOffers.updatedAt), desc(supplierOffers.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);
  return {
    items: rows.map((row) => ({
      ...serializeOffer(row.offer),
      sku: row.sku,
      productName: row.productName,
      unit: row.unit,
      markupPercent: row.markupPercent,
      supplierName: row.supplierName,
    })),
    total: count.value,
    page,
    pageSize,
  };
}

export async function upsertOffer(
  actor: SessionUser,
  supplierId: string,
  input: unknown,
  ip?: string,
): Promise<OfferDTO> {
  const data = offerInput.parse(await Promise.resolve(input));
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);
    if (!product) throw new ApiError(404, "not_found", "Товар не найден");
    const [saved] = await tx
      .insert(supplierOffers)
      .values({
        ...data,
        supplierPriceDirams: BigInt(data.supplierPriceDirams),
        supplierId,
        stockQty: data.stockQty.replace(",", "."),
        minOrderQty: data.minOrderQty.replace(",", "."),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [supplierOffers.productId, supplierOffers.supplierId],
        setWhere: sql`${supplierOffers.reservedQty}::numeric <= ${data.stockQty.replace(",", ".")}::numeric`,
        set: {
          supplierPriceDirams: BigInt(data.supplierPriceDirams),
          stockQty: data.stockQty.replace(",", "."),
          minOrderQty: data.minOrderQty.replace(",", "."),
          leadTimeDays: data.leadTimeDays,
          isActive: data.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!saved)
      throw new ApiError(
        409,
        "reserved_stock",
        "Остаток не может быть меньше зарезервированного количества",
      );
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "supplier_offer.upserted",
      entity: "supplier_offers",
      entityId: saved.id,
      data: {
        supplierId,
        productId: data.productId,
        before: null,
        after: { supplierPriceDirams: data.supplierPriceDirams, stockQty: data.stockQty },
      },
      ip,
    });
    return serializeOffer(saved);
  });
}

export async function updateOffer(
  actor: SessionUser,
  offerId: string,
  supplierId: string,
  input: unknown,
  ip?: string,
): Promise<OfferDTO> {
  const data = parseExplicitPatch(
    offerInput.omit({ productId: true }),
    await Promise.resolve(input),
  );
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(supplierOffers)
      .where(and(eq(supplierOffers.id, offerId), eq(supplierOffers.supplierId, supplierId)))
      .limit(1);
    if (!before) throw new ApiError(404, "not_found", "Предложение не найдено");

    const [updated] = await tx
      .update(supplierOffers)
      .set({
        ...data,
        supplierPriceDirams: data.supplierPriceDirams
          ? BigInt(data.supplierPriceDirams)
          : undefined,
        stockQty: data.stockQty?.replace(",", "."),
        minOrderQty: data.minOrderQty?.replace(",", "."),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierOffers.id, offerId),
          eq(supplierOffers.supplierId, supplierId),
          data.stockQty !== undefined
            ? sql`${supplierOffers.reservedQty}::numeric <= ${data.stockQty.replace(",", ".")}::numeric`
            : undefined,
        ),
      )
      .returning();
    if (!updated)
      throw new ApiError(
        409,
        "reserved_stock",
        "Остаток не может быть меньше зарезервированного количества",
      );

    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "supplier_offer.updated",
      entity: "supplier_offers",
      entityId: offerId,
      data: {
        before: {
          supplierPriceDirams: before.supplierPriceDirams.toString(),
          stockQty: before.stockQty,
        },
        after: {
          supplierPriceDirams: updated.supplierPriceDirams.toString(),
          stockQty: updated.stockQty,
        },
      },
      ip,
    });
    return serializeOffer(updated);
  });
}

export async function deactivateOffer(
  actor: SessionUser,
  offerId: string,
  supplierId: string | undefined,
  ip?: string,
) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const condition = supplierId
      ? and(eq(supplierOffers.id, offerId), eq(supplierOffers.supplierId, supplierId))
      : eq(supplierOffers.id, offerId);
    const [before] = await tx.select().from(supplierOffers).where(condition).limit(1);
    if (!before) throw new ApiError(404, "not_found", "Предложение не найдено");
    await tx
      .update(supplierOffers)
      .set({ isActive: "false", updatedAt: new Date() })
      .where(condition);
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "supplier_offer.deactivated",
      entity: "supplier_offers",
      entityId: offerId,
      data: { before: { isActive: before.isActive }, after: { isActive: "false" } },
      ip,
    });
    return { ok: true };
  });
}

export async function bulkUpdateOffers(
  actor: SessionUser,
  supplierId: string,
  rows: Record<string, string>[],
  ip?: string,
) {
  const results: { row: number; sku: string; ok: boolean; error?: string }[] = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    try {
      if (!row.sku) throw new Error("sku_required");
      const db = await getDb();
      const [product] = await db.select().from(products).where(eq(products.sku, row.sku)).limit(1);
      if (!product) throw new Error("product_not_found");
      const supplierPriceDirams = row.supplierPriceDirams
        ? row.supplierPriceDirams
        : toDirams(row.supplierPriceTjs ?? "").toString();
      await upsertOffer(
        actor,
        supplierId,
        {
          productId: product.id,
          supplierPriceDirams,
          stockQty: row.stockQty ?? "0",
          minOrderQty: row.minOrderQty || "1",
          leadTimeDays: Number(row.leadTimeDays ?? 1),
          isActive: row.isActive === "false" ? "false" : "true",
        },
        ip,
      );
      results.push({ row: index + 2, sku: row.sku, ok: true });
    } catch (error) {
      results.push({
        row: index + 2,
        sku: row.sku ?? "",
        ok: false,
        error: error instanceof Error ? error.message : "validation_error",
      });
    }
  }
  return {
    total: rows.length,
    updated: results.filter((row) => row.ok).length,
    errors: results.filter((row) => !row.ok),
  };
}
