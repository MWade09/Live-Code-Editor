# LiveEditor Documentation

**Last Updated**: October 6, 2025

This directory contains all project documentation organized by purpose. Use this index to quickly find what you need.

---

## 📋 Quick Links

- **[Active Development Plans](./plans/)** - Current roadmaps and implementation plans
- **[Setup & Usage Guides](./guides/)** - How to set up and use the platform
- **[Archive](./archive/)** - Completed implementations and historical docs

---

## 🎯 Active Development Plans (`/plans`)

Current development roadmaps and implementation strategies:

- **[Production Roadmap](./plans/PRODUCTION_ROADMAP.md)** - High-level production goals
- **[Website Implementation Plan](./plans/WEBSITE_IMPLEMENTATION_PLAN.md)** - Website development plan
- **[TODO](./plans/TODO.md)** - Active task list

---

## 📚 Setup & Usage Guides (`/guides`)

Step-by-step guides for developers and users:

### Setup Guides
- **[Environment Setup](./guides/ENVIRONMENT_SETUP.md)** - Local development environment
- **[Database Setup](./guides/DATABASE_SETUP.md)** - Database configuration
- **[Quick Start Guide](./guides/QUICK_START_GUIDE.md)** - Get started quickly
- **[Quick Deployment Guide](./guides/QUICK_DEPLOYMENT_GUIDE.md)** - Deploy to production

### Development Guides
- **[Development Rules](./guides/DEVELOPMENT_RULES.md)** - Coding standards and practices
- **[Code Preview Guide](./guides/CODE_PREVIEW_GUIDE.md)** - Preview functionality guide
- **[Changelog Format](./guides/CHANGELOG_FORMAT.md)** - How to write changelogs

### AI Assistant
- **[AI Assistant Rules](./guides/AI_ASSISTANT_RULES.md)** - Guidelines for AI development

---

## 📦 Archive (`/archive`)

Completed implementations and historical documentation:

### Completed Features
- **[Backend Monetization](./archive/BACKEND_MONETIZATION_IMPLEMENTATION.md)** - AI monetization system ✅
- **[Domain Migration](./archive/DOMAIN_MIGRATION.md)** - Single-domain architecture ✅
- **[Chat Panel API Fix](./archive/CHAT_PANEL_API_FIX.md)** - Free tier AI routing ✅
- **[Guest Mode Implementation](./archive/GUEST_MODE_IMPLEMENTATION.md)** - Guest user flow ✅
- **[Signup Flow](./archive/SIGNUP_FLOW_IMPLEMENTATION.md)** - User registration ✅

### Session Summaries
- **[Session Sept 30, 2024](./archive/SESSION_SUMMARY_SEPT_30.md)** - Critical bug fixes
- **[Changelog](./archive/changelog.md)** - Historical changelog

### Deprecated Plans
- **[New Monetization Model](./archive/NEW_MONETIZATION_MODEL.md)** - Initial monetization ideas
- **[Guest Mode UX Fix](./archive/GUEST_MODE_UX_FIX.md)** - UX improvements
- **[Website Editor Integration](./archive/WEBSITE_EDITOR_INTEGRATION_STRATEGY_TODO.md)** - Integration strategy

---

## 🏗️ Project Structure

```
docs/
├── README.md                    # This file - documentation index
├── plans/                       # Active development plans
│   ├── PRODUCTION_ROADMAP.md
│   ├── WEBSITE_IMPLEMENTATION_PLAN.md
│   └── TODO.md
├── guides/                      # Setup and usage guides
│   ├── ENVIRONMENT_SETUP.md
│   ├── DATABASE_SETUP.md
│   ├── QUICK_START_GUIDE.md
│   ├── QUICK_DEPLOYMENT_GUIDE.md
│   ├── DEVELOPMENT_RULES.md
│   ├── CODE_PREVIEW_GUIDE.md
│   ├── CHANGELOG_FORMAT.md
│   └── AI_ASSISTANT_RULES.md
└── archive/                     # Completed/historical docs
    ├── BACKEND_MONETIZATION_IMPLEMENTATION.md
    ├── DOMAIN_MIGRATION.md
    ├── CHAT_PANEL_API_FIX.md
    ├── GUEST_MODE_IMPLEMENTATION.md
    ├── SIGNUP_FLOW_IMPLEMENTATION.md
    ├── SESSION_SUMMARY_SEPT_30.md
    ├── changelog.md
    └── [deprecated plans]
```

---

## 📝 Documentation Guidelines

### When to Use Each Directory

**`/plans`** - Active Development
- Current roadmaps
- Implementation plans in progress
- Active TODO lists
- Future feature plans

**`/guides`** - Reference Documentation
- Setup instructions
- How-to guides
- Coding standards
- Usage documentation

**`/archive`** - Historical Records
- Completed implementations
- Deprecated plans
- Session summaries
- Old changelogs

### Creating New Documentation

1. **New Feature Plan** → Save to `/plans`
2. **Setup Guide** → Save to `/guides`
3. **Completed Feature** → Move from `/plans` to `/archive`
4. **Update this README** → Keep index current

---

## 🚀 Current Status (October 2025)

### ✅ Production Features
- Single-domain architecture (website + editor)
- Free tier AI (no API key required)
- Premium tier AI (user API keys)
- Rate limiting (100 req/hour free tier)
- User authentication (Supabase)
- Project management (CRUD)
- Version control integration
- Real-time collaboration

### 🔨 In Development
- Check `/plans` directory for current roadmap

### 📊 Platform Stats
- **Live URL**: https://ailiveeditor.netlify.app
- **Editor**: https://ailiveeditor.netlify.app/editor/
- **Architecture**: Next.js 15 + Vanilla JS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Netlify

---

## 🆘 Need Help?

- **Setup Issues** → Check `/guides/ENVIRONMENT_SETUP.md`
- **Deployment** → Check `/guides/QUICK_DEPLOYMENT_GUIDE.md`
- **Development** → Check `/guides/DEVELOPMENT_RULES.md`
- **Features** → Check `/plans/PRODUCTION_ROADMAP.md`

---

**Contributing**: Follow the guidelines in `/guides/DEVELOPMENT_RULES.md`

**License**: See root `LICENSE` file
