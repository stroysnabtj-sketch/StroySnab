import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { customers } from "./auth";
import { supplierOffers } from "./catalog";

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").unique().references(() => customers.id, { onDelete: "cascade" }),
  sessionTokenHash: text("session_token_hash").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id").notNull().references(() => supplierOffers.id, { onDelete: "cascade" }),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("cart_items_unique").on(table.cartId, table.offerId), index("cart_items_cart_idx").on(table.cartId)]);
