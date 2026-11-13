import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { orders } from "./orders";

export const procurementRequests = pgTable(
  "procurement_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    submissionKey: text("submission_key").unique(),
    submissionDigest: text("submission_digest"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestTokenHash: text("guest_token_hash"),
    title: text("title").notNull(),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email"),
    note: text("note"),
    status: text("status").notNull().default("NEW"),
    lines: jsonb("lines").notNull().$type<Array<{ name: string; qty: string; unit: string }>>(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("procurement_owner_idx").on(t.userId),
    index("procurement_status_idx").on(t.status),
  ],
);

export type QuotationLine = {
  id?: string;
  imageIds?: string[];
  name: string;
  qty: string;
  unit: string;
  offerId?: string | null;
  productId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  basePriceDirams: string;
  markupPercent?: string;
  baseSubtotalDirams: string;
  priceDirams: string;
  subtotalDirams: string;
};
export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .unique()
    .references(() => procurementRequests.id, { onDelete: "cascade" }),
  number: text("number").notNull().unique(),
  status: text("status").notNull().default("DRAFT"),
  version: integer("version").notNull().default(1),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  conditions: text("conditions").notNull().default(""),
  lines: jsonb("lines").notNull().$type<QuotationLine[]>(),
  baseDirams: text("base_dirams").notNull(),
  markupPercent: integer("markup_percent").notNull(),
  markupDirams: text("markup_dirams").notNull(),
  deliveryDirams: text("delivery_dirams").notNull().default("0"),
  totalDirams: text("total_dirams").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const procurementAttachments = pgTable("procurement_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => procurementRequests.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const orderPayments = pgTable(
  "order_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    amountDirams: text("amount_dirams").notNull(),
    reason: text("reason").notNull(),
    reference: text("reference"),
    method: text("method").notNull().default("BANK_TRANSFER"),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    idempotencyKey: uuid("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("order_payment_idempotency_idx").on(t.orderId, t.idempotencyKey),
    index("order_payment_order_idx").on(t.orderId),
  ],
);

export const quotationImages = pgTable("quotation_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => procurementRequests.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
