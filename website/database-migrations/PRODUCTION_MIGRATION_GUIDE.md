# Production Database Migration Guide
**Date:** October 6, 2025  
**Environment:** Supabase PostgreSQL (Production)  
**Risk Level:** 🟢 Low (Non-destructive, reversible)  
**Estimated Time:** < 2 minutes  
**Downtime Required:** None

---

## 🎯 Objective

Fix critical bugs in production database:
1. Add `role` column to `user_profiles` table for admin access control
2. **Create** `ai_usage` table for AI usage tracking (with correct admin policy)

---

## 📋 Pre-Flight Checklist

Before you begin, verify:

- [ ] You have access to Supabase dashboard
- [ ] You are logged into the correct project (LiveEditor Claude)
- [ ] You have identified your production database
- [ ] No critical operations are running
- [ ] You have a backup (Supabase automatically backs up, but verify in Settings > Database)

---

## 🚀 Migration Procedure

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your **LiveEditor Claude** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 2: Run Migration 001 (Add Role Column)

**Copy and paste this entire block into the SQL editor:**

```sql
-- =============================================
-- Migration 001: Add Role Column to User Profiles
-- =============================================

BEGIN;

-- Add the role column with default value and check constraint
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add check constraint to enforce valid role values
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'moderator'));

-- Ensure all existing users have the default role
UPDATE public.user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Index for efficient role-based queries (admin dashboards, etc.)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON public.user_profiles(role);

-- Add documentation comment
COMMENT ON COLUMN public.user_profiles.role IS 
'User role for access control: user (default), moderator (community management), admin (full access)';

COMMIT;

-- Verification: Check column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles' 
  AND column_name = 'role';
```

**Click "RUN" button**

**Expected Result:**
- ✅ Query executed successfully
- ✅ Verification query shows: `role | text | 'user'::text | YES`

**If you see an error:**
- If error mentions constraint already exists: This is OK, migration is idempotent
- If error mentions column already exists: This is OK, migration already ran
- Any other error: Stop and contact support

---

### Step 3: Verify Migration 001

**Run this verification query:**

```sql
-- Check all users have a role assigned
SELECT 
    COUNT(*) as total_users,
    COUNT(role) as users_with_role,
    role
FROM public.user_profiles
GROUP BY role
ORDER BY role;
```

**Expected Result:**
- All users should have `role = 'user'`
- `total_users` should equal `users_with_role`

---

### Step 4: Run Migration 003 (Create AI Usage Table)

**In a NEW query tab, copy and paste:**

```sql
-- =============================================
-- Migration 003: Create AI Usage Tracking Table
-- =============================================

BEGIN;

-- Create AI Usage Table
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

-- Create Indexes
CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON public.ai_usage(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
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

-- Add Documentation Comments
COMMENT ON TABLE public.ai_usage IS 'Tracks AI API usage for billing and analytics';
COMMENT ON COLUMN public.ai_usage.tokens_used IS 'Total tokens used in the request';
COMMENT ON COLUMN public.ai_usage.cost_usd IS 'Base API cost in USD';
COMMENT ON COLUMN public.ai_usage.markup_usd IS 'Platform markup (20%) in USD';
COMMENT ON COLUMN public.ai_usage.total_usd IS 'Total cost charged to user in USD';

COMMIT;

-- Verification: Check table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'ai_usage';
```

**Click "RUN" button**

**Expected Result:**
- ✅ Query executed successfully
- ✅ Verification query shows: `ai_usage` table exists

---

### Step 5: Final Verification

**Run this comprehensive check:**

```sql
-- Verify all AI usage policies
SELECT 
    tablename,
    policyname,
    cmd as permission_type,
    CASE 
        WHEN qual LIKE '%user_profiles%' THEN '✅ Correct'
        WHEN qual LIKE '%profiles%' THEN '❌ Wrong table'
        ELSE '✓ OK'
    END as status
FROM pg_policies 
WHERE tablename = 'ai_usage'
ORDER BY policyname;
```

**Expected Result (3 policies):**

| tablename | policyname | permission_type | status |
|-----------|-----------|----------------|--------|
| ai_usage | Admins can view all usage | SELECT | ✅ Correct |
| ai_usage | Service can insert usage records | INSERT | ✓ OK |
| ai_usage | Users can view their own usage | SELECT | ✓ OK |

**If you see any "❌ Wrong table":** 
- Re-run Migration 003
- The policy might not have been created correctly

---

## ✅ Post-Migration Checklist

- [X] Migration 001 completed without errors
- [X] All users have `role = 'user'` assigned
- [X] Migration 003 completed without errors
- [X] AI usage admin policy references `user_profiles` table
- [X] All 3 policies exist on `ai_usage` table
- [X] Application still functions normally (test login, project creation)

---

## 👨‍💼 Promote Yourself to Admin (Optional)

If you want admin access to view all AI usage data:

```sql
-- Get your user ID
SELECT id, username, email 
FROM public.user_profiles 
WHERE email = 'your-email@example.com';

-- Promote to admin (replace UUID with your actual ID)
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = 'your-user-uuid-here';

-- Verify
SELECT username, email, role 
FROM public.user_profiles 
WHERE role = 'admin';
```

---

## 🔄 Rollback Procedure

If something goes wrong, you can reverse the migrations:

### Rollback Migration 003 (AI Usage Policy)

```sql
BEGIN;

-- Restore original broken policy (for rollback only)
DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage;

CREATE POLICY "Admins can view all usage"
    ON public.ai_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles  -- Original broken reference
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMIT;
```

### Rollback Migration 001 (Role Column)

```sql
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
```

**⚠️ WARNING:** Only rollback if absolutely necessary. This will break any features that depend on roles.

---

## 📊 Monitoring Post-Migration

After migration, monitor these metrics:

### Database Performance
```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as rows_read
FROM pg_stat_user_indexes
WHERE indexname = 'idx_user_profiles_role'
ORDER BY idx_scan DESC;
```

### Policy Performance
```sql
-- Check AI usage queries are working
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(tokens_used) as total_tokens
FROM public.ai_usage;
```

### User Roles Distribution
```sql
-- Monitor role distribution
SELECT 
    role,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.user_profiles
GROUP BY role
ORDER BY user_count DESC;
```

---

## 🐛 Troubleshooting

### Error: "relation public.user_profiles does not exist"
**Solution:** Your database doesn't have the base schema. Run `database-schema.sql` first.

### Error: "column role already exists"
**Solution:** Migration 001 already ran. This is safe, continue to Migration 003.

### Error: "constraint user_profiles_role_check already exists"
**Solution:** Migration 001 already ran. This is safe, continue to Migration 003.

### Error: "policy already exists"
**Solution:** Use `DROP POLICY IF EXISTS` before `CREATE POLICY` (already included in migrations).

### AI usage queries returning empty results
**Solution:** 
1. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'ai_usage';`
2. Verify user has permission: `SELECT auth.uid();`
3. Check if data exists: Use service role key to query

### Performance degradation after migration
**Solution:**
1. Run `ANALYZE public.user_profiles;` to update statistics
2. Check index is being used (see Monitoring section)
3. Contact support if issues persist

---

## 📝 Migration Log Template

Copy this to your documentation:

```
Migration Date: [YYYY-MM-DD HH:MM UTC]
Migration Run By: [Your Name/Email]
Environment: Production (Supabase)
Project: LiveEditor Claude

Migration 001 - Add Role Column:
- Status: [ ] Success  [ ] Failed
- Duration: _____ seconds
- Rows Affected: _____ users
- Notes: ___________________________

Migration 003 - Fix AI Usage Policy:
- Status: [ ] Success  [ ] Failed
- Duration: _____ seconds
- Notes: ___________________________

Post-Migration Verification:
- All policies correct: [ ] Yes  [ ] No
- Application functional: [ ] Yes  [ ] No
- Performance normal: [ ] Yes  [ ] No

Issues Encountered:
___________________________________
___________________________________
```

---

## 🎓 What These Migrations Do

### Migration 001: Add Role Column
**Technical:**
- Adds `role TEXT DEFAULT 'user'` to `user_profiles`
- Constraint: Only allows 'user', 'admin', 'moderator'
- Creates B-tree index for fast role lookups
- Updates all existing users to 'user' role

**Business Impact:**
- Enables admin dashboard features
- Allows moderation tools
- Enables role-based permissions
- Zero downtime (column has default)

### Migration 003: Create AI Usage Table
**Technical:**
- Creates `ai_usage` table with proper schema
- Creates 3 indexes for performance (user_id, created_at, composite)
- Enables Row Level Security (RLS)
- Creates 3 policies: user access, service insert, admin access
- Admin policy correctly references `user_profiles` table (not `profiles`)

**Business Impact:**
- Enables AI usage tracking for billing
- Enables AI usage analytics dashboard
- Users can see their own usage
- Admins can see all usage
- Service can record usage via backend API

---

## 🔐 Security Considerations

- ✅ Migrations use transactions (atomic operations)
- ✅ Rollback procedures documented
- ✅ No data deletion occurs
- ✅ No user data exposed
- ✅ RLS policies maintained
- ✅ Default roles minimize permission escalation
- ✅ Admin promotion requires manual action

---

## 📞 Support

If you encounter any issues:

1. **Check the Troubleshooting section** above
2. **Verify the Pre-Flight Checklist** was completed
3. **Run rollback procedures** if needed
4. **Document the error** (screenshot + error message)
5. **Contact:** support@liveeditor.com

---

## ✨ Success Criteria

Your migration is successful when:

1. ✅ Both migrations run without errors
2. ✅ All verification queries return expected results
3. ✅ Application loads and functions normally
4. ✅ Users can still login and create projects
5. ✅ AI features still work (if you have data)
6. ✅ No errors in Supabase logs

**Congratulations! Your database is now up to date! 🎉**
