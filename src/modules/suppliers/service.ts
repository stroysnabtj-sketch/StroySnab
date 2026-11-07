import { parseExplicitPatch } from "@/modules/system/patch";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  supplierInvitations,
  supplierOffers,
  supplierUsers,
  suppliers,
  userRoles,
  users,
} from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { normalizePhone } from "@/modules/system/phone";
import { ApiError } from "@/server/api-error";
import { hasPermission } from "@/modules/rbac/permissions";

export const supplierInput = z.object({
  name: z.string().trim().min(2).max(200),
  legalName: z.string().max(250).optional().nullable(),
  taxId: z.string().max(80).optional().nullable(),
  phone: z.string().min(9).max(30),
  email: z.string().email().max(254).optional().nullable(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).default("PENDING"),
  payoutDetails: z.string().max(2000).optional().nullable(),
});

export async function listSuppliers() {
  const db = await getDb();
  return db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      legalName: suppliers.legalName,
      phone: suppliers.phone,
      email: suppliers.email,
      status: suppliers.status,
      createdAt: suppliers.createdAt,
      offerCount: sql<number>`(select count(*)::int from ${supplierOffers} where ${supplierOffers.supplierId} = ${suppliers.id})`,
      userCount: sql<number>`(select count(*)::int from ${supplierUsers} where ${supplierUsers.supplierId} = ${suppliers.id})`,
    })
    .from(suppliers)
    .orderBy(desc(suppliers.createdAt));
}

export async function createSupplier(actor: SessionUser, input: unknown, ip?: string) {
  const data = supplierInput.parse(await Promise.resolve(input));
  const db = await getDb();
  const [created] = await db
    .insert(suppliers)
    .values({ ...data, phone: normalizePhone(data.phone) })
    .returning();
  await writeAudit(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "supplier.created",
    entity: "suppliers",
    entityId: created.id,
    data: { name: created.name },
    ip,
  });
  return created;
}

export async function updateSupplier(actor: SessionUser, id: string, input: unknown, ip?: string) {
  const data = parseExplicitPatch(supplierInput, await Promise.resolve(input));
  const db = await getDb();
  const [before] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  if (!before) throw new ApiError(404, "not_found", "Поставщик не найден");
  const [updated] = await db
    .update(suppliers)
    .set({ ...data, phone: data.phone ? normalizePhone(data.phone) : undefined })
    .where(eq(suppliers.id, id))
    .returning();
  await writeAudit(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "supplier.updated",
    entity: "suppliers",
    entityId: id,
    data: { before: { status: before.status }, after: { status: updated.status } },
    ip,
  });
  return updated;
}

export async function assignSupplierOwner(
  actor: SessionUser,
  supplierId: string,
  email: string,
  ip?: string,
) {
  const db = await getDb();
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
  if (!supplier) throw new ApiError(404, "not_found", "Поставщик не найден");

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) throw new ApiError(404, "not_found", "Пользователь с таким e-mail не найден");
  if (user.role === "SUPER_ADMIN") {
    throw new ApiError(
      400,
      "cannot_reassign_super_admin",
      "Нельзя назначить суперадминистратора владельцем поставщика",
    );
  }

  await db.transaction(async (tx) => {
    // Find previous owners for this supplier
    await tx.execute(sql`select pg_advisory_xact_lock(19401104)`);
    const [target] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
    if (!target || target.deletedAt || target.status !== "ACTIVE")
      throw new ApiError(400, "inactive_owner", "Владелец должен быть активным пользователем");
    if (
      target.role === "SUPER_ADMIN" ||
      (["ADMIN", "SALES_MANAGER", "PROCUREMENT_MANAGER", "LOGISTICS", "CONTENT_MANAGER"].includes(
        target.role,
      ) &&
        !hasPermission(actor.role, "admins:manage"))
    )
      throw new ApiError(
        403,
        "protected_platform_user",
        "Назначение сотрудника платформы владельцем доступно супер-администратору",
      );
    const memberships = await tx
      .select()
      .from(supplierUsers)
      .where(eq(supplierUsers.userId, user.id));
    if (memberships.some((row) => row.supplierId !== supplierId))
      throw new ApiError(409, "already_bound", "Пользователь уже привязан к другому магазину");
    const previousOwners = await tx
      .select({ userId: supplierUsers.userId })
      .from(supplierUsers)
      .where(and(eq(supplierUsers.supplierId, supplierId), eq(supplierUsers.role, "OWNER")));

    // Demote previous owner(s) to STAFF in membership, users table, and user_roles table
    for (const prev of previousOwners) {
      if (prev.userId !== user.id) {
        await tx
          .update(supplierUsers)
          .set({ role: "STAFF" })
          .where(
            and(eq(supplierUsers.supplierId, supplierId), eq(supplierUsers.userId, prev.userId)),
          );
        await tx.update(users).set({ role: "SUPPLIER_STAFF" }).where(eq(users.id, prev.userId));
        await tx.delete(userRoles).where(eq(userRoles.userId, prev.userId));
        await tx.insert(userRoles).values({ userId: prev.userId, role: "SUPPLIER_STAFF" });
      }
    }

    // Set new owner membership and role
    await tx
      .delete(supplierUsers)
      .where(and(eq(supplierUsers.supplierId, supplierId), eq(supplierUsers.userId, user.id)));
    await tx.insert(supplierUsers).values({ supplierId, userId: user.id, role: "OWNER" });
    await tx.update(users).set({ role: "SUPPLIER_OWNER" }).where(eq(users.id, user.id));
    await tx.delete(userRoles).where(eq(userRoles.userId, user.id));
    await tx.insert(userRoles).values({ userId: user.id, role: "SUPPLIER_OWNER" });

    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "supplier.owner.assigned",
      entity: "suppliers",
      entityId: supplierId,
      data: { userId: user.id },
      ip,
    });
  });
  return { ok: true };
}

export async function getSupplierForUser(userId: string, requireActive = false) {
  const db = await getDb();
  const [membership] = await db
    .select({ supplier: suppliers, role: supplierUsers.role })
    .from(supplierUsers)
    .innerJoin(suppliers, eq(supplierUsers.supplierId, suppliers.id))
    .where(eq(supplierUsers.userId, userId))
    .limit(1);

  if (!membership) throw new ApiError(403, "forbidden", "Пользователь не привязан к поставщику");
  if (requireActive && membership.supplier.status === "SUSPENDED") {
    throw new ApiError(403, "supplier_suspended", "Поставщик заблокирован или приостановлен");
  }
  return membership;
}

export async function createInvitation(actor: SessionUser, supplierId: string, ip?: string) {
  const db = await getDb();
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
  if (!supplier) throw new ApiError(404, "not_found", "Поставщик не найден");

  const code = randomBytes(32).toString("base64url");
  const codeHash = createHash("sha256").update(code).digest("hex");
  const [invitation] = await db
    .insert(supplierInvitations)
    .values({
      supplierId,
      codeHash,
      createdBy: actor.id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    })
    .returning();

  await writeAudit(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "supplier.invitation.created",
    entity: "supplier_invitations",
    entityId: invitation.id,
    ip,
  });

  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    id: invitation.id,
    url: `${base}/supplier-invite?code=${code}`,
    code,
    expiresAt: invitation.expiresAt,
  };
}

export const acceptInvitationInput = z.object({
  code: z.string().min(20),
  phone: z.string().min(9).max(30),
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});

export async function acceptInvitation(input: unknown, ip?: string) {
  const data = acceptInvitationInput.parse(await Promise.resolve(input));
  const codeHash = createHash("sha256").update(data.code).digest("hex");
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .update(supplierInvitations)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(supplierInvitations.codeHash, codeHash),
          isNull(supplierInvitations.usedAt),
          gt(supplierInvitations.expiresAt, new Date()),
        ),
      )
      .returning();

    if (!invitation)
      throw new ApiError(404, "not_found", "Приглашение недействительно или истекло");

    const phone = normalizePhone(data.phone);
    const email = data.email.toLowerCase();
    const [created] = await tx
      .insert(users)
      .values({
        phone,
        email,
        passwordHash: await bcrypt.hash(data.password, 12),
        role: "SUPPLIER_STAFF",
      })
      .returning()
      .catch(() => {
        throw new ApiError(
          409,
          "conflict",
          "Пользователь с таким телефоном или e-mail уже существует",
        );
      });

    await tx.insert(userRoles).values({ userId: created.id, role: "SUPPLIER_STAFF" });
    await tx.insert(supplierUsers).values({
      supplierId: invitation.supplierId,
      userId: created.id,
      role: invitation.role,
    });

    await writeAudit(tx, {
      actorUserId: created.id,
      actorRole: "SUPPLIER_STAFF",
      action: "supplier.invitation.accepted",
      entity: "suppliers",
      entityId: invitation.supplierId,
      ip,
    });
    return { ok: true };
  });
}
