import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventKey: text("event_key").notNull().unique(),
    event: text("event").notNull(),
    entityId: uuid("entity_id").notNull(),
    version: text("version").notNull(),
    channel: text("channel").notNull().default("sms"),
    audience: text("audience").notNull(),
    supplierId: uuid("supplier_id"),
    recipient: text("recipient").notNull(),
    body: text("body").notNull(),
    state: text("state").notNull().default("queued"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    claimToken: uuid("claim_token"),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notification_outbox_dispatch_idx").on(table.state, table.availableAt),
    index("notification_outbox_entity_idx").on(table.entityId),
  ],
);

export const notificationAttempts = pgTable(
  "notification_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notificationOutbox.id, { onDelete: "cascade" }),
    claimToken: uuid("claim_token").notNull().unique(),
    state: text("state").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [index("notification_attempts_notification_idx").on(table.notificationId)],
);

// Locked in the same transaction as a claim, making the daily spending cap global.
export const notificationDispatchBudget = pgTable("notification_dispatch_budget", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  used: integer("used").notNull().default(0),
});
