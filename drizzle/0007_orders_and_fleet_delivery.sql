CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_number" text NOT NULL UNIQUE,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "customer_phone" text NOT NULL,
  "customer_name" text NOT NULL,
  "delivery_city" text DEFAULT 'Кушониён' NOT NULL,
  "delivery_address" text NOT NULL,
  "delivery_notes" text,
  "vehicle_type" text DEFAULT 'GAZELLE' NOT NULL,
  "unloading_type" text DEFAULT 'SELF' NOT NULL,
  "status" text DEFAULT 'CONFIRMED' NOT NULL,
  "payment_method" text DEFAULT 'CASH_ON_DELIVERY' NOT NULL,
  "materials_total_dirams" text DEFAULT '0' NOT NULL,
  "delivery_total_dirams" text DEFAULT '0' NOT NULL,
  "total_dirams" text DEFAULT '0' NOT NULL,
  "estimated_weight_kg" numeric(10, 2) DEFAULT '1500',
  "estimated_volume_m3" numeric(8, 2) DEFAULT '3.5',
  "driver_name" text DEFAULT 'Бахром Саидов',
  "driver_phone" text DEFAULT '+992 90 777 1234',
  "vehicle_plate" text DEFAULT '01 777 TJ',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "offer_id" uuid REFERENCES "supplier_offers"("id") ON DELETE SET NULL,
  "product_name" text NOT NULL,
  "sku" text NOT NULL,
  "unit" text DEFAULT 'шт.' NOT NULL,
  "qty" numeric(14, 3) NOT NULL,
  "price_dirams" text NOT NULL,
  "subtotal_dirams" text NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");
