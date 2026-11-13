import { pgTable, uuid, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { procurementRequests } from "./procurement";
export type PreparedLine = {
  name: string;
  qty: string;
  unit: string;
  offerId?: string;
  basePriceDirams?: string;
  markupPercent?: string;
  issue?: string;
  requestedName?: string;
  matchScore?: number;
  alternative?: boolean;
};
export const quotationJobs = pgTable(
  "quotation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .unique()
      .references(() => procurementRequests.id, { onDelete: "cascade" }),
    state: text("state").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    claimToken: uuid("claim_token"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    error: text("error"),
    warnings: jsonb("warnings").notNull().default([]).$type<string[]>(),
    lines: jsonb("lines").notNull().default([]).$type<PreparedLine[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quotation_jobs_state_idx").on(t.state, t.createdAt)],
);
