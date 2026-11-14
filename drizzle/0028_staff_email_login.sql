ALTER TABLE login_codes ADD COLUMN credential_hash text;
--> statement-breakpoint
ALTER TABLE login_codes DROP CONSTRAINT login_codes_purpose_check;
--> statement-breakpoint
ALTER TABLE login_codes ADD CONSTRAINT login_codes_purpose_check CHECK (purpose IN ('login','register','recover','staff_login'));
