-- ============================================================
-- Migration 001: Live Data Tables
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── shelters ─────────────────────────────────────────────────
-- One row per known shelter (stable identity).
-- Changing fields (capacity, victims, etc.) live in shelter_snapshots.
CREATE TABLE IF NOT EXISTS shelters (
  id            TEXT PRIMARY KEY,          -- id_pusat from JKM API
  name          TEXT NOT NULL,
  latitude      FLOAT8 NOT NULL,
  longitude     FLOAT8 NOT NULL,
  state         TEXT NOT NULL,             -- negeri (raw string from JKM)
  district      TEXT NOT NULL,             -- daerah
  mukim         TEXT,
  disaster_type TEXT,                      -- bencana
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── shelter_snapshots ──────────────────────────────────────────
-- One row per shelter per ingestion run.
-- Enables historical / chronological queries.
CREATE TABLE IF NOT EXISTS shelter_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  shelter_id  TEXT NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  capacity    TEXT,                        -- kapasiti  e.g. "82.00%"
  victims     TEXT,                        -- mangsa
  families    TEXT,                        -- keluarga
  status      TEXT DEFAULT 'active',       -- 'active' | 'closed'
  source      TEXT DEFAULT 'jkm_api',
  mode        TEXT DEFAULT 'live',
  captured_at TIMESTAMPTZ DEFAULT now(),
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_shelter_snapshots_shelter_captured
  ON shelter_snapshots (shelter_id, captured_at DESC);

-- ── weather_alerts ────────────────────────────────────────────
-- One row per unique alert.
-- Deduplicated by deterministic id (hash of source + title + valid_from).
CREATE TABLE IF NOT EXISTS weather_alerts (
  id             TEXT PRIMARY KEY,
  source         TEXT NOT NULL,            -- 'METMalaysia' | 'NADMA'
  title          TEXT NOT NULL,
  title_bm       TEXT,
  description    TEXT,
  description_bm TEXT,
  severity       TEXT,                     -- advisory | watch | warning | critical
  affected_area  TEXT,
  state          TEXT,
  valid_from     TIMESTAMPTZ,
  valid_to       TIMESTAMPTZ,
  issued_at      TIMESTAMPTZ DEFAULT now(),
  raw_payload    JSONB
);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_valid_to
  ON weather_alerts (valid_to DESC);

-- ── alert_preferences ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_preferences (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type       TEXT NOT NULL,          -- 'weather' | 'shelter' | 'sos' | 'government_notice'
  is_enabled       BOOLEAN DEFAULT true,
  delivery_methods TEXT[] DEFAULT ARRAY['in_app'],
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, alert_type)
);

ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON alert_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weather_alert_id TEXT REFERENCES weather_alerts(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  delivery_method  TEXT NOT NULL,
  status           TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'skipped'
  created_at       TIMESTAMPTZ DEFAULT now(),
  sent_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ── sos_requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_requests (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude    FLOAT8,
  longitude   FLOAT8,
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'draft',        -- 'draft' | 'submitted' | 'sent' | 'failed' | 'cancelled'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SOS"
  ON sos_requests FOR ALL
  USING (auth.uid() = user_id);

-- ── emergency_contacts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT,
  phone_number    TEXT NOT NULL,
  delivery_method TEXT DEFAULT 'sms',
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts"
  ON emergency_contacts FOR ALL
  USING (auth.uid() = user_id);
