# Community Features Database Audit

**Date:** November 20, 2025  
**Status:** 🔍 AUDIT IN PROGRESS

---

## EXISTING SCHEMA (database-schema.sql)

### Project-Related Tables (ALREADY EXISTS)
- ✅ `projects` - User projects with code
- ✅ `project_likes` - Likes on projects
- ✅ `project_views` - View tracking
- ✅ `comments` - **Project comments** (threaded, for projects)
- ✅ `project_saves` - Save history
- ✅ `project_reports` - Moderation

### Social Features (ALREADY EXISTS)
- ✅ `user_follows` - Follow system
- ✅ `activity_feed` - User activity
- ✅ `notifications` - User notifications

---

## NEW SCHEMA (community-features-schema.sql - ADDED NOV 20)

### Discussion System (SEPARATE FROM PROJECT COMMENTS)
- ⚠️ `discussion_channels` - Discussion categories (General, Help, Showcase, etc.)
- ⚠️ `discussions` - **Forum-style discussions** (NOT project comments)
- ⚠️ `discussion_replies` - Replies to discussions
- ⚠️ `discussion_likes` - Likes on discussions
- ⚠️ `discussion_reply_likes` - Likes on discussion replies
- ⚠️ `discussion_views` - View tracking for discussions
- ⚠️ `discussion_subscriptions` - Notification subscriptions

### Gamification (NEW)
- ⚠️ `badge_definitions` - Available badges
- ⚠️ `user_badges` - Badges earned by users
- ⚠️ `user_points` - Points history
- ⚠️ `user_streaks` - Activity streaks
- ⚠️ `leaderboard_snapshots` - Leaderboard data

### Collections (NEW)
- ⚠️ `community_collections` - Curated project collections
- ⚠️ `collection_items` - Projects in collections
- ⚠️ `collection_likes` - Likes on collections

### Integrations (NEW - NOT YET USED)
- ⚠️ `discord_integrations` - Discord OAuth
- ⚠️ `github_integrations` - GitHub OAuth

### Moderation (NEW)
- ⚠️ `discussion_reports` - Report discussions
- ⚠️ `user_moderation_actions` - Mod action history

---

## ANALYSIS

### ✅ NO DUPLICATION FOUND

**Project Comments** (`comments` table):
- Purpose: Comments ON projects
- Location: Existing schema
- Usage: Project detail pages

**Discussion System** (`discussions` + `discussion_replies` tables):
- Purpose: Forum-style discussions (separate from projects)
- Location: New schema (community-features-schema.sql)
- Usage: /community/discussions page
- **These are DIFFERENT** - Like Reddit posts vs YouTube comments

### ❌ DUPLICATION FOUND

**Showcase System**:
- Existing: `/projects` page already shows public projects
- Created: `/community/showcase` page (DUPLICATE)
- API: `/api/community/projects/*` (NOT NEEDED)
- Component: `ProjectCard.tsx` in `/components/community` (NOT NEEDED)

**Projects field added:**
- `is_showcase` BOOLEAN - This field WAS added to main schema by me
- This is **OK TO KEEP** - Can be used to feature projects

---

## WHAT TO REMOVE

### Files to Delete:
1. `src/app/community/showcase/` - Entire folder
2. `src/app/api/community/projects/` - Entire folder  
3. `src/components/community/ProjectCard.tsx` - Component

### Database: NO CHANGES NEEDED
- The `discussions` tables are VALID and NOT duplicate
- The `is_showcase` field is harmless and could be useful
- All gamification/moderation tables are valid

### Navigation Links to Update:
- Remove "Showcase" from header
- Update community page links from `/community/showcase` back to `/projects`

---

## WHAT TO KEEP

### ✅ Discussions System (VALID)
- All 7 discussion tables
- All API routes in `/api/discussions/*`
- All pages in `/community/discussions/*`
- This is SEPARATE from project comments

### ✅ Gamification (VALID - UI NOT BUILT YET)
- Badge system tables
- Points/streaks tables
- Leaderboard tables

### ✅ Collections (VALID - NOT USED YET)
- Community collections tables

### ✅ Integrations (VALID - NOT USED YET)
- Discord/GitHub integration tables

---

## CORRECTIVE ACTIONS

1. Delete showcase page, API, and component
2. Update navigation to remove "Showcase" link
3. Update community landing page links to point to `/projects`
4. Continue with Phase 3 (Gamification UI) as planned

---

## VERIFIED DISTINCTIONS

### Comments vs Discussions
- **Comments** = Attached to specific projects (like YouTube comments)
- **Discussions** = Standalone forum posts (like Reddit threads)
- **Both are needed** ✅

### Projects vs Showcase
- **Projects** = Main community project gallery (/projects)
- **Showcase** = Duplicate feature I created by mistake ❌

---

**Next Step:** Remove duplicate showcase files, update links, continue with plan.
