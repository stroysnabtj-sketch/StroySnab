import { bigint, check, date, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { products } from "./catalog";

export const productRequests = pgTable("product_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 14, scale: 3 }),
  unit: text("unit"),
  requiredDate: date("required_date", { mode: "string" }),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("NEW"),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  responseNote: text("response_note"),
  estimatedPriceDirams: bigint("estimated_price_dirams", { mode: "bigint" }),
  estimatedDeliveryDays: integer("estimated_delivery_days"),
  resolvedProductId: uuid("resolved_product_id").references(() => products.id, { onDelete: "set null" }),
  version: integer("version").notNull().default(1),
  fingerprint: text("fingerprint"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("product_requests_status_created_idx").on(table.status, table.createdAt),
  index("product_requests_user_idx").on(table.userId),
  index("product_requests_phone_idx").on(table.contactPhone),
  index("product_requests_fingerprint_idx").on(table.fingerprint, table.createdAt),
  check("product_requests_quantity_check", sql`${table.quantity} IS NULL OR ${table.quantity} > 0`),
  check("product_requests_price_check", sql`${table.estimatedPriceDirams} IS NULL OR ${table.estimatedPriceDirams} >= 0`),
  check("product_requests_delivery_days_check", sql`${table.estimatedDeliveryDays} IS NULL OR (${table.estimatedDeliveryDays} >= 0 AND ${table.estimatedDeliveryDays} <= 365)`),
  check("product_requests_version_check", sql`${table.version} > 0`),
  check("product_requests_status_check", sql`${table.status} IN ('NEW', 'IN_REVIEW', 'AVAILABLE', 'UNAVAILABLE', 'CANCELLED')`),
]);

export const productRequestIdempotency = pgTable("product_request_idempotency", {
  key: text("key").primaryKey(),
  requestId: uuid("request_id").references(() => productRequests.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("product_request_idempotency_expires_idx").on(table.expiresAt),
]);
