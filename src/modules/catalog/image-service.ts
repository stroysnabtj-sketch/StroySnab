import sharp from "sharp";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { files, productImages, products } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { getStorage, newImageKey } from "@/server/storage";
import { ApiError } from "@/server/api-error";
export async function uploadProductImage(actor: SessionUser, productId: string, file: File, ip?: string) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new ApiError(400, "invalid_file", "Разрешены JPEG, PNG и WebP");
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) throw new ApiError(400, "invalid_file", "Файл должен быть не больше 5 МБ");
  const db = await getDb(); const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1); if (!product) throw new ApiError(404, "not_found", "Товар не найден");
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(productImages).where(eq(productImages.productId, productId)); if (count >= 10) throw new ApiError(409, "limit_reached", "Не больше 10 изображений на товар");
  const bytes = Buffer.from(await file.arrayBuffer()); let optimized: Buffer;
  try { optimized = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(); } catch { throw new ApiError(400, "invalid_file", "Не удалось прочитать изображение"); }
  const key = newImageKey(); await getStorage().put(key, optimized);
  return db.transaction(async (tx) => { const [saved] = await tx.insert(files).values({ storageKey: key, mime: "image/webp", size: optimized.length, uploadedBy: actor.id }).returning(); const [image] = await tx.insert(productImages).values({ productId, fileId: saved.id, sort: count }).returning(); await writeAudit(tx, { actorUserId: actor.id, actorRole: actor.role, action: "catalog.product.image.upload", entity: "products", entityId: productId, data: { after: { fileId: saved.id } }, ip }); return { ...image, url: `/api/files/${saved.id}` }; });
}
export async function readPublicFile(fileId: string) { const db = await getDb(); const [row] = await db.select({ file: files }).from(files).innerJoin(productImages, eq(productImages.fileId, files.id)).where(and(eq(files.id, fileId))).limit(1); if (!row) return null; return { ...row.file, data: await getStorage().get(row.file.storageKey) }; }
