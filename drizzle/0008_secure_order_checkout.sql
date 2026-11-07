ALTER TABLE orders ADD COLUMN guest_access_token_hash text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN idempotency_key text UNIQUE;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN goods_base_dirams text;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN markup_percent integer;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN markup_dirams text;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN driver_name DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN driver_phone DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN vehicle_plate DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN estimated_weight_kg DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN estimated_volume_m3 DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_quote_nonnegative CHECK (goods_base_dirams IS NULL OR (goods_base_dirams ~ '^[0-9]+$' AND markup_dirams ~ '^[0-9]+$' AND markup_percent IN (3,5,7) AND materials_total_dirams ~ '^[0-9]+$' AND delivery_total_dirams ~ '^[0-9]+$' AND total_dirams ~ '^[0-9]+$' AND total_dirams::numeric = materials_total_dirams::numeric + delivery_total_dirams::numeric));

