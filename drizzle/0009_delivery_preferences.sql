ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_delivery_date text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_time_slot text;
