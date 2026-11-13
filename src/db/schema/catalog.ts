import {
  bigint,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { suppliers } from "./suppliers";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "restrict",
    }),
    slug: text("slug").notNull().unique(),
    nameRu: text("name_ru").notNull(),
    nameTg: text("name_tg"),
    sort: integer("sort").notNull().default(0),
    isActive: text("is_active").notNull().default("true"),
  },
  (table) => [index("categories_parent_idx").on(table.parentId)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull().unique(),
    slug: text("slug").notNull().unique(),
    nameRu: text("name_ru").notNull(),
    nameTg: text("name_tg"),
    descriptionRu: text("description_ru"),
    descriptionTg: text("description_tg"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    brand: text("brand"),
    unit: text("unit").notNull(),
    markupPercent: numeric("markup_percent", { precision: 7, scale: 2 }).notNull().default("7"),
    status: text("status").notNull().default("DRAFT"),
    createdBySupplierId: uuid("created_by_supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("products_category_status_idx").on(table.categoryId, table.status),
    index("products_brand_idx").on(table.brand),
  ],
);

export const productAttributes = pgTable(
  "product_attributes",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    value: text("value").notNull(),
  },
  (table) => [uniqueIndex("product_attributes_unique").on(table.productId, table.name)],
);

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull().unique(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (table) => [index("product_images_product_idx").on(table.productId, table.sort)],
);

export const supplierOffers = pgTable(
  "supplier_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    supplierPriceDirams: bigint("supplier_price_dirams", { mode: "bigint" }).notNull(),
    stockQty: text("stock_qty").notNull().default("0"),
    reservedQty: text("reserved_qty").notNull().default("0"),
    minOrderQty: text("min_order_qty").notNull().default("1"),
    leadTimeDays: integer("lead_time_days").notNull().default(1),
    isActive: text("is_active").notNull().default("true"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("supplier_offers_unique").on(table.productId, table.supplierId),
    index("supplier_offers_supplier_idx").on(table.supplierId),
  ],
);

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: text("scope").notNull().default("GLOBAL"),
  scopeId: uuid("scope_id"),
  type: text("type").notNull().default("PERCENT"),
  value: numeric("value", { precision: 12, scale: 4 }).notNull(),
  priority: integer("priority").notNull().default(0),
  activeFrom: timestamp("active_from", { withTimezone: true }),
  activeTo: timestamp("active_to", { withTimezone: true }),
});
