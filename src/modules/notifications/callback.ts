import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { AppDatabase } from "@/db";
import { auditLog } from "@/db/schema";
import { notificationAttempts, notificationOutbox } from "@/db/schema/notifications";
import { ApiError } from "@/server/api-error";

const bodyLimit = 4096;
const timestampSkewSeconds = 300;
const deliveryFailed = "provider_delivery_failed";
const receiptSchema = z.strictObject({
  messageId: z.string().min(1).max(200),
  status: z.enum(["DELIVERED", "FAILED"]),
});
type DeliveryReceipt = z.infer<typeof receiptSchema> & { receiptId: string };

async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > bodyLimit)
    throw new ApiError(413, "too_large", "Запрос слишком большой");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > bodyLimit) {
        void reader.cancel().catch(() => {});
        throw new ApiError(413, "too_large", "Запрос слишком большой");
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

export async function readSignedDeliveryReceipt(request: Request): Promise<DeliveryReceipt> {
  const secret = process.env.NOTIFICATIONS_SMS_CALLBACK_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new ApiError(503, "callback_disabled", "Подтверждения SMS не подключены");
  if (new URL(request.url).protocol !== "https:")
    throw new ApiError(403, "https_required", "Требуется HTTPS");
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  )
    throw new ApiError(415, "json_required", "Требуется JSON");

  const timestamp = request.headers.get("x-sms-timestamp") ?? "";
  const signature = request.headers.get("x-sms-signature") ?? "";
  const now = Math.floor(Date.now() / 1000);
  const invalidSignature = new ApiError(401, "invalid_signature", "Подпись не подтверждена");
  if (
    !/^\d{10}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > timestampSkewSeconds ||
    !/^[a-f\d]{64}$/i.test(signature)
  )
    throw invalidSignature;

  const body = await readBody(request);
  const signedPrefix = `${timestamp}.`;
  const expected = createHmac("sha256", secret).update(signedPrefix).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw invalidSignature;

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new ApiError(400, "invalid_callback", "Некорректное подтверждение SMS");
  }
  const receipt = receiptSchema.safeParse(payload);
  if (!receipt.success)
    throw new ApiError(400, "invalid_callback", "Некорректное подтверждение SMS");

  // A deterministic audit ID remembers a signed receipt even after a staff retry.
  const digest = createHash("sha256")
    .update("sms-delivery:")
    .update(signedPrefix)
    .update(body)
    .digest("hex");
  const receiptId = [
    digest.slice(0, 8),
    digest.slice(8, 12),
    digest.slice(12, 16),
    digest.slice(16, 20),
    digest.slice(20, 32),
  ].join("-");
  return { ...receipt.data, receiptId };
}

export async function applyDeliveryReceipt(db: AppDatabase, receipt: DeliveryReceipt) {
  return db.transaction(async (tx) => {
    const [row, ambiguous] = await tx
      .select({
        id: notificationOutbox.id,
        state: notificationOutbox.state,
        lastError: notificationOutbox.lastError,
        acceptedAt: notificationOutbox.acceptedAt,
      })
      .from(notificationOutbox)
      .where(
        and(
          eq(notificationOutbox.channel, "sms"),
          eq(notificationOutbox.providerMessageId, receipt.messageId),
        ),
      )
      .limit(2)
      .for("update");
    // Providers can send a receipt before the worker commits acceptance. Ask them to retry.
    if (!row?.acceptedAt || ambiguous || row.state === "queued") return false;
    if (row.state === "delivered") return true;
    const priorDeliveryFailure = row.state === "failed" && row.lastError === deliveryFailed;
    if (row.state !== "accepted" && !priorDeliveryFailure) return true;

    const [receiptRecorded] = await tx
      .insert(auditLog)
      .values({
        id: receipt.receiptId,
        action: "notification.delivery_receipt",
        entity: "notification",
        entityId: row.id,
        data: { status: receipt.status },
      })
      .onConflictDoNothing({ target: auditLog.id })
      .returning({ id: auditLog.id });
    if (!receiptRecorded || (priorDeliveryFailure && receipt.status === "FAILED")) return true;

    const delivered = receipt.status === "DELIVERED";
    const state = delivered ? "delivered" : "failed";
    const error = delivered ? null : deliveryFailed;
    await tx
      .update(notificationOutbox)
      .set({
        state,
        lastError: error,
        deliveredAt: delivered ? new Date() : null,
      })
      .where(eq(notificationOutbox.id, row.id));

    // Preserve the send completion time so later receipts can identify the same attempt.
    const [attempt, ambiguousAttempt] = await tx
      .select({ id: notificationAttempts.id })
      .from(notificationAttempts)
      .where(
        and(
          eq(notificationAttempts.notificationId, row.id),
          eq(notificationAttempts.finishedAt, row.acceptedAt),
          eq(notificationAttempts.state, row.state),
          priorDeliveryFailure ? eq(notificationAttempts.error, deliveryFailed) : undefined,
        ),
      )
      .limit(2);
    if (attempt && !ambiguousAttempt)
      await tx
        .update(notificationAttempts)
        .set({ state, error })
        .where(eq(notificationAttempts.id, attempt.id));
    return true;
  });
}
