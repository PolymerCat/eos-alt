-- Manual rollback for migration 011.
--
-- This permanently removes recorded timeline history. Revert the application
-- and sync-live-data Edge Function before running this script.

DROP TABLE IF EXISTS emergency_timeline_events;
DROP TABLE IF EXISTS emergency_sync_runs;
