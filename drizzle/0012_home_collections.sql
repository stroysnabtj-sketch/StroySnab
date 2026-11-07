CREATE TABLE IF NOT EXISTS "home_collection_items" (
  "collection" text NOT NULL CHECK ("collection" IN ('new', 'sale')),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "position" integer NOT NULL CHECK ("position" BETWEEN 0 AND 7),
  PRIMARY KEY ("collection", "product_id"),
  CONSTRAINT "home_collection_position_unique" UNIQUE ("collection", "position")
);
