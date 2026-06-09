-- Manual rollback for migration 010.
--
-- Run only when reverting the disaster-aware shelter activation feature.
-- Application code should be reverted before or together with this script.
-- Historical snapshot disaster values will be permanently removed.

DROP INDEX IF EXISTS idx_shelter_snapshots_status_captured;

ALTER TABLE shelter_snapshots
  DROP COLUMN IF EXISTS disaster_type;
