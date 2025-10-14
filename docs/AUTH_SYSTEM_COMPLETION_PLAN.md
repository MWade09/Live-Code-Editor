# 🔐 Authentication System Completion Plan

**Started**: October 14, 2025  
**Priority**: HIGH  
**Estimated Time**: 1-2 weeks  
**Current Progress**: 30% → Target: 100%

---

## 📊 Current Status Analysis

### ✅ Already Built (30% Complete)

#### 1. **Supabase Setup** ✅
- Supabase client and server utilities
- Environment variables configured
- Database connection working

#### 2. **Database Schema** ✅
Located in: `website/database-schema.sql`
- `user_profiles` table with full metadata
- `projects` table with RLS policies
- Foreign key relationships
- Proper indexing

#### 3. **Auth UI Components** ✅
Located in: `website/src/components/auth/`
- `auth-form.tsx` - Beautiful, fully functional auth form
  - Email/password login
  - Email/password signup
  - Google OAuth
  - GitHub OAuth
  - Password visibility toggle
  - Loading states
  - Error handling
  - Return-to redirect support
  - Responsive design with glassmorphism

#### 4. **Auth Pages** ✅
Located in: `website/src/app/auth/`
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/callback` - OAuth callback handler
- `/auth/reset-password` - Password reset page
- `/auth/update-password` - Update password page
- `/auth/auth-code-error` - Error handling

#### 5. **Protected Routes** ✅
- `/dashboard` - User dashboard (auth required)
- `/my-projects` - User projects page (auth required)
- Automatic redirect to login for unauthenticated users

#### 6. **Dashboard Foundation** ✅
Located in: `website/src/components/dashboard/`
- `dashboard-content.tsx` - Comprehensive dashboard
  - Quick actions (New Project, Templates, Import, Editor)
  - Recent projects display
  - User stats (projects, likes, views)
  - AI usage tracking
  - Activity feed
  - Profile integration

#### 7. **My Projects Page** ✅
Located in: `website/src/components/projects/`
- `my-projects-content.tsx` - Project management page
  - Filtering and sorting
  - Project cards
  - Auth-protected

#### 8. **Database Hooks** ✅
Located in: `website/src/hooks/useDatabase.ts`
- `useUserProfile()` - User profile management
- `useUserProjects()` - User projects fetching
- `useUserStats()` - User statistics
- `useUserActivity()` - Activity feed

---

## 📝 TODO Features (70% Remaining)

### PHASE 1: Complete Auth Flow (Week 1)

#### 1. **Password Reset Flow** - Priority: HIGH
**Current**: Basic page exists  
**TODO**:
- [ ] Implement password reset request form
- [ ] Email sending integration (Supabase handles this)
- [ ] Password reset confirmation page
- [ ] Update password functionality
- [ ] Success/error messaging
- [ ] Redirect after password update

**Files to modify**:
- `src/app/auth/reset-password/page.tsx` - Request form
- `src/app/auth/update-password/page.tsx` - Update form
- Create `src/components/auth/reset-password-form.tsx`
- Create `src/components/auth/update-password-form.tsx`

---

#### 2. **Email Verification** - Priority: HIGH
**Current**: Signup sends verification email  
**TODO**:
- [ ] Email confirmation landing page
- [ ] Resend verification email functionality
- [ ] Email verified status display in profile
- [ ] Reminder banner for unverified users

**Files to create/modify**:
- Create `src/app/auth/verify-email/page.tsx`
- Create `src/components/auth/verify-email-banner.tsx`
- Update `src/components/dashboard/dashboard-content.tsx` - Add verification banner

---

#### 3. **Session Management** - Priority: MEDIUM
**Current**: Basic session with Supabase  
**TODO**:
- [ ] "Remember me" functionality
- [ ] Session timeout handling
- [ ] Automatic session refresh
- [ ] "Sign out from all devices" feature
- [ ] Active sessions list in settings

**Files to modify**:
- `src/components/auth/auth-form.tsx` - Add "Remember me" checkbox
- Create `src/app/settings/security/page.tsx` - Security settings
- Create `src/components/settings/active-sessions.tsx`

---

### PHASE 2: Profile Management (Week 1-2)

#### 4. **Profile Settings Page** - Priority: HIGH
**Current**: Profile data exists, no UI to edit  
**TODO**:
- [ ] Profile settings page (`/settings/profile`)
- [ ] Edit full name, username, bio
- [ ] Avatar upload to Supabase Storage
- [ ] Skills and interests management
- [ ] Preferred languages selection
- [ ] Profile visibility settings (public/private)
- [ ] Social links (GitHub, Twitter, LinkedIn, Portfolio)

**Files to create**:
- `src/app/settings/profile/page.tsx`
- `src/components/settings/profile-form.tsx`
- `src/components/settings/avatar-upload.tsx`
- `src/components/settings/social-links.tsx`

---

#### 5. **Notification Settings** - Priority: MEDIUM
**Current**: Boolean flags in database  
**TODO**:
- [ ] Notification preferences page (`/settings/notifications`)
- [ ] Email notification toggles
- [ ] Marketing emails toggle
- [ ] In-app notification preferences
- [ ] Save preferences to database

**Files to create**:
- `src/app/settings/notifications/page.tsx`
- `src/components/settings/notification-preferences.tsx`

---

#### 6. **Account Settings** - Priority: HIGH
**Current**: Basic user data  
**TODO**:
- [ ] Account settings page (`/settings/account`)
- [ ] Change email address
- [ ] Change password
- [ ] Delete account (with confirmation)
- [ ] Export user data (GDPR compliance)
- [ ] Account activity log

**Files to create**:
- `src/app/settings/account/page.tsx`
- `src/components/settings/account-form.tsx`
- `src/components/settings/danger-zone.tsx` - Delete account
- `src/app/api/account/export/route.ts` - Data export endpoint
- `src/app/api/account/delete/route.ts` - Account deletion endpoint

---

### PHASE 3: Project Management (Week 2)

#### 7. **Project Creation from Website** - Priority: HIGH
**Current**: Can only create from editor  
**TODO**:
- [ ] "New Project" button on dashboard
- [ ] Project creation modal/page
- [ ] Template selection
- [ ] Project name, description, language
- [ ] Public/private toggle
- [ ] Tags/categories
- [ ] Redirect to editor after creation

**Files to create/modify**:
- `src/app/projects/create/page.tsx` - Project creation page
- `src/components/projects/create-project-form.tsx`
- `src/components/projects/template-selector.tsx`
- `src/app/api/projects/create/route.ts` - Create project endpoint

---

#### 8. **Project Settings** - Priority: HIGH
**Current**: Projects exist, limited settings  
**TODO**:
- [ ] Project settings page (`/projects/[id]/settings`)
- [ ] Edit project name, description
- [ ] Change language
- [ ] Public/private toggle
- [ ] Enable/disable features (comments, likes)
- [ ] Delete project (with confirmation)
- [ ] Transfer ownership

**Files to create**:
- `src/app/projects/[id]/settings/page.tsx`
- `src/components/projects/project-settings-form.tsx`
- `src/app/api/projects/[id]/settings/route.ts` - Update settings endpoint

---

#### 9. **Project Sharing & Permissions** - Priority: MEDIUM
**Current**: Public/private flag only  
**TODO**:
- [ ] Share project with specific users
- [ ] Permission levels (viewer, editor, admin)
- [ ] Shareable links with tokens
- [ ] Embed code for projects
- [ ] Public project discovery settings

**Files to create**:
- `src/app/projects/[id]/share/page.tsx` - Share settings
- `src/components/projects/share-project.tsx`
- `src/components/projects/collaborators-list.tsx`
- Database: Add `project_collaborators` table
- `src/app/api/projects/[id]/collaborators/route.ts`

---

#### 10. **Project Templates** - Priority: MEDIUM
**Current**: No templates system  
**TODO**:
- [ ] Templates page (`/templates`)
- [ ] Template categories (HTML, React, Vue, etc.)
- [ ] Template preview
- [ ] Create project from template
- [ ] User-created templates (optional)
- [ ] Template marketplace (future)

**Files to create**:
- `src/app/templates/page.tsx`
- `src/components/templates/template-grid.tsx`
- `src/components/templates/template-card.tsx`
- `src/components/templates/template-preview.tsx`
- Database: Add `project_templates` table
- `src/app/api/templates/route.ts` - Templates API

---

### PHASE 4: Enhanced Features (Week 2+)

#### 11. **User Profile Public Page** - Priority: MEDIUM
**Current**: No public profile  
**TODO**:
- [ ] Public profile page (`/profile/[username]`)
- [ ] Display user's public projects
- [ ] User stats (projects, likes, followers)
- [ ] Bio and social links
- [ ] Activity feed (optional)
- [ ] Follow/unfollow functionality (future)

**Files to create**:
- `src/app/profile/[username]/page.tsx`
- `src/components/profile/profile-header.tsx`
- `src/components/profile/user-projects.tsx`
- `src/components/profile/user-stats.tsx`

---

#### 12. **Onboarding Flow** - Priority: LOW
**Current**: No onboarding  
**TODO**:
- [ ] Welcome modal after signup
- [ ] Quick tour of dashboard
- [ ] Set up profile prompt
- [ ] First project creation wizard
- [ ] Onboarding checklist
- [ ] Skip/complete onboarding tracking

**Files to create**:
- `src/components/onboarding/welcome-modal.tsx`
- `src/components/onboarding/dashboard-tour.tsx`
- `src/components/onboarding/onboarding-checklist.tsx`
- Update `onboarding_completed` flag in database

---

## 🗂️ Database Schema Updates Needed

### New Tables to Create

#### 1. `project_collaborators`
```sql
CREATE TABLE project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON project_collaborators(user_id);
```

#### 2. `project_templates`
```sql
CREATE TABLE project_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  content JSONB NOT NULL,
  tags TEXT[],
  is_official BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON project_templates(category);
CREATE INDEX idx_templates_language ON project_templates(language);
```

#### 3. `user_sessions`
```sql
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  device TEXT,
  browser TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
```

### Existing Tables to Update

#### Update `user_profiles`
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
```

#### Update `projects`
```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_likes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
```

---

## 📋 Implementation Checklist

### Week 1: Core Auth & Profile

#### Days 1-2: Password Reset & Email Verification
- [ ] Create reset password form component
- [ ] Create update password form component
- [ ] Implement email verification page
- [ ] Add verification banner to dashboard
- [ ] Test password reset flow end-to-end
- [ ] Test email verification flow

#### Days 3-4: Profile Settings
- [ ] Create profile settings page
- [ ] Implement avatar upload to Supabase Storage
- [ ] Add profile form with all fields
- [ ] Add social links section
- [ ] Test profile updates
- [ ] Add validation and error handling

#### Days 5-7: Account & Security Settings
- [ ] Create account settings page
- [ ] Implement change email functionality
- [ ] Implement change password functionality
- [ ] Add danger zone (delete account)
- [ ] Create data export endpoint
- [ ] Add active sessions management
- [ ] Test all account operations

---

### Week 2: Project Management

#### Days 8-10: Project Creation & Settings
- [ ] Create project creation page/modal
- [ ] Implement template selector
- [ ] Add project settings page
- [ ] Implement project update functionality
- [ ] Add project deletion with confirmation
- [ ] Test project CRUD operations

#### Days 11-12: Project Sharing
- [ ] Create `project_collaborators` table
- [ ] Implement share project UI
- [ ] Add collaborators management
- [ ] Implement permission checks
- [ ] Test sharing functionality

#### Days 13-14: Templates & Polish
- [ ] Create `project_templates` table
- [ ] Seed initial templates
- [ ] Build templates page
- [ ] Add template preview
- [ ] Implement create from template
- [ ] Final testing and bug fixes
- [ ] Update documentation

---

## 🎯 Success Criteria

### Must-Have for Phase 1 Launch
- ✅ Users can register and login (email + OAuth)
- ✅ Users can reset password
- ✅ Users can verify email
- ✅ Users can edit profile (name, bio, avatar)
- ✅ Users can create projects from website
- ✅ Users can edit project settings
- ✅ Users can delete projects
- ✅ Users can change account settings
- ✅ Users can export data
- ✅ Users can delete account

### Nice-to-Have (Can be Post-Launch)
- ⏳ Project sharing with collaborators
- ⏳ Project templates marketplace
- ⏳ Public user profiles
- ⏳ Onboarding flow
- ⏳ Active sessions management
- ⏳ Follow/unfollow users

---

## 🚀 Quick Start

### Step 1: Database Updates
```bash
# Run database migration
psql $DATABASE_URL < website/database-migrations/auth-completion.sql
```

### Step 2: Environment Variables
Verify `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Step 3: Start Development
```bash
cd website
npm run dev
```

### Step 4: Begin with Password Reset
Start with the highest-impact, lowest-risk feature first.

---

## 📊 Progress Tracking

Update this section as you complete tasks:

**Week 1 Progress**: 0/7 days
- [ ] Day 1: Password reset form
- [ ] Day 2: Email verification
- [ ] Day 3: Profile settings page
- [ ] Day 4: Avatar upload
- [ ] Day 5: Account settings
- [ ] Day 6: Security features
- [ ] Day 7: Testing & fixes

**Week 2 Progress**: 0/7 days
- [ ] Day 8: Project creation
- [ ] Day 9: Project settings
- [ ] Day 10: Project deletion
- [ ] Day 11: Project sharing
- [ ] Day 12: Collaborators
- [ ] Day 13: Templates
- [ ] Day 14: Final polish

---

## 🎉 Completion

When all must-have features are complete:
1. Update `PROJECT_STATUS.md` - Change Auth from 30% → 100%
2. Create `AUTH_SYSTEM_COMPLETE.md` - Implementation summary
3. Move this plan to `docs/archive/`
4. Celebrate! 🎊

---

**Last Updated**: October 14, 2025  
**Next Review**: October 21, 2025  
**Status**: Ready to begin Week 1
