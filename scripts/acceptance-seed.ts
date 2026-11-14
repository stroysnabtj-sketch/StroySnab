import { getDb, closeDb } from "../src/db";
import { users, sessions, supplierOffers, products } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { seedDatabase } from "./seed";
import { addCartItem } from "../src/modules/cart/service";
import { createOrder, changeOrderStatus } from "../src/modules/orders/service";
import { createProcurementRequest, saveQuotation } from "../src/modules/procurement/service";
import type { SessionUser } from "../src/modules/auth/session";
(async () => {
  if (process.env.DATABASE_URL || !process.env.PGLITE_DATA_DIR?.includes("acceptance"))
    throw Error("Acceptance seed requires isolated local database");
  const db = await getDb();
  await seedDatabase(db);
  const [customer] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
  const [staff] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const tokens: Record<string, string> = {};
  for (const user of [customer, staff]) {
    const token = randomBytes(32).toString("base64url");
    await db
      .insert(sessions)
      .values({
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 3600000),
      });
    tokens[user.role] = token;
  }
  const offers = await db
    .select({ offer: supplierOffers, product: products })
    .from(supplierOffers)
    .innerJoin(products, eq(products.id, supplierOffers.productId))
    .where(
      sql`${products.status}='PUBLISHED' and ${supplierOffers.stockQty}::numeric-${supplierOffers.reservedQty}::numeric>=3 and ${supplierOffers.minOrderQty}::numeric<=1`,
    )
    .orderBy(products.sku, supplierOffers.id)
    .limit(3);
  await addCartItem({ userId: customer.id, offerId: offers[0].offer.id, qty: "1" });
  const order = await createOrder({
    userId: customer.id,
    idempotencyKey: crypto.randomUUID(),
    customerName: "Демонстрационный покупатель",
    customerPhone: "+992900000000",
    fulfillment: "PICKUP",
    paymentMethod: "CASH_ON_DELIVERY",
    deliveryCity: "Душанбе",
    deliveryAddress: "",
  });
  await changeOrderStatus({ id: staff.id, role: "SUPER_ADMIN" }, order.id, {
    status: "CONFIRMED",
    expectedStatus: "NEW",
  });
  const actor = {
    id: customer.id,
    role: "CUSTOMER",
    email: customer.email,
    phone: customer.phone,
  } as SessionUser;
  const request = await createProcurementRequest(
    {
      title: "Материалы для демонстрации",
      contactName: "Демонстрационный покупатель",
      contactPhone: "+992900000000",
      contactEmail: "demo@example.test",
      lines: offers.map(({ product }) => ({ name: product.nameRu, qty: "1", unit: product.unit })),
    },
    actor,
  );
  await saveQuotation(
    request.id,
    { id: staff.id, role: "SUPER_ADMIN", email: staff.email, phone: staff.phone },
    {
      version: 0,
      send: true,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      deliveryDirams: "0",
      lines: offers.map(({ product, offer }) => ({
        name: product.nameRu,
        qty: "1",
        unit: product.unit,
        offerId: offer.id,
        basePriceDirams: offer.supplierPriceDirams.toString(),
      })),
    },
  );
  writeFileSync(
    ".data/acceptance-session.json",
    JSON.stringify({
      token: tokens.CUSTOMER,
      staffToken: tokens.SUPER_ADMIN,
      orderId: order.id,
      requestId: request.id,
    }),
  );
  await closeDb();
})().catch((e) => {
  console.error("Acceptance seed failed", e.code || e.name);
  process.exitCode = 1;
});
