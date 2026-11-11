import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { supplierUsers, userRoles, users } from "@/db/schema";
import { forgotPassword, registerCustomer, resetPassword } from "@/modules/auth/service";
import { assignSupplierOwner, getSupplierForUser } from "@/modules/suppliers/service";
import { updateUser } from "@/modules/auth/admin-service";
import { ApiError } from "@/server/api-error";
import type { Role } from "@/modules/rbac/permissions";

afterAll(async () => {
  await closeDb();
});

describe("auth concurrency and role consistency", () => {
  it("consumes password reset token atomically: parallel resets allow exactly one winner", async () => {
    const email = `concurrency-reset-${Date.now()}@example.com`;
    const phone = `93${Date.now().toString().slice(-7)}`;
    const reg = await registerCustomer(
      { fullName: "Reset Test", phone, email, password: "InitialPassword123!", termsAccepted: true },
      "test",
    );
    expect(reg.id).toBeTruthy();

    const forgot = await forgotPassword({ email });
    const token = forgot.developmentToken;
    expect(token).toBeTruthy();

    // Fire two parallel reset requests with the same token
    const results = await Promise.allSettled([
      resetPassword({ token: token!, password: "NewPassword1!" }, "ip1"),
      resetPassword({ token: token!, password: "NewPassword2!" }, "ip2"),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const failures = results.filter((r) => r.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const err = (failures[0] as PromiseRejectedResult).reason;
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).code).toBe("reset_invalid");

    // Clean up
    const db = await getDb();
    await db.delete(users).where(eq(users.id, reg.id));
  });

  it("handles concurrent duplicate registrations gracefully with 400 user_exists instead of 500", async () => {
    const phone = `93${Date.now().toString().slice(-7)}`;
    const email = `concurrency-dup-${Date.now()}@example.com`;

    const [res1, res2] = await Promise.allSettled([
      registerCustomer(
        { fullName: "User One", phone, email, password: "Password123!", termsAccepted: true },
        "ip1",
      ),
      registerCustomer(
        { fullName: "User Two", phone, email, password: "Password123!", termsAccepted: true },
        "ip2",
      ),
    ]);

    const successes = [res1, res2].filter((r) => r.status === "fulfilled");
    const failures = [res1, res2].filter((r) => r.status === "rejected");

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const err = (failures[0] as PromiseRejectedResult).reason;
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).code).toBe("user_exists");

    // Clean up
    const db = await getDb();
    const createdId = (successes[0] as PromiseFulfilledResult<{ id: string }>).value.id;
    await db.delete(users).where(eq(users.id, createdId));
  });

  it("synchronizes user_roles and users.role on role update without leaving orphaned roles", async () => {
    const phone = `93${Date.now().toString().slice(-7)}`;
    const email = `role-sync-${Date.now()}@example.com`;
    const reg = await registerCustomer(
      { fullName: "Role User", phone, email, password: "Password123!", termsAccepted: true },
      "test",
    );

    const db = await getDb();
    const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
    const adminActor = {
      id: adminUser.id,
      email: adminUser.email!,
      phone: adminUser.phone,
      role: adminUser.role as Role,
    };

    // Promote to SALES_MANAGER
    await updateUser(adminActor, reg.id, { role: "SALES_MANAGER" }, "ip");

    const [userAfter1] = await db.select().from(users).where(eq(users.id, reg.id));
    expect(userAfter1.role).toBe("SALES_MANAGER");

    const rolesAfter1 = await db.select().from(userRoles).where(eq(userRoles.userId, reg.id));
    expect(rolesAfter1).toHaveLength(1);
    expect(rolesAfter1[0].role).toBe("SALES_MANAGER");

    // Demote back to CUSTOMER
    await updateUser(adminActor, reg.id, { role: "CUSTOMER" }, "ip");
    const rolesAfter2 = await db.select().from(userRoles).where(eq(userRoles.userId, reg.id));
    expect(rolesAfter2).toHaveLength(1);
    expect(rolesAfter2[0].role).toBe("CUSTOMER");

    // Clean up
    await db.delete(users).where(eq(users.id, reg.id));
  });

  it("synchronizes previous owner when reassigning supplier owner and protects SUPER_ADMIN", async () => {
    const db = await getDb();
    const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
    const adminActor = {
      id: adminUser.id,
      email: adminUser.email!,
      phone: adminUser.phone,
      role: adminUser.role as Role,
    };

    const [sellerUser] = await db.select().from(users).where(eq(users.email, "seller@stroyhub.tj"));
    const membership = await getSupplierForUser(sellerUser.id);

    // Create a new staff candidate user
    const staffPhone = `93${Date.now().toString().slice(-7)}`;
    const staffEmail = `new-owner-${Date.now()}@example.com`;
    const newOwnerReg = await registerCustomer(
      { fullName: "New Owner", phone: staffPhone, email: staffEmail, password: "Password123!", termsAccepted: true },
      "test",
    );

    // Attempting to assign SUPER_ADMIN as supplier owner must fail
    await expect(
      assignSupplierOwner(adminActor, membership.supplier.id, "admin@stroyhub.tj", "ip"),
    ).rejects.toThrow("Нельзя назначить суперадминистратора");

    await db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, newOwnerReg.id));
    // Transfer ownership to new candidate
    await assignSupplierOwner(adminActor, membership.supplier.id, staffEmail, "ip");

    // New candidate is now OWNER in supplierUsers and SUPPLIER_OWNER in users and user_roles
    const [newCandidateUser] = await db.select().from(users).where(eq(users.id, newOwnerReg.id));
    expect(newCandidateUser.role).toBe("SUPPLIER_OWNER");
    const [newMembership] = await db
      .select()
      .from(supplierUsers)
      .where(and(eq(supplierUsers.supplierId, membership.supplier.id), eq(supplierUsers.userId, newOwnerReg.id)));
    expect(newMembership.role).toBe("OWNER");

    // Previous owner was demoted to STAFF in supplierUsers
    const [oldMembership] = await db
      .select()
      .from(supplierUsers)
      .where(and(eq(supplierUsers.supplierId, membership.supplier.id), eq(supplierUsers.userId, sellerUser.id)));
    expect(oldMembership.role).toBe("STAFF");

    // Restore original owner
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, sellerUser.id));
    await assignSupplierOwner(adminActor, membership.supplier.id, "seller@stroyhub.tj", "ip");
    await db
      .update(users)
      .set({ emailVerifiedAt: sellerUser.emailVerifiedAt })
      .where(eq(users.id, sellerUser.id));
    await db.delete(users).where(eq(users.id, newOwnerReg.id));
  });
});
