-- =============================================
-- Migration 001: Add Role Column to User Profiles
-- =============================================
-- Date: October 6, 2025
-- Author: LiveEditor Claude Team
-- Purpose: Add role-based access control (RBAC) to user_profiles table
-- Dependencies: Base schema (user_profiles table must exist)
-- Estimated Time: <1 second
-- Reversible: Yes (see rollback section)
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Add role column with constraints
-- =============================================

-- Add the role column with default value and check constraint
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add check constraint to enforce valid role values
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'moderator'));

-- =============================================
-- STEP 2: Update existing records
-- =============================================

-- Ensure all existing users have the default role
UPDATE public.user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- =============================================
-- STEP 3: Create performance index
-- =============================================

-- Index for efficient role-based queries (admin dashboards, etc.)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON public.user_profiles(role);

-- =============================================
-- STEP 4: Add table comment for documentation
-- =============================================

COMMENT ON COLUMN public.user_profiles.role IS 
'User role for access control: user (default), moderator (community management), admin (full access)';

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these after migration to verify success:

-- 1. Check column exists with correct type and default
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles' 
  AND column_name = 'role';
-- Expected: role | text | 'user'::text | YES

-- 2. Check constraint exists
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'user_profiles_role_check';
-- Expected: user_profiles_role_check | (role = ANY (ARRAY['user'::text, 'admin'::text, 'moderator'::text]))

-- 3. Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles' 
  AND indexname = 'idx_user_profiles_role';
-- Expected: idx_user_profiles_role | CREATE INDEX...

-- 4. Verify all users have a role assigned
SELECT COUNT(*) as users_with_role, role
FROM public.user_profiles
GROUP BY role
ORDER BY role;
-- Expected: All users should have 'user' role

-- =============================================
-- ROLLBACK PROCEDURE (if needed)
-- =============================================

-- Uncomment and run this block to reverse the migration:
/*
BEGIN;

-- Drop the index
DROP INDEX IF EXISTS public.idx_user_profiles_role;

-- Remove the constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Drop the column
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS role;

COMMIT;
*/

-- =============================================
-- NOTES
-- =============================================
-- - This migration is idempotent (safe to run multiple times)
-- - All existing users will be assigned 'user' role
-- - To promote a user to admin, run:
--   UPDATE user_profiles SET role = 'admin' WHERE id = 'user-uuid';
-- - RLS policies can now check user roles for access control
-- =============================================
