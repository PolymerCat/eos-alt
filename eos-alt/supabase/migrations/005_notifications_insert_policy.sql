-- ============================================================
-- Migration 005: Full RLS Policies for Notifications
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop the existing select-only policy
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;

-- Create an ALL policy that allows users to select, insert, and delete their own notifications
CREATE POLICY "Users manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
