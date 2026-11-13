import { randomUUID } from "node:crypto";
import { and, eq, gte, lt, or, sql } from "drizzle-orm";
import { getDb, type DbTransaction } from "@/db";
import {
  procurementRequests,
  procurementAttachments,
  quotationJobs,
  quotations,
  users,
  type PreparedLine,
} from "@/db/schema";
import { getStorage } from "@/server/storage";
import { ApiError } from "@/server/api-error";
import { configuredDocumentProvider } from "./deepseek";
import type { MaterialDocumentProvider } from "./documents";
import { prepareQuotationCandidates } from "./preparation";
import { saveQuotation } from "./service";
import type { SessionUser } from "@/modules/auth/session";

export async function enqueueQuotationJob(tx: DbTransaction, requestId: string, userId: string) {
  if (!configuredDocumentProvider())
    throw new ApiError(503, "ai_unavailable", "Автоматическая подготовка временно недоступна");
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('quotation-ai-budget'))`);
  const since = new Date(Date.now() - 86400000);
  const [{ total }] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(quotationJobs)
    .where(gte(quotationJobs.createdAt, since));
  const [{ own }] = await tx
    .select({ own: sql<number>`count(*)::int` })
    .from(quotationJobs)
    .innerJoin(procurementRequests, eq(procurementRequests.id, quotationJobs.requestId))
    .where(and(eq(procurementRequests.userId, userId), gte(quotationJobs.createdAt, since)));
  const limit = Math.min(100, Math.max(1, Number(process.env.AI_QUOTATION_DAILY_LIMIT || 20)));
  if (!Number.isSafeInteger(limit) || total >= limit || own >= 3)
    throw new ApiError(
      429,
      "ai_limit",
      "Лимит автоматической подготовки исчерпан. Отправьте заявку менеджеру.",
    );
  await tx.insert(quotationJobs).values({ requestId }).onConflictDoNothing();
}

export async function processQuotationJob(
  provider: MaterialDocumentProvider | null = configuredDocumentProvider(),
) {
  if (!provider) return false;
  const db = await getDb();
  const claim = await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(quotationJobs)
      .where(
        or(
          eq(quotationJobs.state, "queued"),
          and(eq(quotationJobs.state, "processing"), lt(quotationJobs.leaseUntil, new Date())),
        ),
      )
      .orderBy(quotationJobs.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!job) return null;
    // Expired claims go to manual review: do not repeat potentially billed uploads after a crash.
    if (job.state === "processing" || job.attempts >= 2) {
      await tx
        .update(quotationJobs)
        .set({
          state: "failed",
          error: "processing_interrupted",
          leaseUntil: null,
          claimToken: null,
          updatedAt: new Date(),
        })
        .where(eq(quotationJobs.id, job.id));
      return null;
    }
    const [claimed] = await tx
      .update(quotationJobs)
      .set({
        state: "processing",
        attempts: job.attempts + 1,
        claimToken: randomUUID(),
        leaseUntil: new Date(Date.now() + 15 * 60000),
        updatedAt: new Date(),
      })
      .where(eq(quotationJobs.id, job.id))
      .returning();
    return claimed;
  });
  if (!claim) return false;
  const warnings: string[] = [];
  try {
    const [request] = await db
      .select()
      .from(procurementRequests)
      .where(eq(procurementRequests.id, claim.requestId));
    const [admin] = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "SUPER_ADMIN"), eq(users.status, "ACTIVE")))
      .limit(1);
    if (!request || !admin || !["NEW", "IN_REVIEW"].includes(request.status))
      throw new Error("request_changed");
    const attachments = await db
      .select()
      .from(procurementAttachments)
      .where(eq(procurementAttachments.requestId, claim.requestId));
    const extracted: PreparedLine[] = [];
    const signal = AbortSignal.timeout(10 * 60000);
    for (const file of attachments) {
      const bytes = await getStorage().get(file.storageKey);
      if (bytes.length !== file.size || bytes.length > 10 * 1024 * 1024)
        throw new Error("file_changed");
      const result = await provider.extract(
        { bytes, mime: file.mime, filename: file.name },
        signal,
      );
      extracted.push(...result.lines);
      warnings.push(...result.warnings);
      if (extracted.length > 200) throw new Error("too_many_lines");
    }
    if (!extracted.length) throw new Error("empty_extraction");
    const manager = { ...admin, role: "SUPER_ADMIN" } as SessionUser;
    const lines: PreparedLine[] = [];
    for (const line of extracted) {
      if (!line.qty || !line.unit) {
        lines.push({ ...line, issue: "Уточните количество или единицу" });
        continue;
      }
      const prepared = await prepareQuotationCandidates(claim.requestId, manager, [line]);
      const exact = prepared.lines[0].candidates.filter(
        (c) => c.exact && c.unitMatches && c.enoughStock && c.minimumMet,
      );
      // Several offers of the same product are internal procurement alternatives; different products require review.
      const names = new Set(exact.map((c) => c.sku));
      if (names.size !== 1) {
        lines.push({
          ...line,
          issue: exact.length ? "Несколько подходящих товаров" : "Нужен подбор менеджером",
        });
        continue;
      }
      const selected = exact.sort((a, b) =>
        BigInt(a.basePriceDirams) < BigInt(b.basePriceDirams) ? -1 : 1,
      )[0];
      lines.push({
        ...line,
        name: selected.productName,
        offerId: selected.offerId,
        basePriceDirams: selected.basePriceDirams,
        markupPercent: selected.markupPercent,
      });
    }
    const requestUpdatedAt = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from procurement_requests where id=${claim.requestId}::uuid for update`,
      );
      const [owned] = await tx
        .select()
        .from(quotationJobs)
        .where(and(eq(quotationJobs.id, claim.id), eq(quotationJobs.claimToken, claim.claimToken!)))
        .for("update");
      if (
        !owned ||
        owned.state !== "processing" ||
        !owned.leaseUntil ||
        owned.leaseUntil <= new Date()
      )
        throw new Error("claim_expired");
      const [current] = await tx
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.id, claim.requestId));
      const [existingQuote] = await tx
        .select({ id: quotations.id })
        .from(quotations)
        .where(eq(quotations.requestId, claim.requestId));
      if (existingQuote || !["NEW", "IN_REVIEW"].includes(current.status) || current.lines.length)
        throw new Error("manager_changed_request");
      const updatedAt = new Date();
      await tx
        .update(procurementRequests)
        .set({
          lines: extracted.map(({ name, qty, unit }) => ({ name, qty, unit })),
          status: "IN_REVIEW",
          updatedAt,
        })
        .where(eq(procurementRequests.id, claim.requestId));
      await tx
        .update(quotationJobs)
        .set({
          lines,
          warnings: warnings.slice(0, 30),
          state: "review",
          leaseUntil: null,
          claimToken: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(quotationJobs.id, claim.id), eq(quotationJobs.claimToken, claim.claimToken!)),
        );
      return updatedAt;
    });
    if (lines.every((l) => l.offerId && !l.issue) && !warnings.length) {
      try {
        await saveQuotation(
          claim.requestId,
          manager,
          {
            version: 0,
            send: false,
            validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
            deliveryDirams: "0",
            conditions: "",
            lines: lines.map((l) => ({
              name: l.name,
              qty: l.qty,
              unit: l.unit,
              offerId: l.offerId,
              basePriceDirams: l.basePriceDirams,
            })),
          },
          { jobId: claim.id, requestUpdatedAt },
        );
        await db
          .update(quotationJobs)
          .set({ state: "ready", updatedAt: new Date() })
          .where(eq(quotationJobs.id, claim.id));
      } catch {
        /* Keep suggestions if a manager saved a version or stock changed during preparation. */
      }
    }
    return true;
  } catch {
    await db
      .update(quotationJobs)
      .set({
        state: "failed",
        error: "preparation_failed",
        leaseUntil: null,
        claimToken: null,
        updatedAt: new Date(),
      })
      .where(and(eq(quotationJobs.id, claim.id), eq(quotationJobs.claimToken, claim.claimToken!)));
    return true;
  }
}

export async function retryQuotationJob(id: string, actor: SessionUser) {
  if (!["SUPER_ADMIN", "ADMIN", "SALES_MANAGER"].includes(actor.role))
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select id from procurement_requests where id=${id}::uuid for update`);
    const [request] = await tx
      .select()
      .from(procurementRequests)
      .where(eq(procurementRequests.id, id));
    const [job] = await tx
      .select()
      .from(quotationJobs)
      .where(eq(quotationJobs.requestId, id))
      .for("update");
    const [quote] = await tx
      .select({ id: quotations.id })
      .from(quotations)
      .where(eq(quotations.requestId, id));
    if (!request || !job) throw new ApiError(404, "not_found", "Задание не найдено");
    if (
      job.state !== "failed" ||
      job.attempts >= 2 ||
      quote ||
      request.lines.length ||
      !["NEW", "IN_REVIEW"].includes(request.status)
    )
      throw new ApiError(409, "retry_unavailable", "Продолжите подготовку вручную");
    await tx
      .update(quotationJobs)
      .set({ state: "queued", error: null, updatedAt: new Date() })
      .where(eq(quotationJobs.id, job.id));
    return { ok: true };
  });
}
