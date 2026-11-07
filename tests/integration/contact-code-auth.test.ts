import { expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, loginCodes, sessions } from "@/db/schema";
import { requestContactCode, verifyContactCode } from "@/modules/auth/contact-code";
import { hashToken } from "@/modules/auth/session";
it("registers after contact verification, consumes code once and creates a thirty-day session", async () => {
  const suffix = Date.now().toString().slice(-7),
    phone = `93${suffix}`,
    email = `code-${Date.now()}@example.com`;
  let delivered = "";
  const send = async (input: { code: string }) => {
    delivered = input.code;
  };
  const challenge = await requestContactCode(
    {
      purpose: "register",
      channel: "email",
      identifier: email,
      fullName: "Код Покупатель",
      phone,
      email,
      termsAccepted: true,
    },
    "test",
    send,
  );
  const db = await getDb();
  expect(await db.select().from(users).where(eq(users.email, email))).toHaveLength(0);
  const verified = await verifyContactCode(
    { challengeId: challenge.challengeId, code: delivered },
    "test",
    "vitest",
  );
  try {
    const [user] = await db.select().from(users).where(eq(users.id, verified.userId));
    expect(user.role).toBe("CUSTOMER");
    expect(user.email).toBe(email);
    expect(user.emailVerifiedAt).toBeTruthy();
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, hashToken(verified.token)));
    expect(session.expiresAt.getTime() - Date.now()).toBeGreaterThan(29 * 86400000);
    expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30 * 86400000);
    await expect(
      verifyContactCode({ challengeId: challenge.challengeId, code: delivered }, "test", "test"),
    ).rejects.toMatchObject({ code: "code_invalid" });
    const login = await requestContactCode(
      { purpose: "login", channel: "sms", identifier: phone },
      "test",
      send,
    );
    const results = await Promise.allSettled([
      verifyContactCode({ challengeId: login.challengeId, code: delivered }, "test", "test"),
      verifyContactCode({ challengeId: login.challengeId, code: delivered }, "test", "test"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  } finally {
    await db.delete(users).where(eq(users.id, verified.userId));
  }
});
it("limits attempts, expires codes and does not claim delivery when transport is disconnected", async () => {
  const identifier = `missing-${Date.now()}@example.com`,
    db = await getDb();
  let code = "";
  const challenge = await requestContactCode(
    { purpose: "login", channel: "email", identifier },
    "test",
    async (v) => {
      code = v.code;
    },
  );
  const [stored] = await db
    .select()
    .from(loginCodes)
    .where(eq(loginCodes.id, challenge.challengeId));
  expect(stored.codeHash).not.toContain(code);
  for (let i = 0; i < 5; i++)
    await expect(
      verifyContactCode(
        { challengeId: challenge.challengeId, code: code === "000000" ? "000001" : "000000" },
        "test",
        "test",
      ),
    ).rejects.toMatchObject({ code: "code_invalid" });
  await expect(
    verifyContactCode({ challengeId: challenge.challengeId, code }, "test", "test"),
  ).rejects.toMatchObject({ code: "code_invalid" });
  const exp = await requestContactCode(
    { purpose: "login", channel: "email", identifier: `expired-${identifier}` },
    "test",
    async (v) => {
      code = v.code;
    },
  );
  await db
    .update(loginCodes)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(loginCodes.id, exp.challengeId));
  await expect(
    verifyContactCode({ challengeId: exp.challengeId, code }, "test", "test"),
  ).rejects.toMatchObject({ code: "code_invalid" });
  await expect(
    requestContactCode({ purpose: "login", channel: "sms", identifier: "+992939876543" }, "test"),
  ).rejects.toMatchObject({ code: "code_delivery_unavailable" });
});
