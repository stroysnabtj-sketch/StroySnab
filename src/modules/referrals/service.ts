import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, type DbTransaction } from "@/db";
import { customers, users, referralBonuses } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { publicSiteOrigin } from "@/modules/system/site-url";
import { writeAudit } from "@/modules/audit/service";
export const REFERRAL_COOKIE = "stroysnab_ref";
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
  const counts = await db
    .select({ status: referralBonuses.status, count: sql<number>`count(*)::int` })
    .from(referralBonuses)
    .where(eq(referralBonuses.referrerCustomerId, customerId))
    .groupBy(referralBonuses.status);
  return {
    code,
    link: `${publicSiteOrigin()}/r/${code}`,
    stats: {
      invited: invited.count,
      pending: counts.find((r) => r.status === "PENDING")?.count ?? 0,
      credited: counts.find((r) => r.status === "CREDITED")?.count ?? 0,
    },
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
