import { afterAll, expect, it } from "vitest";
import { randomInt } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { customers, users } from "@/db/schema";
import { registerCustomer } from "@/modules/auth/service";
import { getReferralSummary, linkReferral } from "@/modules/referrals/service";
import { requestContactCode, verifyContactCode } from "@/modules/auth/contact-code";
afterAll(closeDb);
async function buyer(refCode?: string) {
  const suffix = crypto.randomUUID();
  return registerCustomer(
    {
      fullName: "Реферальный покупатель",
      phone: `+992${randomInt(100000000, 999999999)}`,
      email: `ref-${suffix}@example.test`,
      password: "Password123!",
      termsAccepted: true,
      refCode,
    },
    "test-referral",
  );
}
it("creates one stable code under concurrent requests with no initial bonuses", async () => {
  const owner = await buyer();
  const values = await Promise.all([
    getReferralSummary(owner.id),
    getReferralSummary(owner.id),
    getReferralSummary(owner.id),
  ]);
  expect(values[0].code).toMatch(/^[A-F0-9]{8}$/);
  expect(new Set(values.map((v) => v.code)).size).toBe(1);
  expect(values[0].stats).toEqual({ invited: 0, pending: 0, credited: 0 });
  expect(values[0].link).toContain(`/r/${values[0].code}`);
});
it("links a new password registration once, pending without a monetary reward", async () => {
  const owner = await buyer(),
    other = await buyer();
  const summary = await getReferralSummary(owner.id);
  const friend = await buyer(` ${summary.code.toLowerCase()} `);
  const db = await getDb();
  const [row] = await db.select().from(customers).where(eq(customers.id, friend.customerId));
  expect(row.referredByCustomerId).toBe(owner.customerId);
  expect(row.source).toBe("referral");
  const otherCode = (await getReferralSummary(other.id)).code;
  await db.transaction((tx) => linkReferral(tx, friend.customerId, otherCode, "test"));
  expect((await getReferralSummary(owner.id)).stats).toEqual({
    invited: 1,
    pending: 1,
    credited: 0,
  });
  expect((await getReferralSummary(other.id)).stats.invited).toBe(0);
  const result = await db.execute(
    sql`select status, bonus_amount_dirams from referral_bonuses where referred_customer_id=${friend.customerId}`,
  );
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0]).toMatchObject({ status: "PENDING", bonus_amount_dirams: null });
});
it("ignores malformed and unknown referral codes without marking source referral", async () => {
  for (const code of ["bad-code", "00000000"]) {
    const friend = await buyer(code);
    const db = await getDb();
    const [row] = await db.select().from(customers).where(eq(customers.id, friend.customerId));
    expect(row.referredByCustomerId).toBeNull();
    expect(row.source).toBe("direct");
  }
});
it("excludes blocked or deleted inviters and prevents self referrals", async () => {
  const db = await getDb(),
    owner = await buyer();
  const { code } = await getReferralSummary(owner.id);
  await db.transaction((tx) => linkReferral(tx, owner.customerId, code, "test"));
  expect((await getReferralSummary(owner.id)).stats.invited).toBe(0);
  await db.update(users).set({ status: "BLOCKED" }).where(eq(users.id, owner.id));
  const friend = await buyer(code);
  const [row] = await db.select().from(customers).where(eq(customers.id, friend.customerId));
  expect(row.referredByCustomerId).toBeNull();
  await db.update(users).set({ status: "ACTIVE" }).where(eq(users.id, owner.id));
  await db
    .update(customers)
    .set({ deletedAt: new Date() })
    .where(eq(customers.id, owner.customerId));
  const friend2 = await buyer(code);
  const [row2] = await db.select().from(customers).where(eq(customers.id, friend2.customerId));
  expect(row2.referredByCustomerId).toBeNull();
});
it("records referrals when registering through a verified email code", async () => {
  const owner = await buyer();
  const { code } = await getReferralSummary(owner.id);
  let otp = "";
  const challenge = await requestContactCode(
    {
      purpose: "register",
      channel: "email",
      identifier: `ref-otp-${crypto.randomUUID()}@example.test`,
      fullName: "Друг по коду",
      termsAccepted: true,
      refCode: code,
    },
    "test",
    async (input) => {
      otp = input.code;
    },
  );
  await verifyContactCode(
    {
      challengeId: challenge.challengeId,
      code: otp,
      password: "Password123!",
      passwordConfirmation: "Password123!",
    },
    "test",
    "test",
  );
  expect((await getReferralSummary(owner.id)).stats).toEqual({
    invited: 1,
    pending: 1,
    credited: 0,
  });
});
it("does not expose a referral account to staff and rolls back linkage with transaction", async () => {
  const db = await getDb();
  const [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN"));
  await expect(getReferralSummary(admin.id)).rejects.toMatchObject({ status: 403 });
  const owner = await buyer(),
    friend = await buyer();
  const { code } = await getReferralSummary(owner.id);
  await expect(
    db.transaction(async (tx) => {
      await linkReferral(tx, friend.customerId, code, "test");
      throw new Error("rollback");
    }),
  ).rejects.toThrow("rollback");
  expect((await getReferralSummary(owner.id)).stats.invited).toBe(0);
});

it("enforces unique referral codes and rejects self links and duplicate invitation records in SQL", async () => {
  const db = await getDb(),
    a = await buyer(),
    b = await buyer();
  const { code } = await getReferralSummary(a.id);
  await expect(
    db.update(customers).set({ referralCode: code }).where(eq(customers.id, b.customerId)),
  ).rejects.toThrow();
  await expect(
    db
      .update(customers)
      .set({ referredByCustomerId: b.customerId })
      .where(eq(customers.id, b.customerId)),
  ).rejects.toThrow();
  const friend = await buyer(code);
  await expect(
    db.execute(
      sql`insert into referral_bonuses (referrer_customer_id,referred_customer_id) values (${b.customerId},${friend.customerId})`,
    ),
  ).rejects.toThrow();
  await expect(
    db.execute(
      sql`insert into referral_bonuses (referrer_customer_id,referred_customer_id,bonus_amount_dirams) values (${a.customerId},${b.customerId},-1)`,
    ),
  ).rejects.toThrow();
});
