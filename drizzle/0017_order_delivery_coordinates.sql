ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_lat" numeric(9,6);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_lng" numeric(9,6);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "order_delivery_point_valid" CHECK (("delivery_lat" IS NULL AND "delivery_lng" IS NULL) OR ("delivery_lat" BETWEEN -90 AND 90 AND "delivery_lng" BETWEEN -180 AND 180));
