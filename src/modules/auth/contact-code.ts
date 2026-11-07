import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users, customers, userRoles, sessions, loginCodes } from "@/db/schema";
import { normalizePhone, maskPhone } from "@/modules/system/phone";
import { writeAudit } from "@/modules/audit/service";
import { ApiError } from "@/server/api-error";
import { consumeRateLimit } from "@/server/rate-limit";
import { hashToken, newSessionToken, sessionExpiry } from "./session";
import { sendContactCode, type CodeDelivery } from "./code-delivery";
const requestInput = z.object({
  purpose: z.enum(["login", "register"]),
  channel: z.enum(["sms", "email"]),
  identifier: z.string().trim().min(3).max(254),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().max(30).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  termsAccepted: z.boolean().optional(),
  refCode: z.string().trim().max(16).optional(),
});
const verifyInput = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) });
export async function requestContactCode(
  input: unknown,
  ip: string,
  deliver: CodeDelivery = sendContactCode,
) {
  const data = requestInput.parse(input),
    identifier =
      data.channel === "email"
        ? z.email().parse(data.identifier).toLowerCase()
        : normalizePhone(data.identifier);
  const db = await getDb();
  await consumeRateLimit(`contact-code-send:${hashToken(identifier)}`, 3, 900);
  let registration: typeof loginCodes.$inferInsert.registration = null;
  if (data.purpose === "register") {
    if (!data.fullName || !data.phone || !data.termsAccepted)
      throw new ApiError(400, "registration_incomplete", "Укажите имя, телефон и примите условия");
    registration = {
      fullName: data.fullName,
      phone: normalizePhone(data.phone),
      email: data.email?.trim().toLowerCase() || null,
      refCode: data.refCode,
    };
    if (
      (data.channel === "sms" && registration.phone !== identifier) ||
      (data.channel === "email" && registration.email !== identifier)
    )
      throw new ApiError(400, "contact_mismatch", "Проверьте контакт для отправки кода");
  }
  const code = randomInt(0, 1000000).toString().padStart(6, "0"),
    codeHash = await bcrypt.hash(code, 12);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`contact-code:${identifier}`}))`);
    const [last] = await tx
      .select()
      .from(loginCodes)
      .where(eq(loginCodes.identifier, identifier))
      .orderBy(desc(loginCodes.createdAt))
      .limit(1);
    if (last && last.createdAt.getTime() > Date.now() - 60000)
      throw new ApiError(429, "resend_wait", "Запросить новый код можно через минуту", undefined, {
        "Retry-After": "60",
      });
    const [user] = await tx
      .select()
      .from(users)
      .where(
        and(
          data.channel === "email" ? eq(users.email, identifier) : eq(users.phone, identifier),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    if (registration) {
      const duplicate = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          or(
            eq(users.phone, registration.phone),
            registration.email ? eq(users.email, registration.email) : undefined,
          ),
        )
        .limit(1);
      if (duplicate.length)
        throw new ApiError(409, "user_exists", "Аккаунт уже существует. Войдите по коду.");
    }
    await tx
      .update(loginCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(loginCodes.identifier, identifier), isNull(loginCodes.usedAt)));
    const [challenge] = await tx
      .insert(loginCodes)
      .values({
        identifier,
        channel: data.channel,
        purpose: data.purpose,
        userId: user?.id,
        registration,
        codeHash,
        expiresAt: new Date(Date.now() + 300000),
      })
      .returning({ id: loginCodes.id });
    await deliver({ channel: data.channel, recipient: identifier, code, expiresInSeconds: 300 });
    const masked =
      data.channel === "sms"
        ? maskPhone(identifier)
        : identifier.replace(/^(.{1,2}).*(@.*)$/, "$1***$2");
    return {
      challengeId: challenge.id,
      channel: data.channel,
      maskedRecipient: masked,
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
    };
  });
}
export async function verifyContactCode(input: unknown, ip: string, userAgent: string) {
  const data = verifyInput.parse(input),
    db = await getDb(),
    token = newSessionToken();
  const result = await db.transaction(async (tx) => {
    const [challenge] = await tx
      .select()
      .from(loginCodes)
      .where(eq(loginCodes.id, data.challengeId))
      .for("update");
    const invalid = () => ({
      error: new ApiError(400, "code_invalid", "Код неверен или истёк. Запросите новый."),
    });
    if (
      !challenge ||
      challenge.usedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= 5
    )
      return invalid();
    if (!(await bcrypt.compare(data.code, challenge.codeHash))) {
      await tx
        .update(loginCodes)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(loginCodes.id, challenge.id));
      return invalid();
    }
    let userId = challenge.userId;
    if (challenge.purpose === "register" && challenge.registration) {
      const reg = challenge.registration;
      for (const key of [
        `register-phone:${reg.phone}`,
        ...(reg.email ? [`register-email:${reg.email}`] : []),
      ].sort()) {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
      }
      const duplicate = await tx
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.phone, reg.phone), reg.email ? eq(users.email, reg.email) : undefined))
        .limit(1);
      if (duplicate.length)
        return {
          error: new ApiError(409, "user_exists", "Аккаунт уже существует. Войдите по коду."),
        };
      const [created] = await tx
        .insert(users)
        .values({
          phone: reg.phone,
          email: reg.email,
          fullName: reg.fullName,
          passwordHash: await bcrypt.hash(randomBytes(32).toString("base64url"), 12),
          role: "CUSTOMER",
          termsAcceptedAt: new Date(),
          termsVersion: "2026-10-30",
        })
        .returning();
      userId = created.id;
      await tx
        .insert(customers)
        .values({ userId, fullName: reg.fullName, source: reg.refCode ? "referral" : "direct" });
      await tx.insert(userRoles).values({ userId, role: "CUSTOMER" });
      await writeAudit(tx, {
        actorUserId: userId,
        actorRole: "CUSTOMER",
        action: "user.terms_accepted",
        entity: "user",
        entityId: userId,
        data: { version: "2026-10-30" },
        ip,
      });
    }
    if (!userId) {
      await tx
        .update(loginCodes)
        .set({ usedAt: new Date() })
        .where(eq(loginCodes.id, challenge.id));
      return {
        error: new ApiError(
          400,
          "registration_required",
          "Аккаунт не найден. Пройдите регистрацию.",
        ),
      };
    }
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (
      !user ||
      user.status !== "ACTIVE" ||
      user.deletedAt ||
      (challenge.channel === "email"
        ? user.email?.toLowerCase() !== challenge.identifier
        : user.phone !== challenge.identifier)
    )
      return invalid();
    await tx.update(loginCodes).set({ usedAt: new Date() }).where(eq(loginCodes.id, challenge.id));
    await tx
      .update(users)
      .set({
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        ...(challenge.channel === "email"
          ? { emailVerifiedAt: new Date() }
          : { phoneVerifiedAt: new Date() }),
      })
      .where(eq(users.id, userId));
    await tx.insert(sessions).values({
      userId,
      tokenHash: hashToken(token),
      expiresAt: sessionExpiry(),
      ip,
      userAgent: userAgent.slice(0, 500),
    });
    await writeAudit(tx, {
      actorUserId: userId,
      actorRole: user.role,
      action: "user.login_code",
      entity: "user",
      entityId: userId,
      data: { channel: challenge.channel },
      ip,
    });
    return { value: { token, userId, role: user.role } };
  });
  if ("error" in result) throw result.error;
  return result.value;
}
