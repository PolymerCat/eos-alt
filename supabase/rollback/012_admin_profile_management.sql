-- ============================================================
-- Rollback 012: Admin profile management foundation
-- ============================================================
-- This rollback removes only the admin read policy and helper function.
-- Profile columns are intentionally retained because older migrations and
-- application code may depend on them.

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP FUNCTION IF EXISTS public.is_admin();
