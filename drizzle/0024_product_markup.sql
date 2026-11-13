ALTER TABLE products ADD COLUMN markup_percent numeric(7,2) NOT NULL DEFAULT 7;
--> statement-breakpoint
ALTER TABLE products ADD CONSTRAINT products_markup_percent_range CHECK (markup_percent >= 0 AND markup_percent <= 1000);
