# Database Migrations Guide

This directory contains incremental database migrations for the LiveEditor Claude platform.

## ⚡ Quick Start (Production)

**For detailed step-by-step instructions, see [PRODUCTION_MIGRATION_GUIDE.md](./PRODUCTION_MIGRATION_GUIDE.md)**

**TL;DR:**
1. Open Supabase SQL Editor
2. Run `001_add_role_to_user_profiles.sql`
3. Run `003_ai_usage_table.sql` (fixes existing table policy)
4. Verify with queries in PRODUCTION_MIGRATION_GUIDE.md

---

## 📁 Migration Files

### Active Migrations (Run These)

| File | Purpose | Status | Dependencies |
|------|---------|--------|--------------|
| `001_add_role_to_user_profiles.sql` | Add role column for RBAC | ✅ Required | Base schema |
| `003_ai_usage_table.sql` | Fix broken admin policy | ✅ Required | Migration 001 |

### Archive

| File | Purpose | Status |
|------|---------|--------|
| `archive/database-schema-LIVE-2025-10-06.sql` | Production snapshot from Oct 6, 2025 | 📚 Reference only |

---

## 🎯 Migration Order

**CRITICAL:** Migrations must be run in this exact order:

```
1. 001_add_role_to_user_profiles.sql  ← Adds role column
2. 003_ai_usage_table.sql             ← Fixes policy (depends on role column)
```

**Why this order?**
- Migration 003 references the `role` column created in migration 001
- Running out of order will cause errors

---

## 🚀 How to Run Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **New Query**
5. Copy entire contents of migration file
6. Click **RUN**
7. Verify success with verification queries in file

### Method 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration 001
supabase db push --file database-migrations/001_add_role_to_user_profiles.sql

# Run migration 003
supabase db push --file database-migrations/003_ai_usage_table.sql
```

### Method 3: Direct PostgreSQL Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# Run migration 001
\i database-migrations/001_add_role_to_user_profiles.sql

# Run migration 003
\i database-migrations/003_ai_usage_table.sql
```

---

## ✅ Verification

After running each migration, verify success:

### Migration 001 Verification

```sql
-- Check role column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'role';

-- Check all users have a role
SELECT role, COUNT(*) 
FROM user_profiles 
GROUP BY role;
```

Expected: All users have `role = 'user'`

### Migration 003 Verification

```sql
-- Check policy exists with correct definition
SELECT policyname, definition
FROM pg_policies
WHERE tablename = 'ai_usage' 
  AND policyname = 'Admins can view all usage';
```

Expected: Policy definition includes `user_profiles` (not `profiles`)

---

## 🔄 Rollback Procedures

Each migration file includes a rollback section. To reverse a migration:

1. Open the migration file
2. Find the `ROLLBACK PROCEDURE` section
3. Uncomment the SQL block
4. Run in Supabase SQL Editor

**⚠️ WARNING:** Only rollback if absolutely necessary. Some features may break.

---

## 📝 Migration Checklist

Use this checklist when running migrations:

- [ ] **Pre-Flight**
  - [ ] Verified Supabase project is correct
  - [ ] Checked database backup exists
  - [ ] No critical operations running
  
- [ ] **Migration 001**
  - [ ] Ran SQL successfully
  - [ ] No errors in output
  - [ ] Verification query confirms role column exists
  - [ ] All users have role assigned
  
- [ ] **Migration 003**
  - [ ] Ran SQL successfully
  - [ ] No errors in output
  - [ ] Verification query shows policy exists
  - [ ] Policy references `user_profiles` table
  
- [ ] **Post-Migration**
  - [ ] Application loads normally
  - [ ] Users can login
  - [ ] Projects can be created
  - [ ] No errors in Supabase logs

---

## 🐛 Troubleshooting

### Common Issues

**"relation public.user_profiles does not exist"**
- **Cause:** Base schema not applied
- **Fix:** Run `database-schema.sql` first

**"column role already exists"**
- **Cause:** Migration 001 already ran
- **Fix:** This is OK, skip to migration 003

**"policy already exists"**
- **Cause:** Migration 003 already ran
- **Fix:** This is OK, migrations are idempotent

**AI usage queries failing**
- **Cause:** Admin policy still broken
- **Fix:** Re-run migration 003

### Getting Help

1. Check PRODUCTION_MIGRATION_GUIDE.md for detailed troubleshooting
2. Review Supabase logs: Database > Logs
3. Verify RLS policies: SQL Editor → `SELECT * FROM pg_policies;`
4. Contact support with:
   - Error message
   - Which migration failed
   - Screenshot of SQL Editor

---

## 📊 Migration Impact

### Migration 001: Add Role Column
- **Rows affected:** All users in `user_profiles` table
- **Downtime:** None (column has default value)
- **Performance impact:** Minimal (one additional column)
- **User impact:** None (invisible backend change)

### Migration 003: Fix AI Usage Policy
- **Rows affected:** None (policy change only)
- **Downtime:** None
- **Performance impact:** None
- **User impact:** Admins can now view AI usage data

---

## 🔐 Security Notes

- All migrations use Row Level Security (RLS)
- Default role is 'user' (least privilege)
- Admin role requires manual promotion
- No sensitive data is modified
- All changes are reversible

---

## 📚 Additional Resources

- **Detailed Guide:** [PRODUCTION_MIGRATION_GUIDE.md](./PRODUCTION_MIGRATION_GUIDE.md)
- **Schema Audit:** `../DATABASE_SCHEMA_AUDIT.md`
- **Master Schema:** `../database-schema.sql`
- **Supabase Docs:** https://supabase.com/docs/guides/database

---

## 🎓 Creating New Migrations

If you need to create a new migration in the future:

1. **Naming Convention:** `NNN_descriptive_name.sql`
   - Use sequential numbers (004, 005, etc.)
   - Use snake_case
   - Be descriptive

2. **Template Structure:**
```sql
-- =============================================
-- Migration NNN: [Title]
-- =============================================
-- Date: [YYYY-MM-DD]
-- Purpose: [What this migration does]
-- Dependencies: [Previous migrations required]
-- =============================================

BEGIN;

-- Your migration SQL here

COMMIT;

-- Verification queries
-- Expected results

-- Rollback procedure (commented out)
```

3. **Best Practices:**
   - Always use `IF NOT EXISTS` / `IF EXISTS` (idempotent)
   - Wrap in `BEGIN;` / `COMMIT;` (atomic)
   - Include verification queries
   - Document rollback procedure
   - Test on development first

---

## 📅 Migration History

| Date | Migration | Description | Author |
|------|-----------|-------------|--------|
| 2025-10-06 | 001 | Add role column to user_profiles | LiveEditor Team |
| 2025-10-06 | 003 | Fix AI usage admin policy | LiveEditor Team |

---

**Last Updated:** October 6, 2025  
**Maintained By:** LiveEditor Claude Team
