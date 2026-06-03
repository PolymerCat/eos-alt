-- ============================================================
-- Migration 003: Scheduled Cron (pg_cron + pg_net)
-- Run this in Supabase Dashboard → SQL Editor
-- Edge Function must already be deployed before running this.
-- ============================================================

-- Ensure pg_net extension is enabled (usually on by default)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the sync every 10 minutes
SELECT cron.schedule(
  'sync-live-data-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://mghekhbdeabqmuxdwasa.supabase.co/functions/v1/sync-live-data',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer 6f86fc861da9f17a6a08f7472a05d08e2c8896785cb5db011f576d5ed3411bb2'
               ),
    body    := '{}'::jsonb
  );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule if needed:
-- SELECT cron.unschedule('sync-live-data-every-10min');
