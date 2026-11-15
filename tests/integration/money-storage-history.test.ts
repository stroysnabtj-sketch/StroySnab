import { expect, it } from "vitest";
import { eq, asc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, quotations, procurementRequests, users, orderItems } from "@/db/schema";
import {
  decideQuotation,
  createProcurementRequest,
  saveQuotation,
} from "@/modules/procurement/service";
import { auditData } from "@/modules/system/data-audit";
import type { SessionUser } from "@/modules/auth/session";
it("stores and sorts integer money numerically while returning exact strings above Number precision", async () => {
  const db = await getDb(),
    ids = [] as string[];
  for (const value of ["9", "10", "900719925474099399"]) {
    const [row] = await db
      .insert(orders)
      .values({
        orderNumber: `NUM-${crypto.randomUUID()}`,
        customerName: "Numeric",
        customerPhone: "+992900000000",
        deliveryAddress: "Test",
        materialsTotalDirams: value,
        totalDirams: value,
      })
      .returning();
    expect(row.totalDirams).toBe(value);
    ids.push(row.id);
  }
  const sorted = await db
    .select({ value: orders.totalDirams })
    .from(orders)
    .where(
      sql`${orders.id} in (${sql.join(
        ids.map((id) => sql`${id}::uuid`),
        sql`,`,
      )})`,
    )
    .orderBy(asc(orders.totalDirams));
  expect(sorted.map((r) => r.value)).toEqual(["9", "10", "900719925474099399"]);
  for (const id of ids) await db.delete(orders).where(eq(orders.id, id));
});
it("accepts an older sent quote with its original floor-rounded amounts and policy", async () => {
  const db = await getDb();
  const [buyer] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
  const actor = { ...buyer, role: "CUSTOMER" } as SessionUser;
  const request = await createProcurementRequest(
    {
      title: "Историческое КП",
      contactName: "Покупатель",
      contactPhone: "+992900000000",
      lines: [{ name: "Материал", qty: "0.5", unit: "тонна" }],
    },
    actor,
  );
  await db
    .insert(quotations)
    .values({
      requestId: request.id,
      number: `LEGACY-${crypto.randomUUID()}`,
      status: "SENT",
      validUntil: new Date(Date.now() + 86400000),
      lines: [
        {
          id: crypto.randomUUID(),
          name: "Материал",
          qty: "0.5",
          unit: "тонна",
          basePriceDirams: "101",
          baseSubtotalDirams: "50",
          priceDirams: "101",
          subtotalDirams: "50",
        },
      ],
      baseDirams: "50",
      markupPercent: 0,
      markupDirams: "0",
      deliveryDirams: "0",
      totalDirams: "50",
    });
  const accepted = await decideQuotation(request.id, actor, null, {
    action: "ACCEPT",
    version: 1,
    deliveryAddress: "Душанбе, объект 1",
  });
  const [order] = await db.select().from(orders).where(eq(orders.id, accepted.orderId!));
  expect(order).toMatchObject({ totalDirams: "50", roundingPolicy: "LEGACY_FLOOR" });
  const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  expect(item.subtotalDirams).toBe("50");
  expect(
    (await auditData(db)).checks.find((c) => c.name === "order_line_arithmetic")?.sample,
  ).not.toContain(order.id);
  await db.delete(procurementRequests).where(eq(procurementRequests.id, request.id));
  await db.delete(orders).where(eq(orders.id, order.id));
});
it("snapshots HALF_UP on newly calculated quotations", async () => {
  const db = await getDb();
  const [buyer] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
  const [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const request = await createProcurementRequest(
    {
      title: "Новое КП",
      contactName: "Покупатель",
      contactPhone: "+992900000000",
      lines: [{ name: "Материал", qty: "0.5", unit: "тонна" }],
    },
    { ...buyer, role: "CUSTOMER" } as SessionUser,
  );
  const q = await saveQuotation(request.id, { ...admin, role: "SUPER_ADMIN" } as SessionUser, {
    version: 0,
    send: true,
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    deliveryDirams: "0",
    lines: [
      { name: "Материал", qty: "0.5", unit: "тонна", basePriceDirams: "101", markupPercent: "0" },
    ],
  });
  expect(q).toMatchObject({ totalDirams: "51", baseDirams: "51", roundingPolicy: "HALF_UP" });
  await db.delete(procurementRequests).where(eq(procurementRequests.id, request.id));
});
