ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_quantity_check" CHECK ("quantity" IS NULL OR "quantity" > 0);--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_price_check" CHECK ("estimated_price_dirams" IS NULL OR "estimated_price_dirams" >= 0);--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_delivery_days_check" CHECK ("estimated_delivery_days" IS NULL OR ("estimated_delivery_days" >= 0 AND "estimated_delivery_days" <= 365));--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_version_check" CHECK ("version" > 0);--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_status_check" CHECK ("status" IN ('NEW', 'IN_REVIEW', 'AVAILABLE', 'UNAVAILABLE', 'CANCELLED'));--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_request_idempotency" (
	"key" text PRIMARY KEY NOT NULL,
	"request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_request_idempotency_expires_idx" ON "product_request_idempotency" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "product_request_idempotency" ADD CONSTRAINT "product_request_idempotency_request_id_product_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."product_requests"("id") ON DELETE cascade ON UPDATE no action;

