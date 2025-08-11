# 🔍 Website ↔ Editor Integration Strategy

## 📋 Table of Contents
- [Current State Assessment](#current-state-assessment)
- [Phase 3: Project Management & Workflow](#phase-3-project-management--workflow)
- [Phase 4: Advanced Features & Polish](#phase-4-advanced-features--polish)
- [Implementation Roadmap](#implementation-roadmap)
- [Key Integration Points](#key-integration-points)
- [Required Changes Summary](#required-changes-summary)

---

## ✅ Current State Assessment

### 🖥️ Editor Side
- ✅ Modular architecture with FileManager, Editor, AI systems
- ✅ Community button linking to website
- ✅ File management and project structure capabilities
- ✅ AI-powered code features (inline suggestions, code actions)

### 🌐 Website Side
- ✅ Complete user authentication and profile system
- ✅ Project storage with JSON content format
- ✅ Community features (likes, views, comments, sharing)
- ✅ Database schema supporting project management
- ✅ Templates, import, and sharing workflows

---

## 🎯 Phase 3 & 4 Integration Strategy

### 👤 Guest Trial Mode (No-Auth Editor Access)

**Goals (today):**
- Allow anonymous users to try the editor at `/editor/try` without login
- Show a guest banner: limited features, no persistence
- Enforce a small free AI cap when no OpenRouter key is configured (e.g., 10 requests per session)
- Smooth upgrade path: “Save Project” prompts login; after auth, create a project and open `/editor?project=<id>`

**Website changes:**
- Middleware allowlist for `/editor` and `/editor/try`
- Header CTA: “Try the Editor” → `/editor/try`
- Add `/editor/try` page: embeds/bridges to the editor with guest banner

**Editor changes:**
- Guest mode banner and CTA to sign up or add API key
- Local AI request cap when no OpenRouter key in `localStorage`

**Acceptance criteria (Milestone 1):**
- Guests can load `/editor/try` without redirect
- Visible guest banner with upgrade CTA
- AI calls capped locally for guests without API key; friendly prompt when exceeded
- Authenticated users can open `/editor?project=<id>` without being bounced to login

**Middleware snippet (allowlist example):**
```ts
// website/middleware.ts (conceptual)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// In updateSession: add allowlist for guest editor
// if (!user && (pathname === '/editor' || pathname === '/editor/try')) allow
```

## 📂 PHASE 3: Project Management & Workflow

### � Project Structure Integration

**Current Opportunity:**
- Website has robust project storage but editor operates independently
- Need bidirectional sync between editor and website project system

**Integration Plan:**

```javascript
// New module: ProjectSyncManager.js
class ProjectSyncManager {
  constructor() {
    this.websiteAPI = 'https://liveeditorcode.netlify.app/api'
    this.currentProject = null
    this.syncEnabled = false
  }

  // Link editor to website project
  async loadWebsiteProject(projectId) {
    const response = await fetch(`${this.websiteAPI}/projects/${projectId}`)
    const project = await response.json()
    
    // Load project files into editor
    await this.fileManager.loadProjectStructure(project.content)
    this.currentProject = project
    this.syncEnabled = true
  }

  // Save editor state to website
  async saveToWebsite() {
    if (!this.currentProject) return
    
    const projectStructure = this.fileManager.exportProjectStructure()
    await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, {
      method: 'PUT',
      body: JSON.stringify({ content: projectStructure })
    })
  }
}
```

#### Website API Endpoints for Project Sync

```ts
// Next.js route handlers (conceptual)
// GET /api/projects/[id] → returns project with ownership/visibility checks
// PUT /api/projects/[id] → updates project.content (requires owner)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // 1) get user (optional), 2) fetch project, 3) if private and not owner → 403, 4) return content/metadata
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // 1) require user, 2) verify owner, 3) update content/updated_at/status, 4) return updated row
}
```

### 🔄 Version Control Integration

**Phase 3 Requirements from TODO:**
- Git status in file explorer
- Basic git operations (commit, push, pull)
- Diff viewer for changed files
- Branch management

**Integration Strategy:**
1. **Website Enhancement:** Add Git metadata to project schema
2. **Editor Enhancement:** New GitManager.js module
3. **Bidirectional Sync:** Git changes reflected on both platforms

```sql
-- Add to existing projects table
ALTER TABLE projects ADD COLUMN git_url TEXT;
ALTER TABLE projects ADD COLUMN current_branch TEXT DEFAULT 'main';
ALTER TABLE projects ADD COLUMN git_metadata JSONB DEFAULT '{}';

-- New table for commit history
CREATE TABLE project_commits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  message TEXT NOT NULL,
  author_id UUID REFERENCES user_profiles(id),
  files_changed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ⚡ Build & Run System

**Integration Approach:**
- **Editor:** TaskRunner module for local builds
- **Website:** Store build configurations and deployment settings
- **Shared:** Build status and deployment URLs

---

## 🚀 PHASE 4: Advanced Features & Polish

### 💻 Terminal Integration

**Current TODO Requirements:**
- Terminal panel that can be toggled
- Multiple terminal instances
- Terminal commands from AI
- Package installation via terminal

**Seamless Integration Plan:**

#### 1. Editor Terminal Module:

```javascript
// New module: TerminalManager.js
class TerminalManager {
  constructor() {
    this.terminals = new Map()
    this.activeTerminal = null
    this.websiteSync = new ProjectSyncManager()
  }

  // Create terminal connected to website project
  async createProjectTerminal(projectId) {
    const terminal = new Terminal()
    terminal.projectId = projectId
    
    // Set working directory to project
    await this.websiteSync.loadWebsiteProject(projectId)
    terminal.workingDirectory = `/projects/${projectId}`
    
    return terminal
  }

  // AI can execute terminal commands
  async executeAICommand(command, context) {
    const terminal = this.getActiveTerminal()
    
    // Log command to website for project history
    await this.websiteSync.logTerminalCommand(command, context)
    
    return await terminal.execute(command)
  }
}
```

#### 2. Website Terminal History:

```sql
-- New table for terminal session tracking
CREATE TABLE terminal_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  commands JSONB[] DEFAULT '{}',
  working_directory TEXT,
  environment_vars JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🔧 Developer Tools Integration

**Debugging Support:**
- **Editor:** DebugManager.js with breakpoint support
- **Website:** Store debugging sessions and configurations
- **Shared:** Debug logs and performance metrics

**Performance & Monitoring:**
- **Editor:** Bundle analysis and metrics collection
- **Website:** Project performance dashboard
- **Shared:** Optimization suggestions and tracking

---

## 🚀 Implementation Roadmap

### 📅 Week 0-1: Guest Access Foundation
1. Allowlist `/editor` and `/editor/try` in middleware
2. Add header CTA “Try the Editor” → `/editor/try`
3. Add guest banner + local AI cap (when no OpenRouter key)
4. Ensure `/editor?project=<id>` works for signed-in users

### 📅 Week 1-2: Foundation
1. **Create ProjectSyncManager.js** in editor
2. **Add API endpoints** on website for project sync
3. **Implement bidirectional file sync** between platforms
4. **Add Git metadata** to database schema

### 📅 Week 3-4: Version Control
1. **Create GitManager.js** in editor
2. **Add Git UI components** to file explorer
3. **Implement commit history** on website
4. **Add diff viewer** to both platforms

### 📅 Week 5-6: Terminal Integration
1. **Create TerminalManager.js** in editor
2. **Add terminal session tracking** to website
3. **Implement AI terminal commands**
4. **Add package.json management**

### 📅 Week 7-8: Advanced Features
1. **Add debugging support** to editor
2. **Create performance dashboard** on website
3. **Implement build system** integration
4. **Add developer tools** and monitoring

---

## 🔗 Key Integration Points

### 1. Authentication Bridge

```javascript
// Editor authentication with website
class AuthManager {
  async loginToWebsite() {
    // OAuth flow or JWT token sharing
    const token = await this.getWebsiteToken()
    this.websiteAPI.setAuthToken(token)
    this.syncManager.enableSync()
  }
}
```

### 2. Real-time Synchronization

```javascript
// WebSocket connection for live updates
class RealtimeSync {
  constructor() {
    this.ws = new WebSocket('wss://liveeditorcode.netlify.app/sync')
    this.setupEventHandlers()
  }

  // Editor changes broadcast to website
  onFileChange(file) {
    this.ws.send(JSON.stringify({
      type: 'file_change',
      projectId: this.currentProject.id,
      file: file
    }))
  }
}
```

### 3. AI Integration Across Platforms

```javascript
// AI context includes both editor and website data
class UnifiedAIManager {
  async getContext() {
    return {
      editorFiles: this.fileManager.getAllFiles(),
      projectMetadata: await this.websiteAPI.getProject(),
      gitStatus: await this.gitManager.getStatus(),
      terminalHistory: await this.websiteAPI.getTerminalHistory()
    }
  }
}
```

### 4. AI Proxy & Usage Tracking (Later)

```sql
-- Track anonymous guest quotas (cookie-based id)
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cookie_id TEXT UNIQUE NOT NULL,
  requests_used INT DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track authenticated usage per day
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  requests_used INT DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  PRIMARY KEY (user_id, period)
);
```

```ts
// Conceptual API: POST /api/ai/proxy
// - For guests: enforce small daily cap via guest_sessions
// - For users: attribute usage to ai_usage and apply plan limits/markup
```

---

## 📋 Required Changes Summary

### 🖥️ Editor Enhancements
- [ ] Add ProjectSyncManager.js for website integration
- [ ] Create GitManager.js for version control
- [ ] Implement TerminalManager.js for terminal features
- [ ] Add AuthManager.js for website authentication
- [ ] Create RealtimeSync.js for live updates
 - [ ] Guest mode banner + local AI cap when no OpenRouter key

### 🌐 Website Enhancements
 - [X] Allowlist `/editor` and `/editor/try` in middleware
 - [X] Add header CTA “Try the Editor” → `/editor/try`
- [X] Add project sync API endpoints
- [ ] Extend database schema for Git and terminal data
- [ ] Create real-time WebSocket server
- [ ] Add project build/deployment configuration
- [ ] Implement terminal session management
 - [ ] (Later) AI proxy endpoint + quota tables for guests/users

### 🔧 Shared Infrastructure
- [ ] WebSocket server for real-time sync
- [ ] API authentication system
- [ ] File synchronization protocols
- [ ] Build and deployment pipelines

---

## 🎯 Next Steps

This integration strategy provides a comprehensive roadmap for seamlessly connecting the editor and website platforms. The implementation should be done incrementally, starting with the foundation (ProjectSyncManager) and building up to more advanced features like real-time synchronization and terminal integration.

**Priority Order:**
0. 👤 Guest trial access (no-auth editor with limits)
1. 🔐 Authentication bridge between platforms
2. 📁 Project synchronization system
3. 🔄 Version control integration
4. 💻 Terminal and build system integration
5. 🚀 Real-time collaboration features