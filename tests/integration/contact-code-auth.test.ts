import { expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, loginCodes, sessions } from "@/db/schema";
import { requestContactCode, verifyContactCode } from "@/modules/auth/contact-code";
import { hashToken } from "@/modules/auth/session";
import { verifyContactCaptcha } from "@/modules/auth/turnstile";
import { login } from "@/modules/auth/service";

it("rejects missing, mismatched and reused CAPTCHA before allowing paid codes", async () => {
  vi.stubEnv("APP_URL", "https://shop.example");
  vi.stubEnv("TURNSTILE_SITE_KEY", "test-site");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
  const captchaToken = crypto.randomUUID();
  try {
    await expect(
      verifyContactCaptcha({ purpose: "register", channel: "sms" }),
    ).rejects.toMatchObject({ code: "captcha_invalid" });
    vi.stubGlobal("fetch", async () =>
      Response.json({
        success: true,
        action: "contact_code",
        hostname: "foreign.example",
      }),
    );
    await expect(
      verifyContactCaptcha({ purpose: "register", channel: "sms", captchaToken }),
    ).rejects.toMatchObject({ code: "captcha_invalid" });
    vi.stubGlobal("fetch", async () =>
      Response.json({
        success: true,
        action: "contact_code",
        hostname: "shop.example",
      }),
    );
    await expect(
      verifyContactCaptcha({ purpose: "login", channel: "sms", captchaToken }),
    ).resolves.toBeUndefined();
    await expect(
      verifyContactCaptcha({ purpose: "register", channel: "sms", captchaToken }),
    ).rejects.toMatchObject({ code: "rate_limited" });
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});
it("registers after contact verification, consumes code once and creates a thirty-day session", async () => {
  const email = `code-${Date.now()}@example.com`;
  const password = "Strong!2026";
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
      termsAccepted: true,
    },
    "test",
    send,
  );
  const db = await getDb();
  expect(await db.select().from(users).where(eq(users.email, email))).toHaveLength(0);
  await expect(
    verifyContactCode(
      {
        challengeId: challenge.challengeId,
        code: delivered,
        password: "password",
        passwordConfirmation: "password",
      },
      "test",
      "vitest",
    ),
  ).rejects.toMatchObject({ code: "invalid_registration_password" });
  await expect(
    verifyContactCode(
      {
        challengeId: challenge.challengeId,
        code: delivered,
        password,
        passwordConfirmation: "Different!2026",
      },
      "test",
      "vitest",
    ),
  ).rejects.toMatchObject({ code: "invalid_registration_password" });
  const verified = await verifyContactCode(
    {
      challengeId: challenge.challengeId,
      code: delivered,
      password,
      passwordConfirmation: password,
    },
    "test",
    "vitest",
  );
  try {
    const [user] = await db.select().from(users).where(eq(users.id, verified.userId));
    expect(user.role).toBe("CUSTOMER");
    expect(user.email).toBe(email);
    expect(user.phone).toBeNull();
    expect(user.emailVerifiedAt).toBeTruthy();
    await expect(
      login({ identifier: email, password }, "test", "new browser"),
    ).resolves.toMatchObject({ userId: verified.userId });
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, hashToken(verified.token)));
    expect(session.expiresAt.getTime() - Date.now()).toBeGreaterThan(29 * 86400000);
    expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(30 * 86400000);
    await expect(
      verifyContactCode({ challengeId: challenge.challengeId, code: delivered }, "test", "test"),
    ).rejects.toMatchObject({ code: "code_invalid" });
    await db
      .update(loginCodes)
      .set({ createdAt: new Date(Date.now() - 61000) })
      .where(eq(loginCodes.id, challenge.challengeId));
    const codeLogin = await requestContactCode(
      { purpose: "login", channel: "email", identifier: email },
      "test",
      send,
    );
    const results = await Promise.allSettled([
      verifyContactCode({ challengeId: codeLogin.challengeId, code: delivered }, "test", "test"),
      verifyContactCode({ challengeId: codeLogin.challengeId, code: delivered }, "test", "test"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  } finally {
    await db.delete(users).where(eq(users.id, verified.userId));
  }
});

it("registers through SMS and subsequently accepts the phone and password", async () => {
  const phone = `93${Date.now().toString().slice(-7)}`;
  const password = "Strong!2026";
  let code = "";
  const challenge = await requestContactCode(
    {
      purpose: "register",
      channel: "sms",
      identifier: phone,
      fullName: "Покупатель",
      termsAccepted: true,
    },
    "test",
    async (message) => {
      code = message.code;
    },
  );
  const verified = await verifyContactCode(
    { challengeId: challenge.challengeId, code, password, passwordConfirmation: password },
    "test",
    "vitest",
  );
  const db = await getDb();
  try {
    await expect(
      login({ identifier: phone, password }, "test", "new browser"),
    ).resolves.toMatchObject({ userId: verified.userId });
    const [user] = await db.select().from(users).where(eq(users.id, verified.userId));
    expect(user.email).toBeNull();
    expect(user.phoneVerifiedAt).toBeTruthy();
    await db
      .update(loginCodes)
      .set({ createdAt: new Date(Date.now() - 61000) })
      .where(eq(loginCodes.id, challenge.challengeId));
    const recovery = await requestContactCode(
      { purpose: "recover", channel: "sms", identifier: phone },
      "test",
      async (message) => {
        code = message.code;
      },
    );
    const newPassword = "Updated!2026";
    await verifyContactCode(
      {
        challengeId: recovery.challengeId,
        code,
        password: newPassword,
        passwordConfirmation: newPassword,
      },
      "test",
      "recovery",
    );
    expect(
      await db
        .select()
        .from(sessions)
        .where(eq(sessions.tokenHash, hashToken(verified.token))),
    ).toHaveLength(0);
    await expect(
      login({ identifier: phone, password }, "test", "old password"),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      login({ identifier: phone, password: newPassword }, "test", "new password"),
    ).resolves.toMatchObject({ userId: verified.userId });
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
