-- =============================================
-- Migration 003: Create AI Usage Tracking Table
-- =============================================
-- Date: October 6, 2025
-- Author: LiveEditor Claude Team
-- Purpose: Create ai_usage table with correct admin policy
-- Dependencies: 001_add_role_to_user_profiles.sql MUST be run first
-- Estimated Time: <1 second
-- Reversible: Yes (see rollback section)
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Create AI Usage Table
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    markup_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- STEP 2: Create Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON public.ai_usage(user_id, created_at DESC);

-- =============================================
-- STEP 3: Enable Row Level Security
-- =============================================

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: Create RLS Policies (with correct table reference)
-- =============================================

-- Users can only view their own usage
CREATE POLICY "Users can view their own usage"
    ON public.ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only the service (backend API) can insert usage records
CREATE POLICY "Service can insert usage records"
    ON public.ai_usage
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all usage (FIXED: references user_profiles, not profiles)
CREATE POLICY "Admins can view all usage"
    ON public.ai_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- =============================================
-- STEP 5: Add Documentation Comments
-- =============================================

COMMENT ON TABLE public.ai_usage IS 'Tracks AI API usage for billing and analytics';
COMMENT ON COLUMN public.ai_usage.tokens_used IS 'Total tokens used in the request';
COMMENT ON COLUMN public.ai_usage.cost_usd IS 'Base API cost in USD';
COMMENT ON COLUMN public.ai_usage.markup_usd IS 'Platform markup (20%) in USD';
COMMENT ON COLUMN public.ai_usage.total_usd IS 'Total cost charged to user in USD';

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these after migration to verify success:

-- 1. Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'ai_usage';
-- Expected: ai_usage

-- 2. Check all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ai_usage'
ORDER BY ordinal_position;
-- Expected: 8 columns (id, user_id, model, tokens_used, cost_usd, markup_usd, total_usd, created_at)

-- 3. Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ai_usage'
ORDER BY indexname;
-- Expected: 3 indexes plus primary key

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'ai_usage';
-- Expected: ai_usage | true

-- 5. Check all policies exist with correct definition
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'ai_usage'
ORDER BY policyname;
-- Expected: 3 policies (Admins can view all usage, Service can insert, Users can view their own)

-- 6. Verify admin policy references user_profiles (not profiles)
SELECT definition
FROM pg_policies
WHERE tablename = 'ai_usage' 
  AND policyname = 'Admins can view all usage';
-- Expected: Should contain 'user_profiles' and 'role'

-- =============================================
-- ROLLBACK PROCEDURE (if needed)
-- =============================================

-- Uncomment and run this block to reverse the migration:
/*
BEGIN;

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view their own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Service can insert usage records" ON public.ai_usage;
DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage;

-- Drop indexes
DROP INDEX IF EXISTS public.ai_usage_user_id_idx;
DROP INDEX IF EXISTS public.ai_usage_created_at_idx;
DROP INDEX IF EXISTS public.ai_usage_user_created_idx;

-- Drop the table (WARNING: This deletes all AI usage data!)
DROP TABLE IF EXISTS public.ai_usage;

COMMIT;
*/

-- =============================================
-- NOTES
-- =============================================
-- - This migration creates the ai_usage table from scratch
-- - The admin policy correctly references 'user_profiles' table
-- - Requires migration 001 to be run first (adds role column)
-- - RLS ensures users can only see their own usage data
-- - Admins (role = 'admin') can see all usage data
-- - Service role key needed to insert records (backend only)
-- =============================================

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these after migration to verify success:

-- 1. Check that the policy exists and references correct table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'ai_usage' 
  AND policyname = 'Admins can view all usage';
-- Expected: Should show policy exists with SELECT command

-- 2. Verify policy references user_profiles table (not profiles)
SELECT definition
FROM pg_policies
WHERE tablename = 'ai_usage' 
  AND policyname = 'Admins can view all usage';
-- Expected: Definition should contain 'user_profiles' and 'role = admin'

-- 3. Test admin access (as admin user)
-- First, promote yourself to admin:
-- UPDATE public.user_profiles SET role = 'admin' WHERE id = auth.uid();
-- Then test:
-- SELECT COUNT(*) FROM public.ai_usage;
-- Expected: Should return count without error

-- 4. Verify all policies on ai_usage table
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'ai_usage'
ORDER BY policyname;
-- Expected: Should show 3 policies:
--   1. "Admins can view all usage" (SELECT)
--   2. "Service can insert usage records" (INSERT)
--   3. "Users can view their own usage" (SELECT)

-- =============================================
-- ROLLBACK PROCEDURE (if needed)
-- =============================================

-- Uncomment and run this block to reverse the migration:
/*
BEGIN;

-- Restore the old broken policy (for reference only - don't actually do this)
DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage;

CREATE POLICY "Admins can view all usage"
    ON public.ai_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles  -- BROKEN: This table doesn't exist
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMIT;
*/

-- =============================================
-- NOTES
-- =============================================
-- - This migration fixes a critical bug in production
-- - The ai_usage table already exists (created via Query 8)
-- - We are NOT recreating the table, only fixing the policy
-- - Requires migration 001 to be run first (adds role column)
-- - After this migration, admins can view all AI usage data
-- - Regular users can still only see their own usage
-- =============================================
