# 📚 Live Code Editor - Documentation Index

**Last Updated**: October 14, 2025

This directory contains all project documentation. Follow this guide to find what you need.

---

## 🎯 START HERE

### New to the Project?
1. Read **`PRODUCT_VISION.md`** - Understand the overall product strategy
2. Read **`PROJECT_STATUS.md`** - See current progress and roadmap
3. Review **`AI_CHAT_QUICK_START.md`** - Get started with AI features

### Looking for Implementation Details?
- See **Active Technical Documentation** section below

### Need to Reference Old Plans?
- See `archive/old-plans/` directory

---

## 📖 ACTIVE DOCUMENTATION

### 🌟 Master Documents

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| **`PRODUCT_VISION.md`** | Overall product strategy, dual-mode vision, long-term roadmap | Oct 2025 |
| **`PROJECT_STATUS.md`** | Current progress, completion status, immediate roadmap | Oct 14, 2025 |

### 🤖 AI System Documentation

| Document | Purpose | Status |
|----------|---------|--------|
| **`UNIFIED_AI_IMPLEMENTATION_COMPLETE.md`** | UnifiedAI system architecture and implementation | ✅ Complete |
| **`AI_CHAT_QUICK_START.md`** | Quick start guide for using AI features | ✅ Active |
| **`CHAT_PANEL_INTEGRATION_GUIDE.md`** | How to integrate with chat panel | ✅ Active |

### 🔧 Technical Implementation Docs

| Document | Purpose | Status |
|----------|---------|--------|
| **`MULTI_FILE_PROJECT_DISPLAY_FIX.md`** | Multi-file project display on website | ✅ Complete (Oct 14, 2025) |
| **`MULTI_FILE_PROJECT_SYNC_FIX.md`** | Multi-file project sync between editor and DB | ✅ Complete |
| **`INTEGRATION_FIXES_COMPLETE.md`** | Integration fixes (UnifiedAI + HTML IDs) | ✅ Complete (Oct 11, 2025) |
| **`MODE_TOGGLE_REMOVAL_SUMMARY.md`** | Chat/Agent mode toggle removal | ✅ Complete (Oct 10, 2025) |
| **`PLATFORM_KEY_SYSTEM_FIX.md`** | Platform key system fixes | ✅ Complete |

### 📝 Planning Documents (Active)

| Document | Purpose | Status |
|----------|---------|--------|
| **`plans/ENHANCED_AI_CHAT_IMPLEMENTATION.md`** | Enhanced AI chat features | 📋 Planning |
| **`plans/WEBSITE_IMPLEMENTATION_PLAN.md`** | Website development plan | ⏳ In Progress |

---

## �️ ARCHIVED DOCUMENTATION

Located in `archive/old-plans/` and `archive/` directories:

### Recently Archived (October 2025)

| Document | Location | Reason for Archiving |
|----------|----------|---------------------|
| `UNIFIED_AI_MODE_PLAN.md` | `archive/old-plans/` | Superseded by implementation complete doc |
| `UNIFIED_AI_IMPLEMENTATION_ROADMAP.md` | `archive/old-plans/` | Implementation finished |
| `UNIFIED_AI_MODE_TODO.md` | `archive/old-plans/` | Tasks complete |
| `PRODUCTION_ROADMAP.md` | `archive/old-plans/` | Too granular, doesn't match current progress |
| `TODO.md` | `archive/old-plans/` | Outdated (last updated July 2025) |

### Historical Archives (2024-Early 2025)

Located in `archive/`:
- Backend monetization implementation
- Domain migration docs
- Chat panel API fixes
- Guest mode implementation
- Signup flow documentation
- Session summaries and changelogs

---

## 📁 DIRECTORY STRUCTURE

```
docs/
├── README.md (this file)
├── PRODUCT_VISION.md ⭐ Master vision document
├── PROJECT_STATUS.md ⭐ Current status and roadmap
│
├── AI_CHAT_QUICK_START.md
├── CHAT_PANEL_INTEGRATION_GUIDE.md
├── UNIFIED_AI_IMPLEMENTATION_COMPLETE.md
│
├── MULTI_FILE_PROJECT_DISPLAY_FIX.md
├── MULTI_FILE_PROJECT_SYNC_FIX.md
├── INTEGRATION_FIXES_COMPLETE.md
├── MODE_TOGGLE_REMOVAL_SUMMARY.md
├── PLATFORM_KEY_SYSTEM_FIX.md
│
├── plans/
│   ├── README.md
│   ├── ENHANCED_AI_CHAT_IMPLEMENTATION.md
│   └── WEBSITE_IMPLEMENTATION_PLAN.md
│
├── features/ (feature-specific docs)
├── guides/ (how-to guides)
│
└── archive/
    ├── old-plans/ (outdated planning documents from 2025)
    │   ├── UNIFIED_AI_MODE_PLAN.md
    │   ├── UNIFIED_AI_IMPLEMENTATION_ROADMAP.md
    │   ├── UNIFIED_AI_MODE_TODO.md
    │   ├── PRODUCTION_ROADMAP.md
    │   └── TODO.md
    └── [historical docs from 2024-early 2025]
```

---

## 🔍 FINDING WHAT YOU NEED

### "What's the current status of the project?"
→ Read **`PROJECT_STATUS.md`**

### "What's the long-term vision?"
→ Read **`PRODUCT_VISION.md`**

### "How does the AI system work?"
→ Read **`UNIFIED_AI_IMPLEMENTATION_COMPLETE.md`**

### "How do I use AI features in the editor?"
→ Read **`AI_CHAT_QUICK_START.md`**

### "What was recently completed?"
→ See "Recent Wins" section in **`PROJECT_STATUS.md`**

### "What's next on the roadmap?"
→ See "Recommended Focus Areas" in **`PROJECT_STATUS.md`**

### "How do I integrate with the chat panel?"
→ Read **`CHAT_PANEL_INTEGRATION_GUIDE.md`**

---

## 📝 DOCUMENTATION STANDARDS

### When to Create New Documentation

**DO create a new document when:**
- Implementing a major feature (e.g., new AI system, terminal integration)
- Completing a significant refactor
- Fixing a complex bug that needs explanation
- Creating a guide or tutorial

**DON'T create a new document for:**
- Minor bug fixes (use git commit messages)
- Small tweaks or adjustments
- Work-in-progress notes (use comments in code)

### Document Naming Conventions

- **Feature implementation**: `FEATURE_NAME_IMPLEMENTATION.md`
- **Fixes**: `ISSUE_NAME_FIX.md`
- **Guides**: `TOPIC_GUIDE.md` or `TOPIC_QUICK_START.md`
- **Plans**: `FEATURE_PLAN.md` or `FEATURE_ROADMAP.md`

### When to Archive

Archive a document when:
- It's superseded by a newer document
- The feature is complete and the doc is no longer referenced
- The plan is outdated or changed significantly
- It's more than 6 months old and no longer relevant

**ALWAYS** move to `archive/` instead of deleting. Include reason in this README.

### Updating Status Documents

- **`PROJECT_STATUS.md`**: Update weekly with progress
- **`PRODUCT_VISION.md`**: Update quarterly or when strategy changes
- **Implementation docs**: Mark as "Complete" with date when done

---

## 🎯 QUICK REFERENCE

### Phase 1 Priorities (Current - October 2025)
1. Authentication & User System
2. Terminal Integration
3. Deployment Integration
4. Testing Infrastructure

See **`PROJECT_STATUS.md`** for detailed breakdown.

### Phase 1 Completion Status
**~75% Complete** (as of Oct 14, 2025)

### Estimated Timeline
**6-8 weeks to Phase 1 completion** (Late November - Early December 2025)

---

## 📞 CONTRIBUTING TO DOCUMENTATION

### Before Adding New Docs
1. Check if existing docs cover the topic
2. Review naming conventions above
3. Add entry to this README
4. Link from relevant documents

### After Implementation
1. Create implementation complete doc
2. Update PROJECT_STATUS.md
3. Archive any superseded planning docs
4. Update this README

### Keeping Docs Fresh
- Review and update PROJECT_STATUS.md weekly
- Archive outdated docs immediately
- Keep this README current
- Update "Last Updated" dates
