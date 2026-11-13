import { parseExplicitPatch } from "@/modules/system/patch";
import { validateProductCategory } from "./product-attribute-validation";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { categories, productAttributes, products, supplierOffers, suppliers } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { ApiError } from "@/server/api-error";
import { markupPercentInput } from "@/modules/pricing/product-price";
import { hasPermission } from "@/modules/rbac/permissions";

export const productInput = z.object({
  sku: z.string().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nameRu: z.string().min(2).max(300),
  nameTg: z.string().max(300).optional().nullable(),
  descriptionRu: z.string().max(10000).optional().nullable(),
  categoryId: z.string().uuid(),
  brand: z.string().max(120).optional().nullable(),
  unit: z.string().min(1).max(30),
  markupPercent: markupPercentInput.default("7"),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"]).default("DRAFT"),
  createdBySupplierId: z.string().uuid().optional().nullable(),
  rejectReason: z.string().trim().max(2000).optional().nullable(),
  attributes: z
    .array(z.object({ name: z.string().min(1).max(100), value: z.string().min(1).max(1000) }))
    .max(50)
    .default([]),
});
export const categoryInput = z.object({
  parentId: z.string().uuid().optional().nullable(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  nameRu: z.string().min(2).max(200),
  nameTg: z.string().max(200).optional().nullable(),
  sort: z.number().int().min(0).default(0),
  isActive: z.enum(["true", "false"]).default("true"),
});
export async function adminListProducts(q?: string) {
  const db = await getDb();
  const condition = q
    ? or(ilike(products.nameRu, `%${q}%`), ilike(products.sku, `%${q}%`))
    : undefined;
  return db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      nameRu: products.nameRu,
      categoryId: products.categoryId,
      categoryName: categories.nameRu,
      brand: products.brand,
      unit: products.unit,
      markupPercent: products.markupPercent,
      status: products.status,
      rejectReason: products.rejectReason,
      descriptionRu: products.descriptionRu,
      createdBySupplierId: products.createdBySupplierId,
      updatedAt: products.updatedAt,
      supplierNames: sql<
        string[]
      >`coalesce((select jsonb_agg(distinct ${suppliers.name}) from ${suppliers} where ${suppliers.id}=${products.createdBySupplierId} or exists (select 1 from ${supplierOffers} where ${supplierOffers.supplierId}=${suppliers.id} and ${supplierOffers.productId}=${products.id})), '[]'::jsonb)`,
      offerCount: sql<number>`(select count(*)::int from ${supplierOffers} where ${supplierOffers.productId} = ${products.id})`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(condition)
    .orderBy(desc(products.updatedAt))
    .limit(500);
}
export async function searchAdminProducts(query: {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  const page = Number.isSafeInteger(query.page) ? Math.max(1, Math.min(query.page!, 100000)) : 1;
  const pageSize = Number.isSafeInteger(query.pageSize)
    ? Math.min(100, Math.max(1, query.pageSize!))
    : 24;
  const conditions = [];
  if (query.q?.trim())
    conditions.push(
      or(ilike(products.nameRu, `%${query.q.trim()}%`), ilike(products.sku, `%${query.q.trim()}%`)),
    );
  if (query.status) conditions.push(eq(products.status, query.status));
  if (query.categoryId) conditions.push(eq(products.categoryId, query.categoryId));
  const where = conditions.length ? and(...conditions) : undefined;
  const [[count], items] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
    db
      .select({
        id: products.id,
        sku: products.sku,
        slug: products.slug,
        nameRu: products.nameRu,
        categoryId: products.categoryId,
        categoryName: categories.nameRu,
        brand: products.brand,
        unit: products.unit,
        markupPercent: products.markupPercent,
        status: products.status,
        rejectReason: products.rejectReason,
        descriptionRu: products.descriptionRu,
        createdBySupplierId: products.createdBySupplierId,
        supplierNames: sql<
          string[]
        >`coalesce((select jsonb_agg(distinct ${suppliers.name}) from ${suppliers} where ${suppliers.id}=${products.createdBySupplierId} or exists (select 1 from ${supplierOffers} where ${supplierOffers.supplierId}=${suppliers.id} and ${supplierOffers.productId}=${products.id})), '[]'::jsonb)`,
        offerCount: sql<number>`(select count(*)::int from ${supplierOffers} where ${supplierOffers.productId}=${products.id})`,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(products.updatedAt), asc(products.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);
  return { items, total: count.value, page, pageSize };
}
export async function createProduct(actor: SessionUser, input: unknown, ip?: string) {
  const data = productInput.parse(await Promise.resolve(input));
  if (Number(data.markupPercent) !== 7 && !hasPermission(actor.role, "pricing:manage"))
    throw new ApiError(403, "forbidden", "Недостаточно прав для изменения наценки");
  if (data.status === "REJECTED" && (!data.rejectReason || data.rejectReason.length < 5))
    throw new ApiError(
      400,
      "rejection_reason_required",
      "Укажите причину отклонения: не менее 5 символов",
    );
  const db = await getDb();
  data.attributes = (await validateProductCategory(db, data.categoryId, data.attributes))!;
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(products)
      .values(data)
      .returning()
      .catch(() => {
        throw new ApiError(409, "conflict", "SKU или slug уже используется");
      });
    if (data.attributes.length)
      await tx
        .insert(productAttributes)
        .values(data.attributes.map((attribute) => ({ ...attribute, productId: created.id })));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "catalog.product.create",
      entity: "products",
      entityId: created.id,
      ip,
    });
    return created;
  });
}
export async function updateProduct(actor: SessionUser, id: string, input: unknown, ip?: string) {
  const data = parseExplicitPatch(productInput, await Promise.resolve(input));
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(products).where(eq(products.id, id)).limit(1);
    if (!before) throw new ApiError(404, "not_found", "Товар не найден");
    if (
      data.markupPercent !== undefined &&
      Number(data.markupPercent) !== Number(before.markupPercent) &&
      !hasPermission(actor.role, "pricing:manage")
    )
      throw new ApiError(403, "forbidden", "Недостаточно прав для изменения наценки");
    if (
      data.status === "REJECTED" &&
      !(data.rejectReason ?? before.rejectReason ?? "").trim().match(/^.{5,}$/s)
    )
      throw new ApiError(
        400,
        "rejection_reason_required",
        "Укажите причину отклонения: не менее 5 символов",
      );
    if (data.status && data.status !== "REJECTED") data.rejectReason = null;
    if (data.categoryId || data.attributes || data.status === "PUBLISHED") {
      const normalized = await validateProductCategory(
        tx,
        data.categoryId ?? before.categoryId,
        data.attributes,
      );
      if (normalized) data.attributes = normalized;
    }
    const [updated] = await tx
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (data.attributes) {
      await tx.delete(productAttributes).where(eq(productAttributes.productId, id));
      if (data.attributes.length)
        await tx
          .insert(productAttributes)
          .values(data.attributes.map((attribute) => ({ ...attribute, productId: id })));
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "catalog.product.update",
      entity: "products",
      entityId: id,
      data: {
        before: { status: before.status, name: before.nameRu, markupPercent: before.markupPercent },
        after: {
          status: updated.status,
          name: updated.nameRu,
          markupPercent: updated.markupPercent,
        },
      },
      ip,
    });
    return updated;
  });
}
export async function archiveProduct(actor: SessionUser, id: string, ip?: string) {
  const db = await getDb();
  const [before] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!before) throw new ApiError(404, "not_found", "Товар не найден");
  const [updated] = await db
    .update(products)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  await writeAudit(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "catalog.product.archive",
    entity: "products",
    entityId: id,
    data: { before: { status: before.status }, after: { status: updated.status } },
    ip,
  });
  return updated;
}
export async function createCategory(actor: SessionUser, input: unknown, ip?: string) {
  const data = categoryInput.parse(await Promise.resolve(input));
  const db = await getDb();
  if (data.parentId === data.slug)
    throw new ApiError(400, "validation_error", "Некорректный родитель");
  const [created] = await db.insert(categories).values(data).returning();
  await writeAudit(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "catalog.category.create",
    entity: "categories",
    entityId: created.id,
    ip,
  });
  return created;
}
export async function updateCategory(actor: SessionUser, id: string, input: unknown, ip?: string) {
  const data = parseExplicitPatch(categoryInput, await Promise.resolve(input));
  if (data.parentId === id)
    throw new ApiError(400, "validation_error", "Категория не может быть родителем самой себя");
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(19401105)`);
    const tree = await tx
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories);
    if (!tree.some((row) => row.id === id))
      throw new ApiError(404, "not_found", "Категория не найдена");
    if (data.parentId) {
      const lookup = new Map(tree.map((row) => [row.id, row.parentId]));
      if (!lookup.has(data.parentId))
        throw new ApiError(400, "parent_not_found", "Родительская категория не найдена");
      const visited = new Set([id]);
      let parent: string | null = data.parentId;
      while (parent) {
        if (visited.has(parent))
          throw new ApiError(
            400,
            "category_cycle",
            "Нельзя переместить категорию внутрь её потомка: получится цикл",
          );
        visited.add(parent);
        parent = lookup.get(parent) ?? null;
      }
    }
    const [updated] = await tx
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "catalog.category.update",
      entity: "categories",
      entityId: id,
      ip,
    });
    return updated;
  });
}
export async function getProductAttributes(productId: string) {
  const db = await getDb();
  return db.select().from(productAttributes).where(eq(productAttributes.productId, productId));
}
