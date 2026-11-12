ALTER TABLE "notification_outbox" DROP CONSTRAINT "notification_outbox_audience_check";
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_audience_check" CHECK ("audience" IN ('customer', 'shop', 'admin'));
--> statement-breakpoint
UPDATE "notification_outbox" SET "state" = 'failed', "last_error" = 'supplier_portal_retired', "lease_until" = NULL, "claim_token" = NULL WHERE "audience" = 'shop' AND "state" = 'queued';
--> statement-breakpoint
DELETE FROM "sessions" WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "role" IN ('SUPPLIER_OWNER', 'SUPPLIER_STAFF'));
--> statement-breakpoint
UPDATE "users" SET "status" = 'BLOCKED' WHERE "role" IN ('SUPPLIER_OWNER', 'SUPPLIER_STAFF');
