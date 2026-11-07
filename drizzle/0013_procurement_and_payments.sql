CREATE TABLE procurement_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), number text NOT NULL UNIQUE,
 user_id uuid REFERENCES users(id) ON DELETE SET NULL, guest_token_hash text,
 title text NOT NULL, contact_name text NOT NULL, contact_phone text NOT NULL, contact_email text, note text,
 status text NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW','IN_REVIEW','QUOTED','ACCEPTED','REJECTED','COMPLETED','CANCELLED')),
 lines jsonb NOT NULL, order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX procurement_owner_idx ON procurement_requests(user_id);
--> statement-breakpoint
CREATE INDEX procurement_status_idx ON procurement_requests(status);
--> statement-breakpoint
CREATE TABLE quotations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE REFERENCES procurement_requests(id) ON DELETE CASCADE,
 number text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SENT','ACCEPTED','DECLINED')),
 version integer NOT NULL DEFAULT 1, valid_until timestamptz NOT NULL, conditions text NOT NULL DEFAULT '', lines jsonb NOT NULL,
 base_dirams text NOT NULL, markup_percent integer NOT NULL, markup_dirams text NOT NULL,
 delivery_dirams text NOT NULL DEFAULT '0', total_dirams text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE procurement_attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
 storage_key text NOT NULL, name text NOT NULL, mime text NOT NULL, size integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE order_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('PAYMENT','REFUND')), amount_dirams text NOT NULL CHECK(amount_dirams ~ '^[0-9]+$' AND amount_dirams::numeric > 0),
 reason text NOT NULL, reference text, method text NOT NULL DEFAULT 'BANK_TRANSFER', actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 idempotency_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX order_payment_idempotency_idx ON order_payments(order_id,idempotency_key);
--> statement-breakpoint
CREATE INDEX order_payment_order_idx ON order_payments(order_id);
--> statement-breakpoint

