ALTER TABLE "orders" ADD COLUMN "customer_email" text;
--> statement-breakpoint
ALTER TABLE "notification_outbox" DROP CONSTRAINT "notification_outbox_channel_check";
--> statement-breakpoint
ALTER TABLE "notification_outbox"
  ADD CONSTRAINT "notification_outbox_channel_check" CHECK ("channel" IN ('sms', 'email'));
