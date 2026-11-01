CREATE TABLE "product_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"user_id" uuid,
	"product_name" text NOT NULL,
	"description" text,
	"quantity" numeric(14, 3),
	"unit" text,
	"required_date" date,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"assigned_to" uuid,
	"response_note" text,
	"estimated_price_dirams" bigint,
	"estimated_delivery_days" integer,
	"resolved_product_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_requests_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_resolved_product_id_products_id_fk" FOREIGN KEY ("resolved_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_requests_status_created_idx" ON "product_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "product_requests_user_idx" ON "product_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_requests_phone_idx" ON "product_requests" USING btree ("contact_phone");--> statement-breakpoint
CREATE INDEX "product_requests_fingerprint_idx" ON "product_requests" USING btree ("fingerprint","created_at");