# Setup & Usage Guides

This directory contains all setup instructions, how-to guides, and reference documentation for developers and users.

## 🚀 Getting Started

### Quick Start
1. **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get up and running in 5 minutes
2. **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Set up your development environment
3. **[Database Setup](./DATABASE_SETUP.md)** - Configure the database

### Deployment
- **[Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md)** - Deploy to production

---

## 👨‍💻 Development

### Coding Standards
- **[Development Rules](./DEVELOPMENT_RULES.md)** - Coding standards, conventions, and best practices
- **[AI Assistant Rules](./AI_ASSISTANT_RULES.md)** - Guidelines for AI-assisted development

### Documentation
- **[Changelog Format](./CHANGELOG_FORMAT.md)** - How to write and maintain changelogs
- **[Code Preview Guide](./CODE_PREVIEW_GUIDE.md)** - Using the code preview functionality

---

## 📚 Guide Categories

### Setup Guides
For getting the project running locally or in production:
- Environment configuration
- Database setup
- API keys and secrets
- Local development server

### Development Guides
For developers working on the codebase:
- Coding standards
- Git workflow
- Testing procedures
- Documentation practices

### Usage Guides
For using the platform features:
- Code preview functionality
- AI assistant usage
- Editor features

---

## 🔍 Quick Reference

### Environment Variables
See: [Environment Setup](./ENVIRONMENT_SETUP.md)
```env
OPENROUTER_PLATFORM_KEY=sk-or-v1-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://...
```

### Development Commands
```bash
# Start development server
cd website && npm run dev

# Build for production
cd website && npm run build

# Run linter
cd website && npm run lint
```

### Deployment
See: [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md)
- Push to GitHub → Auto-deploys to Netlify
- Environment variables set in Netlify dashboard

---

## ❓ Common Questions

**Q: How do I set up my local environment?**  
A: Follow [Environment Setup](./ENVIRONMENT_SETUP.md)

**Q: How do I deploy to production?**  
A: Follow [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md)

**Q: What are the coding standards?**  
A: See [Development Rules](./DEVELOPMENT_RULES.md)

**Q: How do I write changelogs?**  
A: See [Changelog Format](./CHANGELOG_FORMAT.md)

---

## 📝 Contributing to Guides

When adding a new guide:
1. Follow the same format as existing guides
2. Add it to this README under the appropriate category
3. Update the main [Documentation Index](../README.md)
4. Include code examples where relevant
5. Add troubleshooting sections

### Guide Template
```markdown
# Guide Title

Brief description of what this guide covers.

## Prerequisites
- List what's needed before starting

## Steps
1. Step one
2. Step two
3. Step three

## Troubleshooting
Common issues and solutions

## Next Steps
Where to go from here
```

---

**Back to**: [Documentation Index](../README.md)
