import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  taxId: text("tax_id"),
  phone: text("phone").notNull(),
  email: text("email"),
  status: text("status").notNull().default("PENDING"),
  commissionRuleId: uuid("commission_rule_id"),
  payoutDetails: text("payout_details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supplierUsers = pgTable("supplier_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("STAFF"),
  permissions: jsonb("permissions"),
}, (table) => [index("supplier_users_supplier_idx").on(table.supplierId)]);

export const supplierInvitations = pgTable("supplier_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull().unique(),
  role: text("role").notNull().default("STAFF"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("supplier_invitations_supplier_idx").on(table.supplierId)]);
