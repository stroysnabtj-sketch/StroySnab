CREATE TABLE notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_key text NOT NULL UNIQUE,
 event text NOT NULL, entity_id uuid NOT NULL, version text NOT NULL,
 channel text NOT NULL DEFAULT 'sms' CHECK (channel = 'sms'),
 audience text NOT NULL CHECK (audience IN ('customer','shop')), supplier_id uuid,
 recipient text NOT NULL, body text NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','accepted','delivered','failed')),
 attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
 max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
 available_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, claim_token uuid,
 provider_message_id text, last_error text, accepted_at timestamptz, delivered_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX notification_outbox_dispatch_idx ON notification_outbox(state, available_at);
--> statement-breakpoint
CREATE INDEX notification_outbox_entity_idx ON notification_outbox(entity_id);
--> statement-breakpoint
CREATE TABLE notification_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), notification_id uuid NOT NULL REFERENCES notification_outbox(id) ON DELETE CASCADE,
 claim_token uuid NOT NULL UNIQUE, state text NOT NULL, error text, created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz
);
--> statement-breakpoint
CREATE INDEX notification_attempts_notification_idx ON notification_attempts(notification_id);
--> statement-breakpoint
CREATE TABLE notification_dispatch_budget (id text PRIMARY KEY, day text NOT NULL, used integer NOT NULL DEFAULT 0);
