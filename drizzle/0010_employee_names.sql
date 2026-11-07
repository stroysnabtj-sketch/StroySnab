ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" text;
--> statement-breakpoint
UPDATE "users" SET "full_name" = "customers"."full_name" FROM "customers" WHERE "customers"."user_id" = "users"."id" AND "users"."full_name" IS NULL;
