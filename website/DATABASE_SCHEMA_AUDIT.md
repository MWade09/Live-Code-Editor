# Database Schema Audit Report
**Date:** October 6, 2025  
**Purpose:** Compare production Supabase database with local schema files

---

## Summary

✅ **Good News:** Your local `database-schema.sql` and production database are **99% aligned**!

The production database (from `database-schema-LIVE.sql`) contains everything in your local file PLUS one additional table (`ai_usage`) that was added separately.

---

## Key Findings

### 1. **CRITICAL ISSUE: Wrong Table Reference in AI Usage**
**File:** `website/database-migrations/003_ai_usage_table.sql` (8th Query in LIVE)

**Problem:** The admin policy references `public.profiles` table which **DOES NOT EXIST**

```sql
-- INCORRECT (in 8th query):
CREATE POLICY "Admins can view all usage"
    ON public.ai_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles  -- ❌ WRONG TABLE NAME
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
```

**Solution:** Change `profiles` to `user_profiles` (correct table name)

**Additional Issue:** The `user_profiles` table **does not have a `role` column** yet, so this policy will fail even after fixing the table name.

---

## Table-by-Table Comparison

### ✅ Tables in Both Production AND Local Schema

All of these match perfectly:

1. **user_profiles** - Extended user profiles (no role column in either)
2. **projects** - User-generated content
3. **project_likes** - Like tracking
4. **project_views** - View analytics
5. **comments** - Comment system
6. **project_reports** - Moderation system
7. **project_saves** - Save history
8. **user_follows** - Social features
9. **user_activity** - Activity tracking
10. **notifications** - Notification system
11. **project_commits** - Version control commits
12. **project_branches** - Version control branches
13. **terminal_sessions** - Terminal session persistence
14. **project_build_configs** - Build configuration

### ⚠️ Table ONLY in Production (Not in Local Schema)

**Table:** `ai_usage`
- **Status:** Exists in production via 8th query
- **Purpose:** Track AI API usage for billing
- **Issue:** Has a broken admin policy referencing non-existent table/column
- **Action:** This is what migration `003_ai_usage_table.sql` is trying to add/fix

---

## Production Database Structure (from database-schema-LIVE.sql)

The LIVE file contains **8 separate queries** that were run in sequence:

1. **Query 1:** Main schema (all core tables, indexes, RLS policies, views, triggers)
2. **Query 2:** `project_reports` table + policies
3. **Query 3:** `project_saves` table + policies
4. **Query 4:** Version control tables (`project_commits`, `project_branches`) + policies
5. **Query 5:** Additional indexes for version control
6. **Query 6:** `terminal_sessions` table + policies
7. **Query 7:** `project_build_configs` table + policies
8. **Query 8:** `ai_usage` table + policies (**has bugs**)

---

## Differences Between Local and Production

### Local Schema Has (that Production is Missing)
- **NOTHING** - Production has everything local has

### Production Has (that Local Schema is Missing)
- **`ai_usage` table** (Query 8) - This is the table you tried to add via migration

---

## Migration Strategy Analysis

### Current Migration Files Status

**File:** `website/database-migrations/001_add_role_to_user_profiles.sql`
- **Status:** ✅ NEEDED - Not in production yet
- **Purpose:** Add `role` column to `user_profiles` table
- **Why:** Required for the `ai_usage` admin policy to work

**File:** `website/database-migrations/002_add_project_access_tokens.sql`
- **Status:** ⚠️ OPTIONAL - New feature not in production
- **Purpose:** Add token-based access to private projects
- **Why:** Enhancement, not a bug fix

**File:** `website/database-migrations/003_ai_usage_table.sql`
- **Status:** ❌ CONFLICTS - Production already has `ai_usage` table
- **Why:** Query 8 in production already created this table (with bugs)
- **Action:** Should be replaced with a migration to FIX the existing table

---

## Recommended Action Plan

### Option A: Fix Production Directly (Quickest)
Since production already has the `ai_usage` table, you should:

1. **Add the role column first:**
   ```sql
   -- Run migration 001
   ALTER TABLE public.user_profiles 
   ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
   CHECK (role IN ('user', 'admin', 'moderator'));
   
   CREATE INDEX idx_user_profiles_role ON user_profiles(role);
   ```

2. **Drop and recreate the broken admin policy:**
   ```sql
   -- Fix the ai_usage admin policy
   DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage;
   
   CREATE POLICY "Admins can view all usage"
       ON public.ai_usage
       FOR SELECT
       USING (
           EXISTS (
               SELECT 1 FROM public.user_profiles  -- ✅ FIXED TABLE NAME
               WHERE user_profiles.id = auth.uid()
               AND user_profiles.role = 'admin'
           )
       );
   ```

3. **Optional: Add project access tokens (migration 002)**
   - Only if you want the private project token feature

### Option B: Update Local Schema to Match Production
Update your `database-schema.sql` to include the `ai_usage` table and role column, making it the true source of truth.

---

## Schema Synchronization Status

| Component | Local Schema | Production | Status |
|-----------|-------------|------------|--------|
| Core tables (14 tables) | ✅ | ✅ | ✅ Synced |
| Indexes | ✅ | ✅ | ✅ Synced |
| RLS Policies (core) | ✅ | ✅ | ✅ Synced |
| Views | ✅ | ✅ | ✅ Synced |
| Triggers | ✅ | ✅ | ✅ Synced |
| `ai_usage` table | ❌ | ✅ | ⚠️ Partial |
| `role` column | ❌ | ❌ | ❌ Missing |
| `access_token` column | ❌ | ❌ | ❌ Missing |

---

## Critical Bugs in Production

### Bug #1: Wrong Table Reference
**Location:** `ai_usage` admin policy  
**Error:** References `public.profiles` instead of `public.user_profiles`  
**Impact:** Policy will never match, admins cannot view usage data  
**Fix:** See Option A, step 2 above

### Bug #2: Missing Role Column
**Location:** `user_profiles` table  
**Error:** `role` column doesn't exist but is referenced in admin policy  
**Impact:** Even after fixing Bug #1, policy will fail  
**Fix:** See Option A, step 1 above

---

## Files That Need Updates

### 1. `database-schema.sql` (Local)
**Action:** Add these sections to make it match production:

```sql
-- After the project_build_configs table, add:

-- AI Usage tracking
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

-- Add to user_profiles table definition (before the closing);
-- Add role column:
role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),

-- Add to indexes section:
CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON public.ai_usage(user_id, created_at DESC);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Add to RLS section:
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
    ON public.ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage records"
    ON public.ai_usage
    FOR INSERT
    WITH CHECK (true);

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
```

### 2. `database-migrations/003_ai_usage_table.sql`
**Action:** This file is now OBSOLETE since production already has the table. 

**New Purpose:** Convert this to a FIX migration:

```sql
-- Migration: Fix AI Usage Admin Policy
-- Date: October 6, 2025
-- Prerequisites: 001_add_role_to_user_profiles.sql must be run first

-- Drop the broken policy
DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage;

-- Recreate with correct table name
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
```

### 3. `database-migrations/README.md`
**Action:** Update migration order:

```markdown
## Migration Execution Order

⚠️ **IMPORTANT:** Production already has `ai_usage` table from Query 8.
Do NOT run the original 003 migration. Use the fixed version.

1. **001_add_role_to_user_profiles.sql** - Add role column
2. **003_ai_usage_table_FIX.sql** - Fix existing admin policy (rename 003)
3. **002_add_project_access_tokens.sql** - (Optional) Add private project tokens
```

---

## Conclusion

Your database is in good shape! The only issues are:

1. ✅ **Schemas are aligned** - Local and production match for core functionality
2. ⚠️ **Production has broken AI usage policy** - Easy to fix
3. ⚠️ **Missing role column** - Needed for admin features
4. ℹ️ **Local schema file out of date** - Should be updated to reflect production

**Next Steps:**
1. Run migration 001 (add role column)
2. Fix the AI usage admin policy in production
3. Update `database-schema.sql` to include `ai_usage` table and role column
4. Archive `database-schema-LIVE.sql` as reference
5. Optional: Run migration 002 if you want token-based project access

---

## Questions to Decide

1. **Do you want to add the `role` column?** (Needed for admin features)
   - If yes: Run migration 001
   - If no: Remove admin policy from `ai_usage` table

2. **Do you want token-based access to private projects?** (New feature)
   - If yes: Run migration 002
   - If no: Skip it

3. **How should we fix the `ai_usage` admin policy?**
   - Option A: Fix it in production directly (SQL queries in Supabase)
   - Option B: Create a new migration file to fix it
   - Option C: Drop the admin policy entirely (admins use service role key instead)
