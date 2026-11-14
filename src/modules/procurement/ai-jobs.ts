import { publicProductText } from "@/modules/catalog/public-text";
import { enqueueQuotationResultEmail } from "@/modules/notifications/events";
import { randomUUID } from "node:crypto";
import { and, eq, lt, or, sql } from "drizzle-orm";
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

export async function enqueueQuotationJob(tx: DbTransaction, requestId: string) {
  if (!configuredDocumentProvider())
    throw new ApiError(503, "ai_unavailable", "Автоматическая подготовка временно недоступна");
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
    const allocated = new Map<string, number>();
    for (const line of extracted) {
      if (!line.qty || !line.unit) {
        lines.push({ ...line, issue: "Уточните количество или единицу" });
        continue;
      }
      const prepared = await prepareQuotationCandidates(claim.requestId, manager, [line]);
      const matches = prepared.lines[0].candidates
        .filter(
          (c) =>
            c.score >= 70 &&
            c.unitMatches &&
            c.enoughStock &&
            c.minimumMet &&
            Math.round((Number(c.stockQty) - Number(c.reservedQty)) * 1000) >=
              (allocated.get(c.offerId) ?? 0) + Math.round(Number(line.qty) * 1000),
        )
        .sort(
          (a, b) =>
            b.score - a.score || (BigInt(a.basePriceDirams) < BigInt(b.basePriceDirams) ? -1 : 1),
        );
      if (!matches.length) {
        lines.push({ ...line, issue: "Подходящий товар не найден" });
        continue;
      }
      const selected = matches[0];
      allocated.set(
        selected.offerId,
        (allocated.get(selected.offerId) ?? 0) + Math.round(Number(line.qty) * 1000),
      );
      const alternative =
        !selected.exact ||
        new Set(matches.filter((c) => c.score === selected.score).map((c) => c.sku)).size > 1;
      lines.push({
        ...line,
        name: publicProductText(selected.productName),
        unit: selected.unit,
        requestedName: line.name,
        matchScore: selected.score,
        alternative,
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
    const priced = lines.filter((l) => l.offerId && !l.issue);
    if (priced.length) {
      try {
        const unresolved = lines.filter((l) => !l.offerId || l.issue);
        const conditions = [
          ...(unresolved.length
            ? [
                `Не включены в стоимость (${unresolved.length}): ${unresolved
                  .slice(0, 20)
                  .map((l) => publicProductText(l.name))
                  .join("; ")}. Полный список — в заявке.`,
              ]
            : []),
          ...lines
            .filter((l) => l.alternative)
            .map((l) => `Альтернатива: ${publicProductText(l.requestedName ?? "")} → ${l.name}.`),
          ...warnings.map((w) => `Примечание: ${w}`),
        ]
          .join("\n")
          .slice(0, 5000);
        await saveQuotation(
          claim.requestId,
          manager,
          {
            version: 0,
            send: true,
            validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
            deliveryDirams: "0",
            conditions,
            lines: priced.map((l) => ({
              name: (l.alternative ? `Альтернатива: ${l.name}` : l.name).slice(0, 300),
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
        // Preserve concurrent manager changes; explain an unavailable calculation without inventing prices.
        await db.transaction(async (tx) => {
          const [current] = await tx
            .select()
            .from(procurementRequests)
            .where(eq(procurementRequests.id, claim.requestId))
            .for("update");
          const [quote] = await tx
            .select({ id: quotations.id })
            .from(quotations)
            .where(eq(quotations.requestId, claim.requestId));
          if (
            !quote &&
            current.status === "IN_REVIEW" &&
            current.updatedAt.getTime() === requestUpdatedAt.getTime()
          )
            await enqueueQuotationResultEmail(tx, claim.requestId, current.contactEmail, claim.id);
        });
      }
    } else {
      await db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(procurementRequests)
          .where(eq(procurementRequests.id, claim.requestId))
          .for("update");
        if (
          current.status === "IN_REVIEW" &&
          current.updatedAt.getTime() === requestUpdatedAt.getTime()
        )
          await enqueueQuotationResultEmail(tx, claim.requestId, current.contactEmail, claim.id);
      });
    }
    return true;
  } catch {
    await db.transaction(async (tx) => {
      const [request] = await tx
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.id, claim.requestId))
        .for("update");
      const [failed] = await tx
        .update(quotationJobs)
        .set({
          state: "failed",
          error: "preparation_failed",
          leaseUntil: null,
          claimToken: null,
          updatedAt: new Date(),
        })
        .where(and(eq(quotationJobs.id, claim.id), eq(quotationJobs.claimToken, claim.claimToken!)))
        .returning({ id: quotationJobs.id });
      const [quote] = await tx
        .select({ id: quotations.id })
        .from(quotations)
        .where(eq(quotations.requestId, claim.requestId));
      if (failed && request && !quote && ["NEW", "IN_REVIEW"].includes(request.status))
        await enqueueQuotationResultEmail(tx, request.id, request.contactEmail, claim.id);
    });
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
