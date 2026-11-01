import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const docCounters = pgTable("doc_counters", {
  kind: text("kind").primaryKey(),
  value: integer("value").notNull().default(0),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});
