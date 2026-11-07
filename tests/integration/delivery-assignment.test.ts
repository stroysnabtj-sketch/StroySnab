import { expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, users } from "@/db/schema";
import { assignOrderDelivery } from "@/modules/orders/delivery-service";
it("assigns a driver, rejects stale edits and keeps order status unchanged", async () => {
  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({ phone: `log-${crypto.randomUUID()}`, passwordHash: "test", role: "LOGISTICS" })
    .returning();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `TEST-${crypto.randomUUID()}`,
      customerName: "Покупатель",
      customerPhone: "+992931234567",
      deliveryAddress: "Рудаки 10",
      status: "CONFIRMED",
      vehicleType: "GAZELLE",
    })
    .returning();
  const input = {
    driverName: "Анвар Водитель",
    driverPhone: "931234567",
    vehiclePlate: "0123 AA 01",
    expectedUpdatedAt: order.updatedAt.toISOString(),
  };
  await assignOrderDelivery({ ...user, role: "LOGISTICS" }, order.id, input);
  const [saved] = await db.select().from(orders).where(eq(orders.id, order.id));
  expect(saved.driverName).toBe(input.driverName);
  expect(saved.driverPhone).toBe("+992931234567");
  expect(saved.status).toBe("CONFIRMED");
  await expect(
    assignOrderDelivery({ ...user, role: "LOGISTICS" }, order.id, input),
  ).rejects.toThrow(/изменён/);
  await expect(
    assignOrderDelivery({ ...user, role: "CUSTOMER" }, order.id, {
      ...input,
      expectedUpdatedAt: saved.updatedAt.toISOString(),
    }),
  ).rejects.toThrow(/прав|доступ/);
});
it("does not assign a driver to a pickup order", async () => {
  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({ phone: `log-${crypto.randomUUID()}`, passwordHash: "test", role: "LOGISTICS" })
    .returning();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `TEST-${crypto.randomUUID()}`,
      customerName: "Покупатель",
      customerPhone: "+992931234567",
      deliveryAddress: "",
      status: "CONFIRMED",
      vehicleType: "PICKUP",
    })
    .returning();
  await expect(
    assignOrderDelivery({ ...user, role: "LOGISTICS" }, order.id, {
      driverName: "Анвар",
      driverPhone: "931234567",
      vehiclePlate: "0123 AA 01",
      expectedUpdatedAt: order.updatedAt.toISOString(),
    }),
  ).rejects.toThrow(/Самовывоз|самовывоз/);
});
