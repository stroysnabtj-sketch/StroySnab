import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, passwordResets, sessions, userRoles, users } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { normalizePhone } from "@/modules/system/phone";
import { writeAudit } from "@/modules/audit/service";
import { hashToken, newSessionToken, sessionExpiry } from "./session";
import { forgotSchema, loginSchema, profileSchema, registerSchema, resetSchema } from "./schemas";

export const TERMS_VERSION = "2026-10-30";

export async function registerCustomer(input: unknown, ip: string) {
  const data = registerSchema.parse(input);
  const phone = normalizePhone(data.phone);
  const email = data.email?.trim() ? data.email.trim().toLowerCase() : null;
  const db = await getDb();
  const [duplicate] = await db.select({ id: users.id }).from(users).where(or(eq(users.phone, phone), email ? eq(users.email, email) : sql`false`)).limit(1);
  if (duplicate) throw new ApiError(400, "user_exists", "Пользователь с таким телефоном или e-mail уже существует");
  const passwordHash = await bcrypt.hash(data.password, 12);
  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ phone, email, passwordHash, role: "CUSTOMER", termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION }).returning();
    const [customer] = await tx.insert(customers).values({ userId: user.id, fullName: data.fullName, source: data.refCode ? "referral" : "direct" }).returning();
    await tx.insert(userRoles).values({ userId: user.id, role: "CUSTOMER" });
    await writeAudit(tx, { actorUserId: user.id, actorRole: "CUSTOMER", action: "user.terms_accepted", entity: "user", entityId: user.id, data: { version: TERMS_VERSION }, ip });
    return { id: user.id, customerId: customer.id, phone: user.phone };
  });
}

export async function login(input: unknown, ip: string, userAgent: string) {
  const data = loginSchema.parse(input);
  const db = await getDb();
  const identifier = data.identifier.trim();
  const normalized = identifier.includes("@") ? identifier.toLowerCase() : normalizePhone(identifier);
  const [user] = await db.select().from(users).where(and(or(eq(users.email, normalized), eq(users.phone, normalized)), isNull(users.deletedAt))).limit(1);
  if (!user || user.status !== "ACTIVE") throw new ApiError(401, "invalid_credentials", "Неверный логин или пароль");
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new ApiError(429, "account_locked", "Слишком много попыток. Повторите позже");
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await db.update(users).set({ failedLoginAttempts: attempts, lockedUntil: attempts >= 10 ? new Date(Date.now() + 900000) : null }).where(eq(users.id, user.id));
    throw new ApiError(401, "invalid_credentials", "Неверный логин или пароль");
  }
  const token = newSessionToken();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await tx.insert(sessions).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: sessionExpiry(), ip, userAgent: userAgent.slice(0, 500) });
    await writeAudit(tx, { actorUserId: user.id, actorRole: user.role, action: "user.login", entity: "user", entityId: user.id, ip });
  });
  return { token, role: user.role };
}

export async function logout(token: string | undefined, ip: string) {
  if (!token) return;
  const db = await getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(token))).limit(1);
  if (session) await db.transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.id, session.id));
    await writeAudit(tx, { actorUserId: session.userId, action: "user.logout", entity: "user", entityId: session.userId, ip });
  });
}

export async function forgotPassword(input: unknown) {
  const { email } = forgotSchema.parse(input);
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) return { developmentToken: undefined };
  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600000) });
  if (process.env.MAIL_HOST) console.log(`Password reset email queued for ${user.id}`);
  else console.log(`Password reset link: ${process.env.APP_URL ?? "http://localhost:3000"}/auth/reset?token=${token}`);
  return { developmentToken: !process.env.MAIL_HOST && process.env.NODE_ENV !== "production" ? token : undefined };
}

export async function resetPassword(input: unknown, ip: string) {
  const data = resetSchema.parse(input);
  const db = await getDb();
  const [reset] = await db.select().from(passwordResets).where(and(eq(passwordResets.tokenHash, hashToken(data.token)), gt(passwordResets.expiresAt, new Date()), isNull(passwordResets.usedAt))).limit(1);
  if (!reset) throw new ApiError(400, "reset_invalid", "Ссылка недействительна или истекла");
  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, reset.userId));
    await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));
    await tx.delete(sessions).where(eq(sessions.userId, reset.userId));
    await writeAudit(tx, { actorUserId: reset.userId, action: "user.password_changed", entity: "user", entityId: reset.userId, ip });
  });
}

export async function updateProfile(userId: string, input: unknown) {
  const data = profileSchema.parse(input);
  const phone = normalizePhone(data.phone);
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ phone }).where(eq(users.id, userId));
    await tx.update(customers).set({ fullName: data.fullName }).where(eq(customers.userId, userId));
  });
  return { phone, fullName: data.fullName };
}
