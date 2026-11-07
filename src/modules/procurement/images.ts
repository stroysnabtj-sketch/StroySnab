import { z } from "zod";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { procurementRequests, quotationImages } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { getStorage } from "@/server/storage";
import type { SessionUser } from "@/modules/auth/session";
import { getProcurementRequest, procurementManager } from "./service";
export async function uploadQuotationImage(id: string, actor: SessionUser, file: File) {
  if (!procurementManager(actor)) throw new ApiError(403, "forbidden", "Недостаточно прав");
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "not_found", "Заявка не найдена");
  await getProcurementRequest(id, actor, null);
  if (file.size < 1 || file.size > 5 * 1024 * 1024)
    throw new ApiError(400, "file_size", "Фото должно быть не больше 5 МБ");
  let bytes: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer()),
      meta = await sharp(input, { limitInputPixels: 40000000 }).metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || "")) throw new Error("format");
    bytes = await sharp(input, { limitInputPixels: 40000000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError(400, "invalid_image", "Выберите фотографию JPEG, PNG или WebP");
  }
  const key = `quotation/${id}/${randomUUID()}.webp`,
    db = await getDb();
  let stored = false;
  try {
    return await db.transaction(async (tx) => {
      const [request] = await tx
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.id, id))
        .for("update");
      if (!request || ["ACCEPTED", "COMPLETED", "CANCELLED", "REJECTED"].includes(request.status))
        throw new ApiError(409, "closed", "Заявка закрыта");
      const count = await tx
        .select({ id: quotationImages.id })
        .from(quotationImages)
        .where(eq(quotationImages.requestId, id));
      if (count.length >= 100)
        throw new ApiError(400, "image_limit", "Достигнут лимит фотографий заявки");
      await getStorage().put(key, bytes);
      stored = true;
      const [image] = await tx
        .insert(quotationImages)
        .values({ requestId: id, storageKey: key, mime: "image/webp", size: bytes.length })
        .returning({ id: quotationImages.id });
      return image;
    });
  } catch (e) {
    if (stored)
      await getStorage()
        .delete(key)
        .catch(() => {});
    throw e;
  }
}
export async function readQuotationImage(
  id: string,
  imageId: string,
  actor: SessionUser | null,
  token: string | null,
) {
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(imageId).success)
    throw new ApiError(404, "not_found", "Изображение не найдено");
  const data = await getProcurementRequest(id, actor, token);
  if (
    !procurementManager(actor) &&
    (!data.quotation || !data.quotation.lines.some((line) => line.imageIds?.includes(imageId)))
  )
    throw new ApiError(404, "not_found", "Изображение не найдено");
  const [image] = await (
    await getDb()
  )
    .select()
    .from(quotationImages)
    .where(and(eq(quotationImages.id, imageId), eq(quotationImages.requestId, id)));
  if (!image) throw new ApiError(404, "not_found", "Изображение не найдено");
  return { bytes: await getStorage().get(image.storageKey), mime: image.mime };
}
