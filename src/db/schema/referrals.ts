import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customers } from "./auth";
export const referralBonuses = pgTable(
  "referral_bonuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerCustomerId: uuid("referrer_customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    referredCustomerId: uuid("referred_customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("PENDING"),
    bonusAmountDirams: bigint("bonus_amount_dirams", { mode: "bigint" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("referral_bonuses_referred_uq").on(t.referredCustomerId),
    index("referral_bonuses_referrer_status_idx").on(t.referrerCustomerId, t.status),
    check("referral_bonuses_not_self", sql`${t.referrerCustomerId} <> ${t.referredCustomerId}`),
    check(
      "referral_bonuses_amount_check",
      sql`${t.bonusAmountDirams} IS NULL OR ${t.bonusAmountDirams} >= 0`,
    ),
    check("referral_bonuses_status_check", sql`${t.status} IN ('PENDING','CREDITED','CANCELLED')`),
  ],
);
