ALTER TABLE "order_items" ADD COLUMN "supplier_id" uuid REFERENCES "suppliers"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "supplier_name" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "supplier_price_dirams" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "supplier_subtotal_dirams" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "shop_status" text NOT NULL DEFAULT 'NEW';
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "shop_updated_at" timestamp with time zone NOT NULL DEFAULT now();
--> statement-breakpoint
UPDATE "order_items" AS line SET "supplier_id" = offer."supplier_id", "supplier_name" = shop."name" FROM "supplier_offers" AS offer JOIN "suppliers" AS shop ON shop."id" = offer."supplier_id" WHERE line."offer_id" = offer."id";
--> statement-breakpoint
CREATE INDEX "order_items_supplier_order_idx" ON "order_items" ("supplier_id", "order_id");
