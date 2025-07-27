# Live Editor Claude - Complete Platform

This repository contains both the **Live Code Editor** and the **Marketing/Community Website** as separate deployable applications.

## 🏗️ Project Structure

```
LiveEditorClaude/
├── editor/                    # Vanilla JS Live Code Editor
│   ├── index.html            # Main editor application
│   ├── css/                  # Editor styles
│   ├── js/                   # Editor JavaScript modules
│   └── netlify.toml          # Editor deployment config
├── website/                   # Next.js Marketing & Community Site
│   ├── src/                  # Next.js application source
│   ├── package.json          # Website dependencies
│   └── next.config.ts        # Website build config
├── docs/                     # Shared documentation
└── shared/                   # Shared assets/configs
```

## 🚀 Deployments

- **Live Editor**: https://ai-assisted-editor.netlify.app (deploys from `/editor`)
- **Website**: https://ai-assisted-editor-community.netlify.app (deploys from `/website`)

## 💻 Local Development

### Editor Development
```bash
# Serve editor locally
cd editor
# Use Live Server extension or any static server
```

### Website Development
```bash
# Start Next.js development server
cd website
npm run dev
```

## 🔗 Integration

The editor and website are integrated through:
- Shared authentication (Supabase)
- Cross-navigation buttons
- Project sharing capabilities
- Unified user experience

## 📚 Documentation

See `/docs` folder for detailed documentation on both applications.
