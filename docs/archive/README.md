# Archive - Completed & Historical Documentation

This directory contains documentation for completed features, deprecated plans, and historical records.

## ✅ Completed Implementations

Features that have been successfully implemented and deployed to production:

### Core Features
- **[Backend Monetization Implementation](./BACKEND_MONETIZATION_IMPLEMENTATION.md)** ✅
  - Free tier AI with platform API key
  - Premium tier with user API keys
  - Rate limiting (100 req/hour)
  - Usage tracking and admin moderation
  - **Completed**: October 1, 2025

- **[Domain Migration](./DOMAIN_MIGRATION.md)** ✅
  - Merged two-domain to single-domain architecture
  - Editor served at `/editor/` as static files
  - Same-origin API calls (no CORS)
  - 150ms faster load time
  - **Completed**: October 1, 2025

- **[Chat Panel API Fix](./CHAT_PANEL_API_FIX.md)** ✅
  - Fixed 401 errors for free models
  - Routed through backend API
  - Free models work without API key
  - **Completed**: October 6, 2025

### User Experience
- **[Guest Mode Implementation](./GUEST_MODE_IMPLEMENTATION.md)** ✅
  - Guest user flow without signup
  - Limited AI usage (10 requests)
  - Welcome screen and onboarding
  - **Completed**: September 2025

- **[Signup Flow Implementation](./SIGNUP_FLOW_IMPLEMENTATION.md)** ✅
  - User registration with Supabase
  - Email verification
  - Profile creation
  - **Completed**: September 2025

---

## 📦 Deprecated Plans

Plans that were superseded or changed:

- **[Guest Mode UX Fix](./GUEST_MODE_UX_FIX.md)** - Improved in later iterations
- **[New Monetization Model](./NEW_MONETIZATION_MODEL.md)** - Initial monetization ideas (evolved into current implementation)
- **[Website Editor Integration Strategy](./WEBSITE_EDITOR_INTEGRATION_STRATEGY_TODO.md)** - Superseded by domain migration

---

## 📊 Session Summaries

Historical development session summaries:

- **[Session Summary - Sept 30, 2024](./SESSION_SUMMARY_SEPT_30.md)**
  - Critical bug fixes
  - Terminal output improvements
  - Preview reload fixes

---

## 📝 Historical Changelogs

- **[Changelog (Legacy)](./changelog.md)** - Historical changelog (now maintained in root)

---

## 🗂️ Organization

### Why Archive?
- Preserve implementation details for reference
- Track what was tried and what worked
- Learn from past decisions
- Maintain project history

### What Goes Here?
1. **Completed implementations** - Features that are done and deployed
2. **Deprecated plans** - Plans that were changed or abandoned
3. **Session summaries** - Historical development records
4. **Old changelogs** - Legacy documentation

### What Stays Active?
- Current development plans → `/plans`
- Active guides → `/guides`
- Work in progress → `/plans`

---

## 📈 Feature Timeline

### September 2025
- ✅ Guest Mode Implementation
- ✅ Signup Flow
- ✅ Critical Editor Bug Fixes

### October 2025
- ✅ Backend Monetization System
- ✅ Domain Migration (Single Domain)
- ✅ Chat Panel API Routing
- ✅ Production Deployment

---

## 🔍 Quick Reference

### Implementation Details

**Monetization System**:
- Free tier: 100 requests/hour
- Free models: DeepSeek R1, DeepSeek Chat, Gemma 3
- Premium: User's own API keys
- Backend proxy: `/api/ai/free` and `/api/ai/premium`

**Architecture**:
- Single domain: `ailiveeditor.netlify.app`
- Editor path: `/editor/`
- API path: `/api/*`
- Static files: `/public/editor/`

**Tech Stack**:
- Frontend: Next.js 15, Vanilla JS
- Database: Supabase (PostgreSQL)
- AI: OpenRouter
- Hosting: Netlify

---

## 📚 Learning from History

### Key Decisions
1. **Single Domain** - Eliminated CORS issues, simplified deployment
2. **Backend Proxy** - Security, rate limiting, monetization control
3. **Free Tier** - Lower barrier to entry, user acquisition
4. **Static Editor** - Fast, portable, easy to extract for desktop app

### Lessons Learned
- Same-origin architecture simplifies authentication
- Backend proxy is essential for API key security
- Free tier increases user adoption
- Clear documentation speeds up development

---

## 🔄 Moving Documents

### To Archive
When a feature is completed:
```bash
# Move from /plans to /archive
Move-Item -Path "docs/plans/FEATURE.md" -Destination "docs/archive/"

# Update both README files
# Add completion date and status
```

### From Archive
If reviving an old feature:
```bash
# Move back to /plans
Move-Item -Path "docs/archive/FEATURE.md" -Destination "docs/plans/"

# Update status to active
```

---

**Back to**: [Documentation Index](../README.md)
