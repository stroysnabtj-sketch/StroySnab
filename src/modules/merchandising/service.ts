import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { products } from "@/db/schema/catalog";
import { homeCollectionItems } from "@/db/schema/merchandising";
import { visibleCategoryIds } from "@/modules/catalog/category-visibility";
import { getPublicProduct } from "@/modules/catalog/service";
import type { PublicProduct } from "@/modules/catalog/types";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { ApiError } from "@/server/api-error";
import { writeAudit } from "@/modules/audit/service";

export const homeCollectionKind = z.enum(["new", "sale"]);
export const homeCollectionInput = z
  .array(z.uuid())
  .max(12, "Можно выбрать до 12 товаров")
  .refine((ids) => new Set(ids).size === ids.length, "Товары не должны повторяться");
export type HomeCollectionKind = z.infer<typeof homeCollectionKind>;

function assertEditor(actor: SessionUser) {
  if (!hasPermission(actor.role, "catalog:manage"))
    throw new ApiError(403, "forbidden", "Недостаточно прав");
}

export async function replaceHomeCollection(
  actor: SessionUser,
  kindInput: unknown,
  input: unknown,
  ip?: string | null,
) {
  assertEditor(actor);
  const kind = homeCollectionKind.parse(kindInput);
  const ids = homeCollectionInput.parse(input);
  const db = await getDb();
  await db.transaction(async (tx) => {
    // Serialize replacements, including the first save of an empty collection.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`home-collection:${kind}`}))`);
    if (ids.length) {
      const existing = await tx
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.id, ids));
      if (existing.length !== ids.length)
        throw new ApiError(400, "validation_failed", "Товар не найден");
    }
    await tx.delete(homeCollectionItems).where(eq(homeCollectionItems.collection, kind));
    if (ids.length)
      await tx
        .insert(homeCollectionItems)
        .values(ids.map((productId, position) => ({ collection: kind, productId, position })));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "home_collection.updated",
      entity: "home_collection",
      data: { collection: kind, productIds: ids },
      ip,
    });
  });
}

export async function getAdminHomeCollections(actor: SessionUser) {
  assertEditor(actor);
  const db = await getDb();
  return db
    .select({
      collection: homeCollectionItems.collection,
      id: products.id,
      name: products.nameRu,
      sku: products.sku,
      status: products.status,
    })
    .from(homeCollectionItems)
    .innerJoin(products, eq(homeCollectionItems.productId, products.id))
    .orderBy(asc(homeCollectionItems.position));
}

export async function searchHomeCollectionProducts(actor: SessionUser, query: string) {
  assertEditor(actor);
  const db = await getDb();
  const q = query.trim().slice(0, 120);
  return db
    .select({ id: products.id, name: products.nameRu, sku: products.sku, status: products.status })
    .from(products)
    .where(
      and(
        eq(products.status, "PUBLISHED"),
        sql`${products.categoryId} in (${visibleCategoryIds})`,
        q ? or(ilike(products.nameRu, `%${q}%`), ilike(products.sku, `%${q}%`)) : undefined,
      ),
    )
    .orderBy(asc(products.nameRu))
    .limit(30);
}

export async function getHomeCollections(): Promise<Record<HomeCollectionKind, PublicProduct[]>> {
  const db = await getDb();
  const rows = await db
    .select({ collection: homeCollectionItems.collection, slug: products.slug })
    .from(homeCollectionItems)
    .innerJoin(products, eq(homeCollectionItems.productId, products.id))
    .where(
      and(eq(products.status, "PUBLISHED"), sql`${products.categoryId} in (${visibleCategoryIds})`),
    )
    .orderBy(asc(homeCollectionItems.position));
  const result: Record<HomeCollectionKind, PublicProduct[]> = { new: [], sale: [] };
  const details = await Promise.all(rows.map((row) => getPublicProduct(row.slug, false)));
  rows.forEach((row, index) => {
    const detail = details[index];
    const offer = detail?.offers[0];
    if (!detail || !offer || BigInt(offer.priceDirams) <= 0n) return;
    const kind = homeCollectionKind.safeParse(row.collection);
    if (!kind.success || result[kind.data].length >= 12) return;
    result[kind.data].push({
      id: detail.product.id,
      sku: detail.product.sku,
      slug: detail.product.slug,
      name: detail.product.nameRu,
      description: detail.product.descriptionRu,
      categoryId: detail.category.id,
      categorySlug: detail.category.slug,
      categoryName: detail.category.nameRu,
      brand: detail.product.brand,
      unit: detail.product.unit,
      priceDirams: offer.priceDirams,
      minOrderQty: offer.minOrderQty,
      stockQty: offer.stockQty,
      offerId: offer.id,
      offerCount: detail.offers.length,
      leadTimeDays: offer.leadTimeDays,
      keyAttributes: detail.attributes.slice(0, 3).map(({ name, value }) => ({ name, value })),
      imageUrl: detail.images[0] ? `/api/files/${detail.images[0].fileId}` : null,
    });
  });
  return result;
}
