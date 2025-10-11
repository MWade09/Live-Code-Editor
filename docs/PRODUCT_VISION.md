# Product Vision & Dual-Mode Strategy

## Overview
Live Code Editor is being developed as a **dual-mode AI-powered development platform** with two distinct user experiences sharing the same core technology.

## Product Modes

### Mode 1: Professional Editor (Current Focus)
**Target Users:** Developers, programmers, technical users  
**Inspiration:** Cursor, VS Code  
**Current Status:** In active development

**Key Features:**
- Full file system with folder structure
- Multiple file tabs
- Advanced code editor (CodeMirror)
- Terminal integration
- Git version control
- Manual file management
- Detailed debugging tools
- Multi-file AI assistance
- Project-wide context awareness

**User Persona: "Sarah the Developer"**
- 5+ years coding experience
- Works with multiple languages
- Needs full control over project structure
- Comfortable with terminal commands
- Values keyboard shortcuts and efficiency

---

### Mode 2: Beginner Builder (Planned)
**Target Users:** Non-programmers, beginners, designers, marketers  
**Inspiration:** Replit, Lovable, Bolt.new, v0.dev  
**Current Status:** Planned for Phase 2

**Key Features:**
- **Visual-First Interface:** See the output, not the code
- **AI-Driven Workflow:** Describe what you want, AI builds it
- **Single Language Focus:** HTML/CSS/JS for web projects
- **No File Management:** Users don't see files unless they ask
- **Component Library:** Pre-built components to drag/drop or describe
- **Live Preview Dominant:** Code is secondary, preview is primary
- **Chat-Based Editing:** "Make the header blue", "Add a contact form"
- **Templates:** Start from pre-built designs
- **One-Click Deploy:** Publish instantly

**User Persona: "Mike the Marketer"**
- No coding experience
- Wants a landing page for product launch
- Describes needs in plain English: "I need a hero section with my logo and a signup form"
- Doesn't care about file structure
- Wants instant visual feedback

---

## Shared Core Architecture

Both modes share the same underlying technology:

```
┌─────────────────────────────────────────────┐
│         User Interface Layer                │
├──────────────────┬──────────────────────────┤
│  Professional    │    Beginner              │
│  Editor UI       │    Builder UI            │
│  (File-focused)  │    (Visual-focused)      │
└──────────────────┴──────────────────────────┘
         │                    │
         └────────┬───────────┘
                  ↓
┌─────────────────────────────────────────────┐
│         Shared Core Engine                  │
├─────────────────────────────────────────────┤
│  • FileManager (manages project files)      │
│  • Editor (CodeMirror)                      │
│  • Preview (iframe renderer)                │
│  • AIManager (OpenRouter integration)       │
│  • DeployManager (Netlify/Vercel)           │
│  • ProjectSyncManager (database sync)       │
└─────────────────────────────────────────────┘
         │                    │
         └────────┬───────────┘
                  ↓
┌─────────────────────────────────────────────┐
│         Backend Services                    │
├─────────────────────────────────────────────┤
│  • Supabase (auth, database, storage)       │
│  • OpenRouter (AI models)                   │
│  • Netlify/Vercel (deployment)              │
└─────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Complete Professional Editor (Current - Q4 2025)
**Goal:** Feature parity with Cursor for core workflows

**Remaining Features:**
- [x] Multi-File Context System ✅
- [x] Project-Wide Context Awareness ✅
- [x] Multi-File Edit Suggestions ✅
- [ ] Syntax-Highlighted Code Blocks (in progress)
- [ ] AI File Creation Capability
- [ ] Enhanced Agent Mode file creation
- [ ] Terminal integration improvements
- [ ] Git version control refinements
- [ ] Performance optimization
- [ ] User authentication & project saving

**Success Metrics:**
- Can build a complete multi-page website using only AI
- All files persist correctly
- AI understands entire project context
- Deploy to production works seamlessly

---

### Phase 2: Beginner Builder MVP (Q1 2026)
**Goal:** Non-programmers can build and deploy a website in 10 minutes

#### 2.1 - Visual-First Interface Design
**Tasks:**
- Design new UI layout with 80% preview, 20% controls
- Create component library (headers, forms, galleries, etc.)
- Build drag-drop interface for component placement
- Hide file explorer by default (show only on advanced toggle)

#### 2.2 - AI Conversation Flow
**Tasks:**
- Simplify AI prompts: "What would you like to build?"
- Add template selection: "Landing page", "Portfolio", "Blog"
- Implement visual change confirmations (highlight changes in preview)
- Add undo/redo for AI suggestions
- Create guided onboarding flow

#### 2.3 - Smart Code Generation
**Tasks:**
- AI generates complete HTML/CSS/JS from descriptions
- Intelligent component recommendations
- Automatic responsive design
- Accessibility by default
- SEO optimization built-in

#### 2.4 - Simplified Deployment
**Tasks:**
- One-click publish to custom domain
- Automatic SSL certificates
- Built-in form handling (Formspree/Netlify Forms)
- Analytics integration (Google Analytics, Plausible)

**Success Metrics:**
- Non-technical user can build a landing page in under 10 minutes
- No file management required for basic projects
- 90%+ of interactions through AI chat
- One-click deploy works 100% of time

---

### Phase 3: Feature Parity & Cross-Pollination (Q2 2026)
**Goal:** Both modes benefit from each other's innovations

#### 3.1 - Advanced Features for Beginners
- **AI Design Assistant:** "Make this look more professional"
- **Component Marketplace:** Browse and install pre-built components
- **A/B Testing:** AI generates variants for testing
- **SEO Wizard:** AI optimizes for search engines

#### 3.2 - Beginner Features for Pros
- **Quick Templates:** Pros can use beginner templates as starting points
- **Component Library:** Pros can use visual component picker
- **AI Design Review:** AI analyzes design and suggests improvements
- **Visual Diff Viewer:** See code changes visually

#### 3.3 - Mode Switching
- **Graduated Users:** "Switch to Pro Mode" unlocks file system
- **Pro Prototyping:** "Switch to Builder Mode" for quick mockups
- **Shared Projects:** Both modes can edit same project

---

## Technical Architecture Comparison

### Professional Editor (Current)
```javascript
// File-centric workflow
editor.openFile('index.html');
editor.showFileExplorer();
terminal.run('npm install');
versionControl.commit('Added header component');

// User sees:
// - File tree on left
// - Code editor in center
// - Preview on right
// - Terminal at bottom
```

### Beginner Builder (Planned)
```javascript
// Visual-centric workflow
builder.showTemplate('landing-page');
ai.chat('Add a hero section with my logo');
ai.chat('Make the header blue');
builder.publish();

// User sees:
// - Large preview (80% of screen)
// - AI chat box (always visible)
// - Component picker (optional)
// - Publish button (prominent)
// - Code hidden by default
```

---

## Feature Matrix

| Feature | Professional Editor | Beginner Builder |
|---------|-------------------|------------------|
| **File Explorer** | ✅ Always visible | ⚠️ Hidden by default |
| **Code Editor** | ✅ Primary focus | ⚠️ Secondary (modal) |
| **Live Preview** | ✅ Side panel | ✅ Main view |
| **Terminal** | ✅ Integrated | ❌ Not visible |
| **Git Version Control** | ✅ Full featured | ⚠️ Auto-commits only |
| **Multi-file Editing** | ✅ Full support | ⚠️ AI handles behind scenes |
| **AI Chat** | ✅ Side panel | ✅ Primary interface |
| **Component Library** | ⚠️ Optional | ✅ Featured |
| **Templates** | ⚠️ Optional | ✅ Start here |
| **Keyboard Shortcuts** | ✅ Extensive | ⚠️ Basic only |
| **Deployment** | ✅ Manual config | ✅ One-click |
| **Domain Management** | ⚠️ External | ✅ Built-in |
| **Analytics** | ❌ External | ✅ Built-in |

Legend: ✅ Full support | ⚠️ Limited/Optional | ❌ Not available

---

## User Journey Examples

### Professional Editor Journey
1. **Sign up** → Create account
2. **Choose starter** → "Blank Project" or "Import from GitHub"
3. **Open editor** → See file explorer, code editor, preview
4. **Build with AI** → "Create a React component for user profile"
5. **Manage files** → Rename, move, organize files manually
6. **Use terminal** → Install packages, run build scripts
7. **Version control** → Commit, branch, merge
8. **Deploy** → Configure build settings, deploy to Netlify
9. **Maintain** → Edit code directly, use AI for assistance

**Time to First Deploy:** 30-60 minutes (for production app)

---

### Beginner Builder Journey
1. **Sign up** → Create account
2. **Choose template** → "Landing Page", "Portfolio", "Blog"
3. **See preview** → Template loads in full-screen preview
4. **Describe changes** → "Add a pricing section with 3 tiers"
5. **Review changes** → AI shows what changed (highlighted)
6. **Approve** → Click "Apply" or say "Yes, perfect"
7. **Add content** → "Use my logo" (upload), "Add my email"
8. **Publish** → Click "Publish" → Choose domain
9. **Share** → Get shareable link instantly

**Time to First Deploy:** 5-10 minutes (for landing page)

---

## Monetization Strategy

### Professional Editor (Developer Tier)
- **Free Tier:** Public projects, limited AI credits
- **Pro Tier ($19/month):** 
  - Private projects
  - Unlimited AI credits (with fair use)
  - Custom domains
  - Priority support
- **Team Tier ($49/month per team):**
  - Collaboration features
  - Team workspaces
  - Advanced version control

### Beginner Builder (Creator Tier)
- **Free Tier:** 1 published site, branded footer
- **Creator Tier ($9/month):**
  - 5 published sites
  - Remove branding
  - Custom domain
  - Basic analytics
- **Business Tier ($29/month):**
  - Unlimited sites
  - Advanced analytics
  - A/B testing
  - Priority AI model access
  - Custom code injection

### Cross-Tier Benefits
- Users can have both subscriptions
- Pro users get Creator features included
- Creator users can upgrade to Pro for advanced features

---

## Next Steps

### Immediate (Finish Professional Editor)
1. ✅ Complete remaining AI features (syntax highlighting, file creation)
2. ✅ Fix all persistence issues
3. ✅ Ensure project sync works flawlessly
4. Test with real users (beta program)
5. Polish UI/UX based on feedback

### Near-Term (Beginner Builder Design)
1. Create detailed mockups for Builder UI
2. User research with non-technical users
3. Design component library (20-30 components to start)
4. Prototype AI conversation flow
5. Test with non-programmer beta testers

### Long-Term (Feature Expansion)
1. Mobile app for both modes
2. Collaboration features (real-time editing)
3. Marketplace for templates and components
4. White-label option for agencies
5. Educational content and tutorials

---

## Success Criteria

### Professional Editor Success
- ✅ Developers choose it over Cursor for web projects
- ✅ Can build production apps without leaving the editor
- ✅ AI features save 30%+ development time
- ✅ 90%+ user satisfaction with AI assistance

### Beginner Builder Success
- ✅ Non-programmers build and deploy in < 15 minutes
- ✅ 80%+ of users never open code view
- ✅ AI understands 95%+ of natural language requests
- ✅ Users create professional-looking sites without design skills

### Platform Success
- ✅ Both modes share technology (no duplication)
- ✅ Users can switch modes seamlessly
- ✅ Beginner users graduate to Professional mode
- ✅ 30%+ conversion from free to paid tier

---

## Competitive Positioning

| Competitor | Mode | Our Advantage |
|-----------|------|---------------|
| **Cursor** | Professional | • Web-first focus<br>• Integrated deployment<br>• Live preview always visible |
| **VS Code** | Professional | • Built-in AI from day one<br>• No extension required<br>• Cloud-native |
| **Replit** | Beginner | • Better AI assistance<br>• No coding required<br>• Visual-first approach |
| **Lovable** | Beginner | • More control when needed<br>• Graduate to pro mode<br>• Full version control |
| **Webflow** | Visual Builder | • More flexible (code access)<br>• AI-powered<br>• Developer-friendly export |

## Unique Value Proposition

**"From idea to deployed website in minutes, with AI as your co-pilot. Start simple and grow into a full development environment."**

- **For Beginners:** The fastest way to build a website with AI
- **For Developers:** The most AI-integrated code editor for web development
- **For Everyone:** One platform that grows with you from beginner to expert
