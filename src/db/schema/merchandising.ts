import { check, integer, pgTable, primaryKey, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./catalog";

export const homeCollectionItems = pgTable(
  "home_collection_items",
  {
    collection: text("collection").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collection, table.productId] }),
    uniqueIndex("home_collection_position_unique").on(table.collection, table.position),
    check("home_collection_kind_check", sql`${table.collection} in ('new', 'sale')`),
    check("home_collection_position_check", sql`${table.position} between 0 and 11`),
  ],
);
