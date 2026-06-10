-- Migration 011: Immutable public emergency timeline.
--
-- Current-state tables answer "what is happening now?". These tables answer
-- "what changed, and when did it change?" without mixing personal user data
-- into the public emergency history.

CREATE TABLE IF NOT EXISTS emergency_sync_runs (
  id               UUID PRIMARY KEY,
  source           TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  records_received INTEGER NOT NULL DEFAULT 0,
  error_message    TEXT
);

CREATE TABLE IF NOT EXISTS emergency_timeline_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key        TEXT NOT NULL UNIQUE,
  event_type       TEXT NOT NULL CHECK (
    event_type IN (
      'shelter_opened',
      'shelter_closed',
      'shelter_capacity_changed',
      'weather_alert_issued',
      'weather_alert_expired'
    )
  ),
  occurred_at      TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  shelter_id       TEXT REFERENCES shelters(id) ON DELETE SET NULL,
  weather_alert_id TEXT REFERENCES weather_alerts(id) ON DELETE SET NULL,
  disaster_type    TEXT,
  state            TEXT,
  district         TEXT,
  title            TEXT NOT NULL,
  description      TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  source           TEXT NOT NULL,
  sync_run_id      UUID REFERENCES emergency_sync_runs(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_timeline_occurred
  ON emergency_timeline_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_timeline_type_occurred
  ON emergency_timeline_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_timeline_state_occurred
  ON emergency_timeline_events (state, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_timeline_shelter_occurred
  ON emergency_timeline_events (shelter_id, occurred_at DESC);

ALTER TABLE emergency_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON emergency_timeline_events;
CREATE POLICY "Enable read access for all users"
  ON emergency_timeline_events FOR SELECT USING (true);

COMMENT ON TABLE emergency_timeline_events IS
  'Immutable public emergency transitions generated from successful source syncs.';

