ALTER TABLE "login_codes" DROP CONSTRAINT "login_codes_purpose_check";
--> statement-breakpoint
ALTER TABLE "login_codes" ADD CONSTRAINT "login_codes_purpose_check"
  CHECK ("purpose" IN ('login', 'register', 'recover'));
