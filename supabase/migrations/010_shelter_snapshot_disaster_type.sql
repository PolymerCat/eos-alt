-- Migration 010: Associate disaster type with each shelter activation snapshot.
--
-- A shelter is a stable place, while the disaster that caused it to open is
-- event-specific. Keeping disaster_type on snapshots prevents an inactive
-- shelter from presenting an old emergency as current.
--
-- Compatibility:
-- The legacy shelters.disaster_type column is intentionally retained so this
-- migration and the application rollout can be reversed independently.

ALTER TABLE shelter_snapshots
  ADD COLUMN IF NOT EXISTS disaster_type TEXT;

CREATE INDEX IF NOT EXISTS idx_shelter_snapshots_status_captured
  ON shelter_snapshots (status, captured_at DESC);

COMMENT ON COLUMN shelter_snapshots.disaster_type IS
  'Disaster/emergency reported for this specific shelter activation snapshot.';
