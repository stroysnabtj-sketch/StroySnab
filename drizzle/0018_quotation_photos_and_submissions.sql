ALTER TABLE "procurement_requests" ADD COLUMN IF NOT EXISTS "submission_key" text UNIQUE;
--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD COLUMN IF NOT EXISTS "submission_digest" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "image_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_images" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"request_id" uuid NOT NULL REFERENCES "procurement_requests"("id") ON DELETE CASCADE,"storage_key" text NOT NULL,"mime" text NOT NULL,"size" integer NOT NULL,"created_at" timestamptz NOT NULL DEFAULT now());
