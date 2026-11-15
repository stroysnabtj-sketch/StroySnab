ALTER TABLE orders DROP CONSTRAINT orders_quote_nonnegative;
--> statement-breakpoint
ALTER TABLE order_payments DROP CONSTRAINT order_payments_amount_dirams_check;
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM orders WHERE goods_base_dirams IS NOT NULL AND (goods_base_dirams !~ '^[0-9]+$' OR length(ltrim(goods_base_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in orders.goods_base_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN goods_base_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN goods_base_dirams TYPE numeric(38,0) USING goods_base_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM orders WHERE markup_dirams IS NOT NULL AND (markup_dirams !~ '^[0-9]+$' OR length(ltrim(markup_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in orders.markup_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN markup_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN markup_dirams TYPE numeric(38,0) USING markup_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM orders WHERE materials_total_dirams IS NOT NULL AND (materials_total_dirams !~ '^[0-9]+$' OR length(ltrim(materials_total_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in orders.materials_total_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN materials_total_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN materials_total_dirams TYPE numeric(38,0) USING materials_total_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM orders WHERE delivery_total_dirams IS NOT NULL AND (delivery_total_dirams !~ '^[0-9]+$' OR length(ltrim(delivery_total_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in orders.delivery_total_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN delivery_total_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN delivery_total_dirams TYPE numeric(38,0) USING delivery_total_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM orders WHERE total_dirams IS NOT NULL AND (total_dirams !~ '^[0-9]+$' OR length(ltrim(total_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in orders.total_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN total_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN total_dirams TYPE numeric(38,0) USING total_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM order_items WHERE supplier_price_dirams IS NOT NULL AND (supplier_price_dirams !~ '^[0-9]+$' OR length(ltrim(supplier_price_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in order_items.supplier_price_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN supplier_price_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN supplier_price_dirams TYPE numeric(38,0) USING supplier_price_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM order_items WHERE supplier_subtotal_dirams IS NOT NULL AND (supplier_subtotal_dirams !~ '^[0-9]+$' OR length(ltrim(supplier_subtotal_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in order_items.supplier_subtotal_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN supplier_subtotal_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN supplier_subtotal_dirams TYPE numeric(38,0) USING supplier_subtotal_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM order_items WHERE price_dirams IS NOT NULL AND (price_dirams !~ '^[0-9]+$' OR length(ltrim(price_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in order_items.price_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN price_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN price_dirams TYPE numeric(38,0) USING price_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM order_items WHERE subtotal_dirams IS NOT NULL AND (subtotal_dirams !~ '^[0-9]+$' OR length(ltrim(subtotal_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in order_items.subtotal_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN subtotal_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE order_items ALTER COLUMN subtotal_dirams TYPE numeric(38,0) USING subtotal_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM quotations WHERE base_dirams IS NOT NULL AND (base_dirams !~ '^[0-9]+$' OR length(ltrim(base_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in quotations.base_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN base_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN base_dirams TYPE numeric(38,0) USING base_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM quotations WHERE markup_dirams IS NOT NULL AND (markup_dirams !~ '^[0-9]+$' OR length(ltrim(markup_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in quotations.markup_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN markup_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN markup_dirams TYPE numeric(38,0) USING markup_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM quotations WHERE delivery_dirams IS NOT NULL AND (delivery_dirams !~ '^[0-9]+$' OR length(ltrim(delivery_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in quotations.delivery_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN delivery_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN delivery_dirams TYPE numeric(38,0) USING delivery_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM quotations WHERE total_dirams IS NOT NULL AND (total_dirams !~ '^[0-9]+$' OR length(ltrim(total_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in quotations.total_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN total_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN total_dirams TYPE numeric(38,0) USING total_dirams::numeric(38,0);
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM order_payments WHERE amount_dirams IS NOT NULL AND (amount_dirams !~ '^[0-9]+$' OR length(ltrim(amount_dirams, '0')) > 38)) THEN RAISE EXCEPTION 'Invalid integer money in order_payments.amount_dirams'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE order_payments ALTER COLUMN amount_dirams DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE order_payments ALTER COLUMN amount_dirams TYPE numeric(38,0) USING amount_dirams::numeric(38,0);
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN materials_total_dirams SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN delivery_total_dirams SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE orders ALTER COLUMN total_dirams SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE quotations ALTER COLUMN delivery_dirams SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN rounding_policy text NOT NULL DEFAULT 'LEGACY_FLOOR' CHECK (rounding_policy IN ('LEGACY_FLOOR','HALF_UP'));
--> statement-breakpoint
ALTER TABLE quotations ADD COLUMN rounding_policy text NOT NULL DEFAULT 'LEGACY_FLOOR' CHECK (rounding_policy IN ('LEGACY_FLOOR','HALF_UP'));

--> statement-breakpoint
ALTER TABLE orders ADD CONSTRAINT orders_quote_nonnegative CHECK (goods_base_dirams IS NULL OR (goods_base_dirams >= 0 AND markup_dirams >= 0 AND markup_percent BETWEEN 0 AND 1000 AND materials_total_dirams >= 0 AND delivery_total_dirams >= 0 AND total_dirams >= 0 AND materials_total_dirams = goods_base_dirams + markup_dirams AND total_dirams = materials_total_dirams + delivery_total_dirams));
--> statement-breakpoint
ALTER TABLE order_payments ADD CONSTRAINT order_payments_amount_dirams_check CHECK (amount_dirams > 0);
