-- ─────────────────────────────────────────────────────────────────────────────
-- ERP Webhook hardening: delivery tracking, HMAC signature storage, retry queue
-- ─────────────────────────────────────────────────────────────────────────────

-- Backfill updated_at on the existing webhooks table
ALTER TABLE webhooks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivery_success_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_at       TIMESTAMPTZ;

-- ── webhook_deliveries ────────────────────────────────────────────────────────
-- Immutable-ish log of every delivery attempt per registered webhook.
-- Retries increment attempt_count and update status; dead-lettered after max_attempts.

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id        UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  event_payload     JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','success','failed','dead_lettered')),
  attempt_count     INTEGER NOT NULL DEFAULT 0,
  max_attempts      INTEGER NOT NULL DEFAULT 5,
  next_retry_at     TIMESTAMPTZ,
  last_attempted_at TIMESTAMPTZ,
  dead_lettered_at  TIMESTAMPTZ,
  response_status   INTEGER,
  response_body     TEXT,
  hmac_signature    TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage webhook_deliveries"
  ON webhook_deliveries FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_wh_deliveries_webhook_id  ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_wh_deliveries_status      ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_wh_deliveries_created_at  ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wh_deliveries_next_retry  ON webhook_deliveries(next_retry_at) WHERE status = 'failed';
