ALTER TABLE "home_collection_items" DROP CONSTRAINT IF EXISTS "home_collection_items_position_check";
--> statement-breakpoint
ALTER TABLE "home_collection_items" DROP CONSTRAINT IF EXISTS "home_collection_position_check";
--> statement-breakpoint
ALTER TABLE "home_collection_items" ADD CONSTRAINT "home_collection_position_check" CHECK ("position" BETWEEN 0 AND 11);
