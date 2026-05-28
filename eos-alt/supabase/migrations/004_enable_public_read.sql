-- ============================================================
-- Migration 004: Public Read Access for Live Data
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- If RLS is enabled on these tables, we need to allow anyone to read them.
-- The Edge Function handles writing (bypassing RLS), but the Next.js app needs to read.

-- 1. shelters
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON shelters;
CREATE POLICY "Enable read access for all users" ON shelters FOR SELECT USING (true);

-- 2. shelter_snapshots
ALTER TABLE shelter_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON shelter_snapshots;
CREATE POLICY "Enable read access for all users" ON shelter_snapshots FOR SELECT USING (true);

-- 3. weather_alerts
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON weather_alerts;
CREATE POLICY "Enable read access for all users" ON weather_alerts FOR SELECT USING (true);
