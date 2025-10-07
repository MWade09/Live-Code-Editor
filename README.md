# Live Editor Claude - Complete Platform

This repository contains the **Live Code Editor** integrated within a **Next.js Marketing & Community Website** as a unified platform.

## 🏗️ Project Structure

```
LiveEditorClaude/
├── editor/                    # Source: Vanilla JS Editor (archived)
│   ├── index.html            # Original editor files
│   ├── css/                  # Original styles
│   └── js/                   # Original JavaScript modules
├── website/                   # Next.js Platform
│   ├── public/
│   │   └── editor/           # Static editor files served at /editor/
│   ├── src/                  # Next.js application source
│   ├── package.json          # Platform dependencies
│   └── next.config.ts        # Platform build config
├── docs/                     # Documentation
└── shared/                   # Shared assets/configs
```

## 🚀 Deployment

**Single Domain**: https://ailiveeditor.netlify.app
- Homepage & marketing pages: `/`
- Live editor: `/editor/`
- API endpoints: `/api/*`
- User dashboard: `/dashboard`
- Projects: `/my-projects`

The entire platform deploys from `/website` directory. The editor is served as static files from `/public/editor/`.

## 💻 Local Development

### Full Platform
```bash
# Start Next.js development server (includes editor)
cd website
npm run dev

# Access at:
# http://localhost:3000/ - Homepage
# http://localhost:3000/editor/ - Editor
# http://localhost:3000/dashboard - Dashboard
```

### Editor Only (Standalone)
```bash
# Serve original editor files for development
cd editor
# Use Live Server extension or any static server
```

## 🔗 Architecture

**Single-Origin Benefits**:
- ✅ No CORS issues (same-origin API calls)
- ✅ Simplified authentication flow
- ✅ Unified deployment & environment variables
- ✅ Faster navigation (no domain switching)
- ✅ Editor remains portable for future desktop app

## 📚 Documentation

**[📖 Full Documentation Index](./docs/README.md)** - Complete documentation organized by purpose

### Quick Links
- **[Active Plans](./docs/plans/)** - Current development roadmap and TODO
- **[Setup Guides](./docs/guides/)** - Environment setup, deployment, and development
- **[Archive](./docs/archive/)** - Completed features and historical docs

### Getting Started
1. **[Quick Start Guide](./docs/guides/QUICK_START_GUIDE.md)** - Get running in 5 minutes
2. **[Environment Setup](./docs/guides/ENVIRONMENT_SETUP.md)** - Configure your dev environment
3. **[Quick Deployment](./docs/guides/QUICK_DEPLOYMENT_GUIDE.md)** - Deploy to production

### For Developers
- **[Development Rules](./docs/guides/DEVELOPMENT_RULES.md)** - Coding standards
- **[Production Roadmap](./docs/plans/PRODUCTION_ROADMAP.md)** - Feature roadmap
- **[TODO List](./docs/plans/TODO.md)** - Active tasks

---

## 🎯 Current Status (October 2025)

### ✅ Production Features
- ✅ Single-domain architecture
- ✅ Free tier AI (no API key required)
- ✅ Premium tier AI (user API keys)  
- ✅ Rate limiting (100 req/hour)
- ✅ User authentication
- ✅ Project management
- ✅ Real-time collaboration

### 📊 Tech Stack
- **Frontend**: Next.js 15 + Vanilla JS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter
- **Hosting**: Netlify
- **Auth**: Supabase Auth

---

## 🤝 Contributing

See [Development Rules](./docs/guides/DEVELOPMENT_RULES.md) for coding standards and guidelines.