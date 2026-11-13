ALTER TABLE orders DROP CONSTRAINT orders_quote_nonnegative;
--> statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_quote_nonnegative CHECK (goods_base_dirams IS NULL OR (goods_base_dirams ~ '^[0-9]+$' AND markup_dirams ~ '^[0-9]+$' AND markup_percent BETWEEN 0 AND 1000 AND materials_total_dirams ~ '^[0-9]+$' AND delivery_total_dirams ~ '^[0-9]+$' AND total_dirams ~ '^[0-9]+$' AND materials_total_dirams::numeric = goods_base_dirams::numeric + markup_dirams::numeric AND total_dirams::numeric = materials_total_dirams::numeric + delivery_total_dirams::numeric));
