import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, sessions, users } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { hasPermission, type Permission, type Role } from "@/modules/rbac/permissions";

export const SESSION_COOKIE = "kh_session";
const SESSION_DAYS = 30;
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
export function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 86400000);
}

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string;
  role: Role;
  customerId?: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      deletedAt: users.deletedAt,
      customerId: customers.id,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(customers, eq(customers.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;

  if (row.status !== "ACTIVE" || row.deletedAt) {
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .catch(() => {});
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    role: row.role as Role,
    customerId: row.customerId ?? undefined,
  };
}

export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "unauthorized", "Требуется вход");
  if (permission && !hasPermission(user.role, permission)) {
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  }
  return user;
}

export async function optionalUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

export async function requireCustomer(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "CUSTOMER")
    throw new ApiError(403, "forbidden", "Требуется аккаунт покупателя");
  return user;
}

export async function assertNotDeleted(userId: string): Promise<void> {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  if (!user) throw new ApiError(404, "not_found", "Пользователь не найден");
}
