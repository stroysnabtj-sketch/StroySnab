CREATE TABLE "supplier_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"role" text DEFAULT 'STAFF' NOT NULL,
	"created_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_invitations_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "pricing_rules" ALTER COLUMN "value" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "supplier_invitations" ADD CONSTRAINT "supplier_invitations_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invitations" ADD CONSTRAINT "supplier_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "supplier_invitations_supplier_idx" ON "supplier_invitations" USING btree ("supplier_id");