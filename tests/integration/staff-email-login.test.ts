import { expect, it, vi, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, sessions } from "@/db/schema";
import { login } from "@/modules/auth/service";
import { requestContactCode, verifyContactCode } from "@/modules/auth/contact-code";
afterEach(() => vi.unstubAllEnvs());
it("requires password plus email code for staff and creates no full session after password", async () => {
  vi.stubEnv("STAFF_EMAIL_OTP_REQUIRED", "true");
  const db = await getDb();
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
  let code = "";
  const before = await db.select().from(sessions).where(eq(sessions.userId, admin.id));
  await expect(
    login(
      { identifier: admin.email, password: "wrong" },
      "staff-test",
      "test",
      false,
      async () => {},
    ),
  ).rejects.toMatchObject({ code: "invalid_credentials" });
  await expect(
    requestContactCode(
      { purpose: "login", channel: "email", identifier: admin.email },
      "staff-test",
      async () => {},
    ),
  ).rejects.toMatchObject({ code: "staff_password_required" });
  const pending = await login(
    { identifier: admin.email, password: "Admin123!" },
    "staff-test",
    "test",
    false,
    async (message) => {
      code = message.code;
    },
  );
  expect(pending.token).toBe("");
  expect(pending.challenge).toBeTruthy();
  expect(code).toMatch(/^\d{6}$/);
  expect(await db.select().from(sessions).where(eq(sessions.userId, admin.id))).toHaveLength(
    before.length,
  );
  await expect(
    verifyContactCode(
      { challengeId: pending.challenge!.challengeId, code: "invalid" },
      "staff-test",
      "test",
    ),
  ).rejects.toThrow();
  const result = await verifyContactCode(
    { challengeId: pending.challenge!.challengeId, code },
    "staff-test",
    "test",
  );
  expect(result.role).toBe("SUPER_ADMIN");
  expect(result.token.length).toBeGreaterThan(30);
  await expect(
    verifyContactCode({ challengeId: pending.challenge!.challengeId, code }, "staff-test", "test"),
  ).rejects.toMatchObject({ code: "code_invalid" });
});

it("invalidates the staff challenge if password changes before verification", async () => {
  vi.stubEnv("STAFF_EMAIL_OTP_REQUIRED", "true");
  const db = await getDb();
  const [seed] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
  const [staff] = await db
    .insert(users)
    .values({
      email: `staff-${crypto.randomUUID()}@example.test`,
      passwordHash: seed.passwordHash,
      role: "ADMIN",
    })
    .returning();
  let code = "";
  const pending = await login(
    { identifier: staff.email, password: "Admin123!" },
    "staff-change",
    "test",
    false,
    async (m) => {
      code = m.code;
    },
  );
  await db
    .update(users)
    .set({ passwordHash: "changed-password-hash" })
    .where(eq(users.id, staff.id));
  await expect(
    verifyContactCode(
      { challengeId: pending.challenge!.challengeId, code },
      "staff-change",
      "test",
    ),
  ).rejects.toMatchObject({ code: "code_invalid" });
  expect(await db.select().from(sessions).where(eq(sessions.userId, staff.id))).toHaveLength(0);
});

it("staff recovery changes password without granting a session and rejects SMS recovery", async () => {
  vi.stubEnv("STAFF_EMAIL_OTP_REQUIRED", "true");
  const db = await getDb();
  const [seed] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
  const [staff] = await db
    .insert(users)
    .values({
      email: `recover-staff-${crypto.randomUUID()}@example.test`,
      phone: "+992900123489",
      passwordHash: seed.passwordHash,
      role: "ADMIN",
    })
    .returning();
  await expect(
    requestContactCode(
      { purpose: "recover", channel: "sms", identifier: staff.phone },
      "staff-recover",
      async () => {},
    ),
  ).rejects.toMatchObject({ code: "staff_email_required" });
  let code = "";
  const pending = await requestContactCode(
    { purpose: "recover", channel: "email", identifier: staff.email },
    "staff-recover",
    async (m) => {
      code = m.code;
    },
  );
  const result = await verifyContactCode(
    {
      challengeId: pending.challengeId,
      code,
      password: "ChangedPassword1!",
      passwordConfirmation: "ChangedPassword1!",
    },
    "staff-recover",
    "test",
  );
  expect(result.token).toBe("");
  expect(result.requiresLogin).toBe(true);
  expect(await db.select().from(sessions).where(eq(sessions.userId, staff.id))).toHaveLength(0);
});
