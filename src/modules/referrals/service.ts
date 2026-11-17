import { randomBytes } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { getDb, type DbExecutor, type DbTransaction } from "@/db";
import { customers, users, referralBonuses, settings } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { publicSiteOrigin } from "@/modules/system/site-url";
import { writeAudit } from "@/modules/audit/service";
import type { Role } from "@/modules/rbac/permissions";

export const REFERRAL_COOKIE = "stroysnab_ref";
export const REFERRAL_BONUS_SETTING_KEY = "referral_bonus_percent";
export const DEFAULT_REFERRAL_BONUS_PERCENT = "2";

export function normalizeReferralBonusPercent(input: unknown): string {
  const raw =
    typeof input === "number"
      ? String(input)
      : typeof input === "string"
        ? input.trim().replace(",", ".")
        : "";
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(raw)) {
    throw new ApiError(400, "invalid_bonus_percent", "Укажите процент от 0 до 100");
  }
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0 || num > 100) {
    throw new ApiError(400, "invalid_bonus_percent", "Процент бонуса должен быть от 0 до 100");
  }
  const [wholeStr, fracStr = ""] = raw.split(".");
  const whole = String(Number(wholeStr));
  const frac = fracStr.replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export const referralBonusInputSchema = z.object({
  bonusPercent: z.union([z.string(), z.number()]).transform(normalizeReferralBonusPercent),
});

export function referralBonusBasisPoints(percent: string): bigint {
  const normalized = normalizeReferralBonusPercent(percent);
  const [wholeStr, fracStr = ""] = normalized.split(".");
  return BigInt(wholeStr) * 100n + BigInt(fracStr.padEnd(2, "0"));
}

export function calculateReferralBonusDirams(
  materialsTotalDirams: string | bigint,
  percent: string,
): bigint {
  const base = BigInt(materialsTotalDirams);
  const bps = referralBonusBasisPoints(percent);
  if (base <= 0n || bps <= 0n) return 0n;
  return (base * bps + 5000n) / 10000n;
}

export async function getReferralBonusPercent(executor?: DbExecutor): Promise<string> {
  const db = executor ?? (await getDb());
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, REFERRAL_BONUS_SETTING_KEY))
    .limit(1);
  if (!row) return DEFAULT_REFERRAL_BONUS_PERCENT;
  const candidate =
    typeof row.value === "object" && row.value !== null && "percent" in row.value
      ? (row.value as { percent?: unknown }).percent
      : row.value;
  try {
    return normalizeReferralBonusPercent(candidate);
  } catch {
    return DEFAULT_REFERRAL_BONUS_PERCENT;
  }
}

export async function updateReferralBonusPercent(
  actor: { id: string; role: Role },
  input: unknown,
  ip?: string,
) {
  const { bonusPercent } = referralBonusInputSchema.parse(input);
  const db = await getDb();
  await db.transaction(async (tx) => {
    const before = await getReferralBonusPercent(tx);
    await tx
      .insert(settings)
      .values({
        key: REFERRAL_BONUS_SETTING_KEY,
        value: { percent: bonusPercent },
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: { percent: bonusPercent }, updatedAt: new Date() },
      });
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "referral.bonus_percent_updated",
      entity: "settings",
      entityId: REFERRAL_BONUS_SETTING_KEY,
      data: { before, after: bonusPercent },
      ip,
    });
  });
  return { bonusPercent };
}

export async function creditReferralBonusForOrder(
  tx: DbTransaction,
  input: {
    orderId: string;
    orderNumber: string;
    customerId: string | null;
    materialsTotalDirams: string | bigint;
    actorUserId: string;
    actorRole: Role;
  },
) {
  if (!input.customerId) return null;
  const [pending] = await tx
    .select()
    .from(referralBonuses)
    .where(
      and(
        eq(referralBonuses.referredCustomerId, input.customerId),
        eq(referralBonuses.status, "PENDING"),
      ),
    )
    .limit(1)
    .for("update");
  if (!pending) return null;

  const percent = await getReferralBonusPercent(tx);
  const bps = referralBonusBasisPoints(percent);
  if (bps <= 0n) return null;

  const bonusAmountDirams = calculateReferralBonusDirams(input.materialsTotalDirams, percent);
  const [updated] = await tx
    .update(referralBonuses)
    .set({
      status: "CREDITED",
      bonusAmountDirams,
    })
    .where(and(eq(referralBonuses.id, pending.id), eq(referralBonuses.status, "PENDING")))
    .returning();
  if (!updated) return null;

  await writeAudit(tx, {
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: "referral.bonus_credited",
    entity: "referral_bonus",
    entityId: updated.id,
    data: {
      referrerCustomerId: updated.referrerCustomerId,
      referredCustomerId: updated.referredCustomerId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      percent,
      baseDirams: String(input.materialsTotalDirams),
      bonusAmountDirams: bonusAmountDirams.toString(),
    },
  });

  return {
    bonusId: updated.id,
    referrerCustomerId: updated.referrerCustomerId,
    bonusAmountDirams: bonusAmountDirams.toString(),
    percent,
  };
}

export async function listAdminReferrals() {
  const db = await getDb();
  const bonusPercent = await getReferralBonusPercent(db);
  const [summaryRow] = await db
    .select({
      invitedTotal: sql<number>`count(*)::int`,
      pendingCount: sql<number>`count(*) filter (where ${referralBonuses.status} = 'PENDING')::int`,
      creditedCount: sql<number>`count(*) filter (where ${referralBonuses.status} = 'CREDITED')::int`,
      creditedDirams: sql<string>`coalesce(sum(${referralBonuses.bonusAmountDirams}) filter (where ${referralBonuses.status} = 'CREDITED'), 0)::text`,
    })
    .from(referralBonuses);

  const referrer = alias(customers, "referrer");
  const referred = alias(customers, "referred");
  const referrerUser = alias(users, "referrer_user");
  const referredUser = alias(users, "referred_user");

  const items = await db
    .select({
      id: referralBonuses.id,
      status: referralBonuses.status,
      bonusAmountDirams: referralBonuses.bonusAmountDirams,
      createdAt: referralBonuses.createdAt,
      referrerName: referrer.fullName,
      referrerPhone: referrerUser.phone,
      referredName: referred.fullName,
      referredPhone: referredUser.phone,
    })
    .from(referralBonuses)
    .innerJoin(referrer, eq(referrer.id, referralBonuses.referrerCustomerId))
    .innerJoin(referred, eq(referred.id, referralBonuses.referredCustomerId))
    .leftJoin(referrerUser, eq(referrerUser.id, referrer.userId))
    .leftJoin(referredUser, eq(referredUser.id, referred.userId))
    .orderBy(desc(referralBonuses.createdAt))
    .limit(100);

  return {
    bonusPercent,
    summary: {
      invitedTotal: summaryRow?.invitedTotal ?? 0,
      pendingCount: summaryRow?.pendingCount ?? 0,
      creditedCount: summaryRow?.creditedCount ?? 0,
      creditedDirams: summaryRow?.creditedDirams ?? "0",
    },
    items: items.map((row) => ({
      ...row,
      bonusAmountDirams: row.bonusAmountDirams !== null ? row.bonusAmountDirams.toString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-F0-9]{8}$/.test(code) ? code : null;
}
export async function getReferralSummary(userId: string) {
  const db = await getDb();
  let customerId = "",
    code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await db.transaction(async (tx) => {
        const [owner] = await tx
          .select({ customer: customers })
          .from(customers)
          .innerJoin(users, eq(users.id, customers.userId))
          .where(
            and(
              eq(customers.userId, userId),
              isNull(customers.deletedAt),
              isNull(users.deletedAt),
              eq(users.status, "ACTIVE"),
              eq(users.role, "CUSTOMER"),
            ),
          )
          .limit(1);
        if (!owner) throw new ApiError(403, "customer_required", "Требуется аккаунт покупателя");
        if (owner.customer.referralCode)
          return { id: owner.customer.id, code: owner.customer.referralCode };
        const generated = randomBytes(4).toString("hex").toUpperCase();
        const [updated] = await tx
          .update(customers)
          .set({ referralCode: generated })
          .where(and(eq(customers.id, owner.customer.id), isNull(customers.referralCode)))
          .returning({ code: customers.referralCode });
        if (updated) {
          await writeAudit(tx, {
            actorUserId: userId,
            actorRole: "CUSTOMER",
            action: "referral.code_generated",
            entity: "customer",
            entityId: owner.customer.id,
            data: { customerId: owner.customer.id },
          });
          return { id: owner.customer.id, code: generated };
        }
        const [existing] = await tx
          .select({ code: customers.referralCode })
          .from(customers)
          .where(eq(customers.id, owner.customer.id));
        if (!existing?.code) throw new Error("Referral code unavailable");
        return { id: owner.customer.id, code: existing.code };
      });
      customerId = result.id;
      code = result.code;
      break;
    } catch (error) {
      const e = error as { code?: string; cause?: { code?: string } };
      if ((e.code ?? e.cause?.code) !== "23505") throw error;
    }
  }
  if (!code) {
    console.error("referral_code_generation_exhausted");
    throw new ApiError(500, "referral_unavailable", "Не удалось создать ссылку. Попробуйте позже.");
  }
  const [invited] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(and(eq(customers.referredByCustomerId, customerId), isNull(customers.deletedAt)));
  const [counts, bonusPercent] = await Promise.all([
    db
      .select({
        status: referralBonuses.status,
        count: sql<number>`count(*)::int`,
        sumDirams: sql<string>`coalesce(sum(${referralBonuses.bonusAmountDirams}), 0)::text`,
      })
      .from(referralBonuses)
      .where(eq(referralBonuses.referrerCustomerId, customerId))
      .groupBy(referralBonuses.status),
    getReferralBonusPercent(db),
  ]);
  const creditedRow = counts.find((r) => r.status === "CREDITED");
  return {
    code,
    link: `${publicSiteOrigin()}/r/${code}`,
    stats: {
      invited: invited.count,
      pending: counts.find((r) => r.status === "PENDING")?.count ?? 0,
      credited: creditedRow?.count ?? 0,
    },
    bonusPercent,
    creditedDirams: creditedRow?.sumDirams ?? "0",
  };
}
/** Called only while creating a customer, inside the registration transaction. */
export async function linkReferral(
  tx: DbTransaction,
  referredId: string,
  input: unknown,
  ip: string,
) {
  const code = normalizeReferralCode(input);
  if (!code) return;
  const [owner] = await tx
    .select({ customer: customers })
    .from(customers)
    .innerJoin(users, eq(users.id, customers.userId))
    .where(
      and(
        eq(customers.referralCode, code),
        isNull(customers.deletedAt),
        isNull(users.deletedAt),
        eq(users.status, "ACTIVE"),
        eq(users.role, "CUSTOMER"),
      ),
    )
    .limit(1);
  if (!owner || owner.customer.id === referredId) return;
  const [linked] = await tx
    .update(customers)
    .set({ referredByCustomerId: owner.customer.id, source: "referral" })
    .where(and(eq(customers.id, referredId), isNull(customers.referredByCustomerId)))
    .returning({ userId: customers.userId });
  if (!linked) return;
  await tx
    .insert(referralBonuses)
    .values({
      referrerCustomerId: owner.customer.id,
      referredCustomerId: referredId,
      status: "PENDING",
    });
  await writeAudit(tx, {
    actorUserId: linked.userId,
    actorRole: "CUSTOMER",
    action: "referral.linked",
    entity: "customer",
    entityId: referredId,
    data: { referrerId: owner.customer.id, referredId, source: "referral" },
    ip,
  });
}
