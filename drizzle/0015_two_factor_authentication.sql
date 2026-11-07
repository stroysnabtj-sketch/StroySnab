CREATE TABLE IF NOT EXISTS "user_two_factor" (
 "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
 "secret" text,
 "pending_secret" text,
 "pending_expires_at" timestamptz,
 "enabled_at" timestamptz,
 "last_counter" integer NOT NULL DEFAULT -1,
 "recovery_hashes" jsonb NOT NULL DEFAULT '[]'::jsonb
);
