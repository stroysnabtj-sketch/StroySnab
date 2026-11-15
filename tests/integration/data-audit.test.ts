import { expect, it } from "vitest";
import { getDb } from "@/db";
import { customers, users, referralBonuses, orders, orderItems } from "@/db/schema";
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

it("detects a missing or inconsistent referral record without modifying customer attribution", async () => {
  const db = await getDb();
  const ids = [] as string[];
  for (let i = 0; i < 3; i++) {
    const [u] = await db
      .insert(users)
      .values({
        email: `audit-ref-${crypto.randomUUID()}@example.test`,
        role: "CUSTOMER",
        passwordHash: "test-not-used-for-login",
      })
      .returning();
    ids.push(u.id);
  }
  const rows = await db
    .insert(customers)
    .values(ids.map((userId) => ({ userId, fullName: "Audit Referral" })))
    .returning();
  await db
    .update(customers)
    .set({ referredByCustomerId: rows[0].id, source: "referral" })
    .where(eq(customers.id, rows[1].id));
  const missing = await auditData(db);
  expect(missing.checks.find((c) => c.name === "referral_link_consistency")?.sample).toContain(
    rows[1].id,
  );
  await db
    .insert(referralBonuses)
    .values({ referrerCustomerId: rows[2].id, referredCustomerId: rows[1].id });
  const mismatch = await auditData(db);
  expect(mismatch.checks.find((c) => c.name === "referral_link_consistency")?.sample).toContain(
    rows[1].id,
  );
  const [unchanged] = await db.select().from(customers).where(eq(customers.id, rows[1].id));
  expect(unchanged.referredByCustomerId).toBe(rows[0].id);
  for (const id of ids) await db.delete(users).where(eq(users.id, id));
});
