-- ============================================================
-- Migration 009: Named saved locations
-- ============================================================
--
-- Purpose
--   User locations are not unique by state or district. A user can save
--   multiple personally meaningful places in the same administrative area,
--   such as "Family Home", "Mama's Home", "Office", or "Hostel".
--
-- Rollback
--   See temp/saved-locations-personal-labels-implementation.md for the
--   rollback SQL and application files touched by this feature.

ALTER TABLE user_locations
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE user_locations
SET label = 'Saved Location'
WHERE label IS NULL OR btrim(label) = '';

ALTER TABLE user_locations
  ALTER COLUMN label SET DEFAULT 'Saved Location',
  ALTER COLUMN label SET NOT NULL;

ALTER TABLE simulation_user_locations
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE simulation_user_locations
SET label = 'Saved Location'
WHERE label IS NULL OR btrim(label) = '';

ALTER TABLE simulation_user_locations
  ALTER COLUMN label SET DEFAULT 'Saved Location',
  ALTER COLUMN label SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_locations_user_label
  ON user_locations (user_id, label);

CREATE INDEX IF NOT EXISTS idx_simulation_user_locations_user_label
  ON simulation_user_locations (user_id, label);
