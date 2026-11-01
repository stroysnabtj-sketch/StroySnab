import bcrypt from "bcryptjs";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, sessions, userRoles, users } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { hasPermission, ROLES } from "@/modules/rbac/permissions";
import { writeAudit } from "@/modules/audit/service";
import { normalizePhone } from "@/modules/system/phone";
import { emailSchema } from "@/modules/system/utils";
import { z } from "zod";
import type { SessionUser } from "./session";

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string(),
  email: emailSchema,
  password: z.string().min(8).max(128),
  role: z.enum(ROLES),
});
const patchSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  role: z.enum(ROLES).optional(),
});

export async function listUsers(query: { q?: string; role?: string; status?: string }) {
  const db = await getDb();
  const filters = [];
  if (query.q) {
    filters.push(
      or(
        ilike(users.phone, `%${query.q}%`),
        ilike(users.email, `%${query.q}%`),
        ilike(customers.fullName, `%${query.q}%`),
      ),
    );
  }
  if (query.role) filters.push(eq(users.role, query.role));
  if (query.status) filters.push(eq(users.status, query.status));
  return db
    .select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      fullName: customers.fullName,
    })
    .from(users)
    .leftJoin(customers, eq(customers.userId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(100);
}

export async function createEmployee(actor: SessionUser, input: unknown, ip: string) {
  const data = createSchema.parse(input);
  if (["ADMIN", "SUPER_ADMIN"].includes(data.role) && !hasPermission(actor.role, "admins:manage")) {
    throw new ApiError(403, "forbidden", "Только суперадминистратор назначает администраторов");
  }
  const db = await getDb();
  const phone = normalizePhone(data.phone);
  const passwordHash = await bcrypt.hash(data.password, 12);
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ phone, email: data.email.toLowerCase(), passwordHash, role: data.role })
      .returning();
    await tx.insert(userRoles).values({ userId: user.id, role: data.role });
    if (data.role === "CUSTOMER") {
      await tx.insert(customers).values({ userId: user.id, fullName: data.fullName });
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "user.created",
      entity: "user",
      entityId: user.id,
      data: { role: data.role },
      ip,
    });
    return { id: user.id, role: user.role };
  });
}

export async function updateUser(actor: SessionUser, userId: string, input: unknown, ip: string) {
  const data = patchSchema.parse(input);
  if (data.role && ["ADMIN", "SUPER_ADMIN"].includes(data.role) && !hasPermission(actor.role, "admins:manage")) {
    throw new ApiError(403, "forbidden", "Недостаточно прав для назначения администратора");
  }
  if (actor.id === userId && data.status === "BLOCKED") {
    throw new ApiError(400, "self_block", "Нельзя заблокировать себя");
  }

  const db = await getDb();
  const [before] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!before) throw new ApiError(404, "not_found", "Пользователь не найден");
  if (["ADMIN", "SUPER_ADMIN"].includes(before.role) && !hasPermission(actor.role, "admins:manage")) {
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        ...(data.role ? { role: data.role } : {}),
        ...(data.status ? { status: data.status } : {}),
      })
      .where(eq(users.id, userId));

    if (data.role) {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));
      await tx.insert(userRoles).values({ userId, role: data.role });
    }

    if (data.status === "BLOCKED") {
      await tx.delete(sessions).where(eq(sessions.userId, userId));
    }

    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: data.role ? "user.role_changed" : "user.status_changed",
      entity: "user",
      entityId: userId,
      data: { before: { role: before.role, status: before.status }, after: data },
      ip,
    });
  });

  return { id: userId, ...data };
}
