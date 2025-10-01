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

See `/docs` folder for detailed documentation on both applications.