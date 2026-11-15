import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import { getDb } from "@/db";
import { auditLog, orders, users } from "@/db/schema";
import { assignOrderDelivery } from "@/modules/orders/delivery-service";

it("rolls back the assignment when its mandatory audit write fails", async () => {
  // Removing the transaction would leave driver fields updated after the audit foreign key fails.
  const db = await getDb();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `DEL-${randomUUID()}`,
      customerName: "Rollback test",
      customerPhone: "+992900111224",
      deliveryAddress: "Test address",
      status: "CONFIRMED",
      vehicleType: "GAZELLE",
    })
    .returning();
  try {
    await expect(
      assignOrderDelivery({ id: randomUUID(), role: "LOGISTICS" }, order.id, {
        driverName: "Uncommitted driver",
        driverPhone: "900111225",
        vehiclePlate: "1234 AA 01",
        expectedUpdatedAt: order.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ cause: { code: "23503" } });
    expect(await db.select().from(orders).where(eq(orders.id, order.id))).toEqual([order]);
    expect(await db.select().from(auditLog).where(eq(auditLog.entityId, order.id))).toEqual([]);
  } finally {
    await db.delete(auditLog).where(eq(auditLog.entityId, order.id));
    await db.delete(orders).where(eq(orders.id, order.id));
  }
});

it("keeps the winning assignment and its audit record when a competing stale edit loses", async () => {
  // Removing optimistic version checking would overwrite the winner and append a second audit entry.
  const db = await getDb();
  const [actor] = await db
    .insert(users)
    .values({
      phone: `delivery-${randomUUID()}`,
      passwordHash: "test",
      role: "LOGISTICS",
    })
    .returning();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `DEL-${randomUUID()}`,
      customerName: "Delivery test",
      customerPhone: "+992900111224",
      deliveryAddress: "Test address",
      status: "CONFIRMED",
      vehicleType: "GAZELLE",
    })
    .returning();
  try {
    const input = {
      driverName: "Winning driver",
      driverPhone: "900111225",
      vehiclePlate: "1234 AA 01",
      expectedUpdatedAt: order.updatedAt.toISOString(),
    };
    const results = await Promise.allSettled([
      assignOrderDelivery({ ...actor, role: "LOGISTICS" }, order.id, input),
      assignOrderDelivery({ ...actor, role: "LOGISTICS" }, order.id, {
        ...input,
        driverName: "Other driver",
        vehiclePlate: "5678 AA 01",
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { status: 409, code: "order_changed" },
    });
    const [saved] = await db.select().from(orders).where(eq(orders.id, order.id));
    const audit = await db.select().from(auditLog).where(eq(auditLog.entityId, order.id));
    expect(saved.status).toBe("CONFIRMED");
    expect(saved.driverPhone).toBe("+992900111225");
    expect(saved.updatedAt.getTime()).toBeGreaterThan(order.updatedAt.getTime());
    expect(audit).toEqual([
      expect.objectContaining({ action: "orders.delivery_assigned", actorUserId: actor.id }),
    ]);
    expect(audit[0].data).toMatchObject({
      driverName: saved.driverName,
      vehiclePlate: saved.vehiclePlate,
    });
    await expect(
      assignOrderDelivery({ ...actor, role: "CUSTOMER" }, order.id, {
        ...input,
        expectedUpdatedAt: saved.updatedAt.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
    expect(await db.select().from(orders).where(eq(orders.id, order.id))).toEqual([saved]);
    expect(await db.select().from(auditLog).where(eq(auditLog.entityId, order.id))).toEqual(audit);
  } finally {
    await db.delete(auditLog).where(eq(auditLog.entityId, order.id));
    await db.delete(orders).where(eq(orders.id, order.id));
    await db.delete(users).where(eq(users.id, actor.id));
  }
});
