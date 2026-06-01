-- ============================================================
-- Migration 007: Link SOS requests to emergency contacts
-- ============================================================

ALTER TABLE sos_requests
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES emergency_contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sos_requests_contact_id
  ON sos_requests (contact_id);
