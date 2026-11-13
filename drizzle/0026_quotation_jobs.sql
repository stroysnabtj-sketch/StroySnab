CREATE TABLE quotation_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL UNIQUE REFERENCES procurement_requests(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','processing','review','ready','failed')),
 attempts integer NOT NULL DEFAULT 0,
 claim_token uuid,
 lease_until timestamptz,
 error text,
 warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
 lines jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX quotation_jobs_state_idx ON quotation_jobs(state, created_at);
