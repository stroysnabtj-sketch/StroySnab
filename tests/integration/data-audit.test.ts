import { expect, it } from "vitest";
import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auditData } from "@/modules/system/data-audit";
it("finds inconsistent line sums without repairing orders and verifies append-only triggers", async () => {
  const db = await getDb();
  const [o] = await db
    .insert(orders)
    .values({
      orderNumber: `AUDIT-${crypto.randomUUID()}`,
      customerName: "Audit",
      customerPhone: "+992900000000",
      deliveryAddress: "Test",
      materialsTotalDirams: "100",
      totalDirams: "100",
      markupPercent: 0,
    })
    .returning();
  const [i] = await db
    .insert(orderItems)
    .values({
      orderId: o.id,
      productName: "Test",
      sku: "AUDIT",
      unit: "шт.",
      qty: "1",
      priceDirams: "99",
      subtotalDirams: "99",
    })
    .returning();
  const report = await auditData(db);
  expect(report.checks.find((c) => c.name === "order_line_sum")?.sample).toContain(o.id);
  expect(report.checks.find((c) => c.name === "price_history_protection")?.count).toBe(0);
  const [unchanged] = await db.select().from(orderItems).where(eq(orderItems.id, i.id));
  expect(unchanged.subtotalDirams).toBe("99");
  await db.delete(orders).where(eq(orders.id, o.id));
});
