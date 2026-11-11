import sharp from "sharp";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { files, productImages, products, supplierOffers, supplierUsers } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { writeAudit } from "@/modules/audit/service";
import { getStorage, newImageKey } from "@/server/storage";
import { ApiError } from "@/server/api-error";
import { visibleCategoryIds } from "./category-visibility";
export async function uploadProductImage(
  actor: SessionUser,
  productId: string,
  file: File,
  { ip, sendToModeration = false }: { ip?: string; sendToModeration?: boolean } = {},
) {
  if (!z.uuid().safeParse(productId).success)
    throw new ApiError(404, "not_found", "Товар не найден");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new ApiError(400, "invalid_file", "Разрешены JPEG, PNG и WebP");
  if (file.size <= 0 || file.size > 5 * 1024 * 1024)
    throw new ApiError(400, "invalid_file", "Файл должен быть не больше 5 МБ");
  const bytes = Buffer.from(await file.arrayBuffer());
  let optimized: Buffer;
  try {
    optimized = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError(400, "invalid_file", "Не удалось прочитать изображение");
  }
  const db = await getDb();
  const storage = getStorage();
  const key = newImageKey();
  let stored = false;
  try {
    return await db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, productId))
        .for("update");
      if (!product) throw new ApiError(404, "not_found", "Товар не найден");
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(productImages)
        .where(eq(productImages.productId, productId));
      if (count >= 10)
        throw new ApiError(409, "limit_reached", "Не больше 10 изображений на товар");
      if (sendToModeration) {
        await tx
          .update(products)
          .set({ status: "PENDING", updatedAt: new Date() })
          .where(eq(products.id, productId));
      }
      const [saved] = await tx
        .insert(files)
        .values({
          storageKey: key,
          mime: "image/webp",
          size: optimized.length,
          uploadedBy: actor.id,
        })
        .returning();
      const [image] = await tx
        .insert(productImages)
        .values({ productId, fileId: saved.id, sort: count })
        .returning();
      await writeAudit(tx, {
        actorUserId: actor.id,
        actorRole: actor.role,
        action: "catalog.product.image.upload",
        entity: "products",
        entityId: productId,
        data: { after: { fileId: saved.id } },
        ip,
      });
      stored = true;
      await storage.put(key, optimized);
      return { ...image, url: `/api/files/${saved.id}?preview=1` };
    });
  } catch (error) {
    if (stored) await storage.delete(key).catch(() => {});
    throw error;
  }
}

export async function readProductFile(fileId: string, previewActor?: SessionUser) {
  if (!z.uuid().safeParse(fileId).success) return null;

  let access = and(
    eq(products.status, "PUBLISHED"),
    sql`${products.categoryId} in (${visibleCategoryIds})`,
  );
  if (previewActor) {
    if (hasPermission(previewActor.role, "catalog:manage")) {
      access = undefined;
    } else if (hasPermission(previewActor.role, "seller:products")) {
      access = sql`exists (
        select 1 from ${supplierUsers}
        where ${supplierUsers.userId} = ${previewActor.id}
          and (
            ${supplierUsers.supplierId} = ${products.createdBySupplierId}
            or exists (
              select 1 from ${supplierOffers}
              where ${supplierOffers.productId} = ${products.id}
                and ${supplierOffers.supplierId} = ${supplierUsers.supplierId}
            )
          )
      )`;
    } else {
      return null;
    }
  }

  const db = await getDb();
  const [file] = await db
    .select({ storageKey: files.storageKey, mime: files.mime })
    .from(files)
    .innerJoin(productImages, eq(productImages.fileId, files.id))
    .innerJoin(products, eq(products.id, productImages.productId))
    .where(and(eq(files.id, fileId), access))
    .limit(1);
  if (!file) return null;
  return { mime: file.mime, data: await getStorage().get(file.storageKey) };
}
