import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { getDb } from "@/db";
import { orders, orderItems, suppliers } from "@/db/schema";
import {
  notificationOutbox,
  notificationAttempts,
  notificationDispatchBudget,
} from "@/db/schema/notifications";
import {
  enqueueOrderNotifications,
  enqueueQuoteReadyNotification,
} from "@/modules/notifications/events";
import { dispatchNotifications, retryNotification } from "@/modules/notifications/worker";
import { getOrder } from "@/modules/orders/service";

it("delivers a signed guest link on both channels without storing it in the outbox", async () => {
  const db = await getDb();
  vi.stubEnv("APP_URL", "https://shop.example");
  vi.stubEnv("ORDER_GUEST_LINK_SECRET", "test-signing-secret-at-least-32-characters");
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `GUEST-${randomUUID()}`,
      customerName: "Guest",
      customerPhone: "+992900111224",
      customerEmail: "guest@example.test",
      deliveryAddress: "Test",
      guestAccessTokenHash: "cart-token-hash",
    })
    .returning();
  try {
    await db.transaction((tx) =>
      enqueueOrderNotifications(tx, {
        orderId: order.id,
        event: "ORDER_CONFIRMED",
        version: "1",
      }),
    );
    const rows = await db
      .select()
      .from(notificationOutbox)
      .where(eq(notificationOutbox.entityId, order.id));
    expect(rows.map((row) => row.channel).sort()).toEqual(["email", "sms"]);
    for (const row of rows) {
      expect(row.body).not.toContain("https://");
      const send = vi.fn(async () => ({ providerMessageId: randomUUID() }));
      await dispatchNotifications(
        db,
        { send },
        {
          channel: row.channel as "sms" | "email",
          onlyIds: [row.id],
        },
      );
      expect(send).toHaveBeenCalledOnce();
      const body = (send.mock.calls[0] as unknown as [{ body: string }])[0].body;
      const token = new URL(body.split(" ").at(-1)!).hash.slice(1);
      expect(await getOrder(order.id, { guestToken: token })).not.toBeNull();
      expect(await getOrder(order.id, { guestToken: token.slice(0, -1) + "!" })).toBeNull();
      expect(await getOrder(order.id, {})).toBeNull();
    }
  } finally {
    vi.unstubAllEnvs();
    await db.delete(notificationOutbox).where(eq(notificationOutbox.entityId, order.id));
    await db.delete(orders).where(eq(orders.id, order.id));
  }
});

it("queues atomically, deduplicates phones and keeps shops isolated without internal prices", async () => {
  const db = await getDb();
  const [a, b] = await db
    .insert(suppliers)
    .values([
      { name: "Shop A", phone: "+992900111221" },
      { name: "Shop B", phone: "+992900111222" },
    ])
    .returning();
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `SMS-${randomUUID()}`,
      customerName: "Test",
      customerPhone: "+992900111223",
      deliveryAddress: "Test",
    })
    .returning();
  await db.insert(orderItems).values(
    [a, b].map((supplier) => ({
      orderId: order.id,
      supplierId: supplier.id,
      productName: supplier.name,
      sku: "test",
      qty: "1",
      priceDirams: "999",
      subtotalDirams: "999",
      supplierPriceDirams: "777",
    })),
  );
  await expect(
    db.transaction(async (tx) => {
      await enqueueOrderNotifications(tx, {
        orderId: order.id,
        event: "ORDER_CREATED",
        version: "rollback",
      });
      throw new Error("rollback");
    }),
  ).rejects.toThrow("rollback");
  expect(
    await db.select().from(notificationOutbox).where(eq(notificationOutbox.entityId, order.id)),
  ).toHaveLength(0);
  for (let n = 0; n < 2; n++)
    await db.transaction((tx) =>
      enqueueOrderNotifications(tx, { orderId: order.id, event: "ORDER_CREATED", version: "1" }),
    );
  const rows = await db
    .select()
    .from(notificationOutbox)
    .where(eq(notificationOutbox.entityId, order.id));
  expect(rows).toHaveLength(3);
  expect(rows.map((r) => r.recipient).sort()).toEqual(
    [a.phone, b.phone, order.customerPhone].sort(),
  );
  expect(rows.map((row) => row.body)).toEqual(Array(3).fill(`Заказ ${order.orderNumber}: принят.`));
  expect(rows.find((r) => r.recipient === a.phone)?.body).not.toContain(b.name);
  await db.transaction((tx) =>
    enqueueOrderNotifications(tx, {
      orderId: order.id,
      event: "SHOP_STATUS_CHANGED",
      version: "2",
      supplierId: a.id,
      shopStatus: "READY",
    }),
  );
  expect(
    (await db.select().from(notificationOutbox).where(eq(notificationOutbox.entityId, order.id)))
      .filter((r) => r.event === "SHOP_STATUS_CHANGED")
      .map((r) => r.recipient),
  ).toEqual([a.phone]);
  await db.delete(notificationOutbox).where(eq(notificationOutbox.entityId, order.id));
  await db.delete(orders).where(eq(orders.id, order.id));
  await db.delete(suppliers).where(inArray(suppliers.id, [a.id, b.id]));
});

it("does not claim when disconnected, retries bounded failures, and acceptance is never delivery", async () => {
  const db = await getDb();
  const id = randomUUID();
  await db.insert(notificationOutbox).values({
    id,
    eventKey: id,
    event: "ORDER_CREATED",
    entityId: randomUUID(),
    version: "1",
    audience: "customer",
    recipient: "+992900111224",
    body: "Test",
    maxAttempts: 2,
  });
  const options = { onlyIds: [id], now: new Date(Date.now() + 1000), batchSize: 1 };
  expect((await dispatchNotifications(db, null, options)).processed).toBe(0);
  expect(
    (await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id)))[0]
      .attemptCount,
  ).toBe(0);
  const failing = {
    send: async () => {
      throw new Error("secret provider response must not be stored");
    },
  };
  await dispatchNotifications(db, failing, options);
  let [row] = await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id));
  expect(row.state).toBe("queued");
  expect(row.lastError).toBe("provider_send_failed");
  await dispatchNotifications(db, failing, {
    ...options,
    now: new Date(options.now.getTime() + 3600000),
  });
  [row] = await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id));
  expect(row.state).toBe("failed");
  expect(row.attemptCount).toBe(2);
  await retryNotification(db, id);
  await dispatchNotifications(
    db,
    { send: async () => ({ providerMessageId: "fake-accepted" }) },
    { ...options, now: new Date(Date.now() + 7200000) },
  );
  [row] = await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id));
  expect(row.state).toBe("accepted");
  expect(row.deliveredAt).toBeNull();
  expect(
    await db.select().from(notificationAttempts).where(eq(notificationAttempts.notificationId, id)),
  ).toHaveLength(3);
  await db.delete(notificationOutbox).where(eq(notificationOutbox.id, id));
});

it("leases concurrent workers so one notification is sent once", async () => {
  const db = await getDb();
  const id = randomUUID();
  await db.insert(notificationOutbox).values({
    id,
    eventKey: id,
    event: "ORDER_CREATED",
    entityId: randomUUID(),
    version: "1",
    audience: "customer",
    recipient: "+992900111224",
    body: "Test",
  });
  let sends = 0;
  const transport = {
    send: async () => {
      sends++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { providerMessageId: "concurrent" };
    },
  };
  const results = await Promise.all([
    dispatchNotifications(db, transport, { onlyIds: [id] }),
    dispatchNotifications(db, transport, { onlyIds: [id] }),
  ]);
  expect(results.reduce((sum, r) => sum + r.processed, 0)).toBe(1);
  expect(sends).toBe(1);
  await db.delete(notificationOutbox).where(eq(notificationOutbox.id, id));
});

it("enforces a global daily budget across workers and marks expired final attempts failed", async () => {
  const db = await getDb();
  const ids = [randomUUID(), randomUUID()];
  const now = new Date("2091-01-01T00:00:00Z");
  await db.delete(notificationDispatchBudget);
  await db.insert(notificationOutbox).values(
    ids.map((id) => ({
      id,
      eventKey: id,
      event: "ORDER_CREATED",
      entityId: randomUUID(),
      version: "1",
      audience: "customer",
      recipient: "+992900111224",
      body: "Test",
    })),
  );
  const transport = { send: async () => ({ providerMessageId: "budget" }) };
  await Promise.all([
    dispatchNotifications(db, transport, { onlyIds: ids, now, dailyLimit: 1 }),
    dispatchNotifications(db, transport, { onlyIds: ids, now, dailyLimit: 1 }),
  ]);
  const rows = await db
    .select()
    .from(notificationOutbox)
    .where(inArray(notificationOutbox.id, ids));
  expect(rows.filter((row) => row.state === "accepted")).toHaveLength(1);
  expect(rows.filter((row) => row.state === "queued")).toHaveLength(1);
  await dispatchNotifications(db, transport, {
    onlyIds: ids,
    now: new Date("2091-01-02T00:00:00Z"),
    dailyLimit: 1,
  });
  expect(
    (await db.select().from(notificationOutbox).where(inArray(notificationOutbox.id, ids))).every(
      (row) => row.state === "accepted",
    ),
  ).toBe(true);
  const exhaustedId = randomUUID();
  const expiredClaim = randomUUID();
  await db.insert(notificationOutbox).values({
    id: exhaustedId,
    eventKey: exhaustedId,
    event: "ORDER_CREATED",
    entityId: randomUUID(),
    version: "1",
    audience: "customer",
    recipient: "+992900111224",
    body: "Test",
    maxAttempts: 1,
    attemptCount: 1,
    claimToken: expiredClaim,
    leaseUntil: new Date("2091-01-01T00:00:00Z"),
  });
  await db
    .insert(notificationAttempts)
    .values({ notificationId: exhaustedId, claimToken: expiredClaim, state: "sending" });
  await dispatchNotifications(db, transport, {
    onlyIds: [exhaustedId],
    now: new Date("2091-01-03T00:00:00Z"),
  });
  expect(
    (await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, exhaustedId)))[0]
      .state,
  ).toBe("failed");
  expect(
    (
      await db
        .select()
        .from(notificationAttempts)
        .where(eq(notificationAttempts.notificationId, exhaustedId))
    )[0].state,
  ).toBe("failed");
  await db.delete(notificationOutbox).where(inArray(notificationOutbox.id, [...ids, exhaustedId]));
  await db.delete(notificationDispatchBudget);
});

it("adds only a configured secure account link to the published quote notification", async () => {
  const db = await getDb();
  const requestId = randomUUID();
  vi.stubEnv("APP_URL", "https://store.example.test/ignored?token=secret");
  try {
    await db.transaction((tx) =>
      enqueueQuoteReadyNotification(tx, {
        requestId,
        customerUserId: requestId,
        quoteId: randomUUID(),
        quoteNumber: "КП-1",
        version: "1",
        customerPhone: "+992900111224",
      }),
    );
    const [row] = await db
      .select()
      .from(notificationOutbox)
      .where(eq(notificationOutbox.entityId, requestId));
    expect(row.body).toContain(`https://store.example.test/requests/${requestId}`);
    expect(row.body).not.toContain("secret");
  } finally {
    vi.unstubAllEnvs();
    await db.delete(notificationOutbox).where(eq(notificationOutbox.entityId, requestId));
  }
});
