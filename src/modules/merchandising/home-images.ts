import sharp from "sharp";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { files } from "@/db/schema";
import { getStorage, newImageKey } from "@/server/storage";
import { ApiError } from "@/server/api-error";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { getHomeContent } from "./home-content-service";

export async function uploadHomeImage(actor: SessionUser, file: File) {
  if (!hasPermission(actor.role, "catalog:manage"))
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size <= 0 ||
    file.size > 5 * 1024 * 1024
  )
    throw new ApiError(400, "invalid_file", "Выберите JPEG, PNG или WebP до 5 МБ");
  let bytes: Buffer;
  try {
    bytes = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new ApiError(400, "invalid_file", "Не удалось прочитать изображение");
  }
  const db = await getDb();
  const storage = getStorage();
  const key = newImageKey().replace("products/", "homepage/");
  await storage.put(key, bytes);
  try {
    const [fileRow] = await db
      .insert(files)
      .values({ storageKey: key, mime: "image/webp", size: bytes.length, uploadedBy: actor.id })
      .returning({ id: files.id });
    return { url: `/api/home-images/${fileRow.id}` };
  } catch (error) {
    await storage.delete(key).catch(() => {});
    throw error;
  }
}
export async function readHomeImage(id: string, actor?: SessionUser | null) {
  if (!z.uuid().safeParse(id).success) return null;
  const content = await getHomeContent();
  const url = `/api/home-images/${id}`;
  const published =
    content.hero.image === url ||
    content.hero.mobileImage === url ||
    content.ads.some((ad) => ad.active && (ad.image === url || ad.mobileImage === url));
  if (!published && !(actor && hasPermission(actor.role, "catalog:manage"))) return null;
  const db = await getDb();
  const [file] = await db.select().from(files).where(eq(files.id, id));
  if (!file || !file.storageKey.startsWith("homepage/")) return null;
  return { data: await getStorage().get(file.storageKey), mime: file.mime };
}
