CREATE UNIQUE INDEX customers_referral_code_uq ON customers (referral_code) WHERE referral_code IS NOT NULL;
--> statement-breakpoint
ALTER TABLE customers ADD CONSTRAINT customers_referral_not_self CHECK (referred_by_customer_id IS NULL OR referred_by_customer_id <> id);
--> statement-breakpoint
ALTER TABLE customers ADD CONSTRAINT customers_referrer_fk FOREIGN KEY (referred_by_customer_id) REFERENCES customers(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX customers_referrer_idx ON customers(referred_by_customer_id);
--> statement-breakpoint
CREATE TABLE referral_bonuses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 referrer_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 referred_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'PENDING',
 bonus_amount_dirams bigint,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT referral_bonuses_not_self CHECK (referrer_customer_id <> referred_customer_id),
 CONSTRAINT referral_bonuses_amount_check CHECK (bonus_amount_dirams IS NULL OR bonus_amount_dirams >= 0),
 CONSTRAINT referral_bonuses_status_check CHECK (status IN ('PENDING','CREDITED','CANCELLED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX referral_bonuses_referred_uq ON referral_bonuses(referred_customer_id);
--> statement-breakpoint
CREATE INDEX referral_bonuses_referrer_status_idx ON referral_bonuses(referrer_customer_id,status);
