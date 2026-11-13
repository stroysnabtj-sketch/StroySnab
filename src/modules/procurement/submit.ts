import { enqueueQuotationJob } from "./ai-jobs";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { procurementRequests, procurementAttachments } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { nextDocNumber } from "@/modules/system/doc-number";
import { normalizePhone } from "@/modules/system/phone";
import { quantityMillis } from "@/modules/pricing/order-markup";
import { writeAudit } from "@/modules/audit/service";
import { ApiError } from "@/server/api-error";
import { getStorage } from "@/server/storage";
import { validateListFile } from "./files";

const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const inputSchema = z.object({
  submissionKey: z.string().uuid(),
  autoPrepare: z.boolean().default(false),
  accessToken: z
    .string()
    .regex(/^[A-Za-z0-9_-]{32,128}$/)
    .optional(),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().min(8).max(30),
  contactEmail: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  note: z.string().trim().max(5000).optional(),
  lines: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(300),
        qty: z
          .string()
          .trim()
          .transform((value) => value.replace(",", ".")),
        unit: z.string().trim().max(30).default(""),
      }),
    )
    .max(200)
    .default([]),
});

/** Files and request metadata become visible together. Guest tokens are never persisted in plaintext. */
export async function submitProcurementRequest(
  input: unknown,
  files: File[],
  actor: SessionUser | null,
) {
  const data = inputSchema.parse(input);
  if (files.length > 5) throw new ApiError(400, "file_limit", "Не более пяти вложений");
  if (!files.length && !data.lines.length)
    throw new ApiError(400, "empty_request", "Добавьте материалы или прикрепите список");
  if (
    data.autoPrepare &&
    (!actor || actor.role !== "CUSTOMER" || !files.length || data.lines.length)
  )
    throw new ApiError(400, "invalid_ai_request", "Прикрепите файл для автоматической подготовки");
  if (data.autoPrepare && !data.contactEmail?.trim())
    throw new ApiError(400, "email_required", "Укажите e-mail для отправки КП");
  const customerId = actor?.role === "CUSTOMER" ? actor.id : null;
  if (!customerId && !data.accessToken)
    throw new ApiError(400, "missing_access", "Обновите страницу и отправьте заявку снова");
  const lines = data.lines.map((line) => {
    const value = quantityMillis(line.qty);
    return { ...line, qty: `${value / 1000n}.${(value % 1000n).toString().padStart(3, "0")}` };
  });
  const valid: (Awaited<ReturnType<typeof validateListFile>> & { name: string; size: number })[] =
    [];
  for (const file of files) {
    const checked = await validateListFile(file);
    valid.push({
      ...checked,
      name: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 200),
      size: file.size,
    });
  }
  const normalized = {
    contactName: data.contactName,
    contactPhone: normalizePhone(data.contactPhone),
    contactEmail: data.contactEmail?.trim() || null,
    note: data.note || null,
    lines,
  };
  const digest = hash(
    JSON.stringify({
      ...normalized,
      autoPrepare: data.autoPrepare,
      files: valid.map((file) => ({
        name: file.name,
        mime: file.mime,
        size: file.size,
        hash: hash(file.bytes),
      })),
    }),
  );
  const db = await getDb(),
    storage = getStorage(),
    written: string[] = [];
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${data.submissionKey}))`);
      const [existing] = await tx
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.submissionKey, data.submissionKey))
        .limit(1);
      if (existing) {
        const owns = customerId
          ? existing.userId === customerId
          : existing.userId === null && existing.guestTokenHash === hash(data.accessToken!);
        if (!owns || existing.submissionDigest !== digest)
          throw new ApiError(
            409,
            "submission_conflict",
            "Состав заявки изменился. Отправьте её как новую заявку",
          );
        return {
          id: existing.id,
          number: existing.number,
          accessToken: existing.guestTokenHash ? data.accessToken : undefined,
        };
      }
      const [record] = await tx
        .insert(procurementRequests)
        .values({
          ...normalized,
          title: (lines.length
            ? lines
                .map((line) => line.name)
                .slice(0, 3)
                .join(", ")
            : valid[0].name
          ).slice(0, 200),
          number: await nextDocNumber(tx, "RFQ"),
          userId: customerId,
          guestTokenHash: customerId ? null : hash(data.accessToken!),
          submissionKey: data.submissionKey,
          submissionDigest: digest,
        })
        .returning();
      for (const file of valid) {
        const key = `procurement/${record.id}/${randomUUID()}.${file.ext}`;
        written.push(key);
        await storage.put(key, file.bytes);
        await tx.insert(procurementAttachments).values({
          requestId: record.id,
          storageKey: key,
          name: file.name,
          mime: file.mime,
          size: file.size,
        });
      }
      if (data.autoPrepare) await enqueueQuotationJob(tx, record.id, actor!.id);
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
        accessToken: record.guestTokenHash ? data.accessToken : undefined,
      };
    });
  } catch (error) {
    await Promise.allSettled(written.map((key) => storage.delete(key)));
    throw error;
  }
}
