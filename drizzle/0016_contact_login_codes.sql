ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamptz;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_codes" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
 "identifier" text NOT NULL,
 "channel" text NOT NULL CHECK ("channel" IN ('sms','email')),
 "purpose" text NOT NULL CHECK ("purpose" IN ('login','register')),
 "code_hash" text NOT NULL,
 "registration" jsonb,
 "attempts" integer NOT NULL DEFAULT 0,
 "expires_at" timestamptz NOT NULL,
 "used_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_codes_target_idx" ON "login_codes" ("identifier", "created_at");
