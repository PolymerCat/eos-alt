-- ============================================================
-- Migration 002: Alter Existing Tables
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add label + description to user_locations (from FYP ERD)
ALTER TABLE user_locations
  ADD COLUMN IF NOT EXISTS label       TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add phone_number to profiles (from FYP ERD + Class Diagram)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number  TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
