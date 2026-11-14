CREATE TABLE price_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 entity_type text NOT NULL CHECK (entity_type IN ('supplier_offer','product_markup','pricing_rule')),
 entity_id uuid NOT NULL,
 operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
 "before" jsonb, "after" jsonb,
 recorded_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX price_history_entity_idx ON price_history(entity_type,entity_id,recorded_at);
--> statement-breakpoint
CREATE FUNCTION record_price_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous jsonb; current_value jsonb; kind text; identity_id uuid;
BEGIN
 IF TG_TABLE_NAME='supplier_offers' THEN
  kind:='supplier_offer';
  IF TG_OP<>'INSERT' THEN previous:=jsonb_build_object('productId',OLD.product_id,'supplierId',OLD.supplier_id,'supplierPriceDirams',OLD.supplier_price_dirams::text); END IF;
  IF TG_OP<>'DELETE' THEN current_value:=jsonb_build_object('productId',NEW.product_id,'supplierId',NEW.supplier_id,'supplierPriceDirams',NEW.supplier_price_dirams::text); END IF;
 ELSIF TG_TABLE_NAME='products' THEN
  kind:='product_markup';
  IF TG_OP<>'INSERT' THEN previous:=jsonb_build_object('sku',OLD.sku,'markupPercent',OLD.markup_percent::text); END IF;
  IF TG_OP<>'DELETE' THEN current_value:=jsonb_build_object('sku',NEW.sku,'markupPercent',NEW.markup_percent::text); END IF;
 ELSE
  kind:='pricing_rule';
  IF TG_OP<>'INSERT' THEN previous:=to_jsonb(OLD); END IF;
  IF TG_OP<>'DELETE' THEN current_value:=to_jsonb(NEW); END IF;
 END IF;
 IF TG_OP='DELETE' THEN identity_id:=OLD.id; ELSE identity_id:=NEW.id; END IF;
 IF previous IS DISTINCT FROM current_value THEN
  INSERT INTO price_history(entity_type,entity_id,operation,"before","after") VALUES(kind,identity_id,TG_OP,previous,current_value);
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER supplier_offers_price_history AFTER INSERT OR UPDATE OR DELETE ON supplier_offers FOR EACH ROW EXECUTE FUNCTION record_price_change();
--> statement-breakpoint
CREATE TRIGGER products_price_history AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION record_price_change();
--> statement-breakpoint
CREATE TRIGGER pricing_rules_price_history AFTER INSERT OR UPDATE OR DELETE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION record_price_change();
--> statement-breakpoint
CREATE FUNCTION protect_price_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'price_history is append-only' USING ERRCODE='55000'; END $$;
--> statement-breakpoint
CREATE TRIGGER price_history_protect_rows BEFORE UPDATE OR DELETE ON price_history FOR EACH ROW EXECUTE FUNCTION protect_price_history();
--> statement-breakpoint
CREATE TRIGGER price_history_protect_truncate BEFORE TRUNCATE ON price_history FOR EACH STATEMENT EXECUTE FUNCTION protect_price_history();
