import { randomBytes } from "node:crypto";
import { expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users, customers, supplierOffers } from "@/db/schema";
import { addCartItem, getCart } from "@/modules/cart/service";
import { adoptGuestCart } from "@/modules/cart/adopt-guest-cart";

it("moves a guest cart once, combines matching lines and revokes guest access", async () => {
  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({ phone: `cart-${crypto.randomUUID()}`, passwordHash: "test", role: "CUSTOMER" })
    .returning();
  await db.insert(customers).values({ userId: user.id, fullName: "Покупатель" });
  const [offer] = await db
    .select()
    .from(supplierOffers)
    .where(sql`stock_qty::numeric-reserved_qty::numeric >= 10 AND min_order_qty::numeric <= 1`)
    .limit(1);
  const token = randomBytes(32).toString("hex");
  await addCartItem({ userId: user.id, offerId: offer.id, qty: "2" });
  await addCartItem({ guestToken: token, offerId: offer.id, qty: "1" });
  expect(await adoptGuestCart(user.id, token)).toBe(true);
  expect((await getCart(user.id)).items[0].qty).toBe("3.000");
  expect((await getCart(undefined, token)).items).toHaveLength(0);
  expect(await adoptGuestCart(user.id, token)).toBe(false);
  expect((await getCart(user.id)).items[0].qty).toBe("3.000");
});

it("keeps a guest cart when the signed-in user has no customer profile", async () => {
  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({ phone: `staff-${crypto.randomUUID()}`, passwordHash: "test", role: "ADMIN" })
    .returning();
  const [offer] = await db
    .select()
    .from(supplierOffers)
    .where(sql`stock_qty::numeric-reserved_qty::numeric >= 10 AND min_order_qty::numeric <= 1`)
    .limit(1);
  const token = randomBytes(32).toString("hex");
  await addCartItem({ guestToken: token, offerId: offer.id, qty: "1" });
  expect(await adoptGuestCart(user.id, token)).toBe(false);
  expect((await getCart(undefined, token)).items).toHaveLength(1);
});
