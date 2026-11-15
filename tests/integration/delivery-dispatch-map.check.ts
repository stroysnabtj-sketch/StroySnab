import { randomUUID } from "node:crypto";
import { Children, isValidElement, type ReactNode } from "react";
import { eq, inArray } from "drizzle-orm";
import { afterEach, expect, it, vi } from "vitest";
import { getDb } from "@/db";
import { orders, sessions, users } from "@/db/schema";
import { hashToken } from "@/modules/auth/session";
import DeliveriesPage from "@/app/admin/deliveries/page";

const cookie = vi.hoisted(() => ({ token: "" }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: cookie.token }) }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
const userIds: string[] = [];
const orderIds: string[] = [];
afterEach(async () => {
  cookie.token = "";
  const db = await getDb();
  if (orderIds.length) await db.delete(orders).where(inArray(orders.id, orderIds.splice(0)));
  for (const id of userIds.splice(0)) {
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
});
async function authenticate(role: string) {
  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({ phone: `map-${randomUUID()}`, passwordHash: "test", role })
    .returning();
  userIds.push(user.id);
  cookie.token = randomUUID();
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: hashToken(cookie.token),
    expiresAt: new Date(Date.now() + 3600000),
  });
}
function mapProps(tree: ReactNode): Record<string, unknown> | undefined {
  let found: Record<string, unknown> | undefined;
  Children.forEach(tree, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;
    if (typeof child.type === "function" && child.type.name === "DeliveryDispatchMap")
      found = child.props as Record<string, unknown>;
    else found ??= mapProps(child.props.children);
  });
  return found;
}
it("keeps customer delivery coordinates behind deliveries:manage permission", async () => {
  await expect(DeliveriesPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
    "REDIRECT:/auth/login",
  );
  await authenticate("CUSTOMER");
  await expect(DeliveriesPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
    "REDIRECT:/access-denied",
  );
});
it("maps filtered active delivery destinations with their existing date and time window", async () => {
  await authenticate("LOGISTICS");
  const db = await getDb();
  const prefix = `MAP-${randomUUID()}`;
  const inserted = await db
    .insert(orders)
    .values([
      {
        orderNumber: `${prefix}-active`,
        customerName: "Map test",
        customerPhone: "+992900000000",
        deliveryAddress: "Test destination",
        deliveryLat: "38.559800",
        deliveryLng: "68.787000",
        status: "CONFIRMED",
        vehicleType: "GAZELLE",
        preferredDeliveryDate: "2026-12-01",
        preferredTimeSlot: "AFTERNOON",
      },
      {
        orderNumber: `${prefix}-complete`,
        customerName: "Map test",
        customerPhone: "+992900000000",
        deliveryAddress: "Completed",
        status: "DELIVERED",
        vehicleType: "GAZELLE",
      },
      {
        orderNumber: `${prefix}-pickup`,
        customerName: "Map test",
        customerPhone: "+992900000000",
        deliveryAddress: "Pickup",
        status: "CONFIRMED",
        vehicleType: "PICKUP",
      },
      {
        orderNumber: `${prefix}-no-point`,
        customerName: "Map test",
        customerPhone: "+992900000000",
        deliveryAddress: "No coordinates",
        status: "NEW",
        vehicleType: "GAZELLE",
      },
    ])
    .returning();
  orderIds.push(...inserted.map((order) => order.id));
  const props = mapProps(await DeliveriesPage({ searchParams: Promise.resolve({ q: prefix }) }));
  expect(props).toMatchObject({ total: 2, limit: 100 });
  expect(props?.deliveries).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: inserted[0].id,
        lat: "38.559800",
        lng: "68.787000",
        date: "2026-12-01",
        timeSlot: "AFTERNOON",
      }),
      expect.objectContaining({ id: inserted[3].id, lat: null, lng: null }),
    ]),
  );
  expect(props?.deliveries).toHaveLength(2);
  const filtered = mapProps(
    await DeliveriesPage({ searchParams: Promise.resolve({ q: prefix, status: "NEW" }) }),
  );
  expect(filtered).toMatchObject({
    total: 1,
    deliveries: [expect.objectContaining({ id: inserted[3].id })],
  });
});

it.each(["LOGISTICS", "PROCUREMENT_MANAGER"])(
  "keeps financial order links hidden for %s while allowing dispatch",
  async (role) => {
    await authenticate(role);
    const props = mapProps(await DeliveriesPage({ searchParams: Promise.resolve({}) }));
    expect(props?.canViewOrders).toBe(false);
  },
);
