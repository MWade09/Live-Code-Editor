# Sprint 2 Integration Strategy

**Date**: October 22, 2025  
**Status**: Ready for Implementation  
**Approach**: Enhance Existing Modules (NOT Build From Scratch)

---

## Executive Summary

After reviewing the existing editor architecture, we discovered that both Sprint 2 features already have **basic implementations**:
- **TerminalManager.js** - Command logging only (needs xterm.js + execution)
- **DeployManager.js** - Manual ZIP download only (needs API automation)

This changes our approach from **"build new"** to **"enhance existing"**, which will:
- ✅ Maintain existing module naming and structure
- ✅ Preserve backward compatibility
- ✅ Leverage existing API integration via ProjectSyncManager
- ✅ Keep existing UI elements and enhance them
- ✅ Accelerate implementation timeline

---

## Architecture Analysis

### Current Editor Architecture

```
app.js (Entry Point)
├── ProjectSyncManager (Central API Hub)
│   ├── authToken (from URL params)
│   ├── websiteAPI ('/api')
│   └── currentProject
├── FileManager (File Operations)
│   ├── files[] (all project files)
│   ├── createNewFile()
│   └── saveFile()
├── TerminalManager (BASIC - Command Logger)
│   ├── terminals Map (session storage)
│   ├── logToWebsite() (logs to API)
│   └── NO actual terminal emulator
├── DeployManager (BASIC - Manual Deployer)
│   ├── deployToNetlify() (creates ZIP)
│   └── NO API integration
└── 23 other specialized managers
```

### Integration Points

**ProjectSyncManager** (332 lines):
```javascript
// Provides to all managers:
- websiteAPI: '/api' (same-origin)
- authToken: string (from URL ?authToken=...)
- currentProject: { id, name, content, ... }
- loadWebsiteProject(projectId)
- sendTextEdit(fileId, textEdit)
```

**FileManager** (unknown size):
```javascript
// Provides to DeployManager:
- files: Array<{ name, content, language, ... }>
- addFile(name, content)
- createNewFile(name, content)
```

---

## Sprint 2 Enhancement Strategy

### 1. Terminal Enhancement (Days 1-5)

#### Current State: TerminalManager.js
```javascript
export class TerminalManager {
  constructor(projectSyncManager) {
    this.projectSync = projectSyncManager
    this.terminals = new Map() // Session storage
    this.activeTerminalId = null
    this.currentSessionId = null
    this.sessionCommands = []
    this.cwd = '/'
  }

  async createTerminal() {
    const id = `t_${Date.now()}_${Math.random()...}`
    this.terminals.set(id, { id, lines: [], cwd: '/', createdAt: Date.now() })
    return this.terminals.get(id)
  }

  async logToWebsite(command, cwd = '/', env = {}) {
    // POST /api/projects/${projectId}/terminal
    // Creates new session or appends to existing
    // Stores: sessionId, command, cwd, env, output
  }
}
```

**What Exists**:
- ✅ Session management (Map-based storage)
- ✅ API logging endpoints (POST/PUT /api/projects/:id/terminal)
- ✅ Session tracking (sessionId, command history)
- ✅ Integration with ProjectSyncManager

**What's Missing**:
- ❌ xterm.js terminal emulator UI
- ❌ WebSocket for real-time I/O
- ❌ Actual command execution (node-pty)
- ❌ Package manager detection (npm, yarn, pip)
- ❌ Multi-session tab support

#### Enhancement Plan

**Phase 1: Add xterm.js UI (Day 1)**
- Install packages: `xterm`, `@xterm/addon-fit`, `@xterm/addon-web-links`, `socket.io-client`
- Create React component: `website/src/components/terminal/Terminal.tsx`
- Add terminal panel to editor UI
- Basic rendering and input handling

**Phase 2: WebSocket Layer (Day 2)**
- Install backend: `socket.io`, `node-pty`
- Create API route: `website/src/app/api/terminal/route.ts`
- Connect Terminal.tsx to WebSocket
- Implement bidirectional communication

**Phase 3: Integrate with TerminalManager (Day 3)**
- Modify `TerminalManager.js` to handle WebSocket events
- Keep existing `logToWebsite()` for history
- Add `executeCommand(command)` method
- Connect session management to xterm.js tabs

**Phase 4: Command Execution (Day 4)**
- Add node-pty backend for shell access
- Detect package manager (npm/yarn/pip/pnpm)
- Test basic commands: ls, cd, npm install
- Implement command history (up/down arrows)

**Phase 5: Multi-Session Support (Day 5)**
- Create `TerminalPanel.tsx` with tabs
- Support multiple terminal instances
- Keyboard shortcuts (Ctrl+\`, Ctrl+Shift+\`)
- Session persistence across editor refreshes

**Final Structure**:
```javascript
// Enhanced TerminalManager.js
export class TerminalManager {
  constructor(projectSyncManager) {
    this.projectSync = projectSyncManager
    this.terminals = new Map()
    this.socket = null // NEW: WebSocket connection
    this.xtermInstances = new Map() // NEW: xterm.js instances
  }

  // KEEP existing methods
  async createTerminal() { /* existing code */ }
  async logToWebsite(command, cwd, env) { /* existing code */ }

  // NEW methods
  connectWebSocket() {
    this.socket = io('/terminal', {
      query: { projectId: this.projectSync.currentProject.id }
    })
    this.socket.on('output', (data) => this.handleOutput(data))
  }

  executeCommand(terminalId, command) {
    this.socket.emit('input', { terminalId, command })
    this.logToWebsite(command, this.terminals.get(terminalId).cwd)
  }
}
```

---

### 2. Deployment Enhancement (Days 6-10)

#### Current State: DeployManager.js
```javascript
export class DeployManager {
  constructor(fileManager) {
    this.fileManager = fileManager
    this.deployModal = document.getElementById('deployModal')
    this.deployStatus = document.getElementById('deploy-status')
  }

  async deployToNetlify() {
    // Create ZIP file
    const zip = new JSZip()
    this.fileManager.files.forEach(file => {
      zip.file(file.name, file.content)
    })

    // Generate index.html if missing
    if (!this.fileManager.files.some(f => f.name === 'index.html')) {
      zip.file('index.html', this.generateIndexHTML())
    }

    // Create blob and download link
    const content = await zip.generateAsync({ type: 'blob' })
    this.prepareNetlifyDeploy(content)
  }

  prepareNetlifyDeploy(zipBlob) {
    const zipUrl = URL.createObjectURL(zipBlob)
    // Shows manual Netlify Drop instructions
    // User must manually upload ZIP
  }
}
```

**What Exists**:
- ✅ ZIP file generation (JSZip)
- ✅ Auto-generate index.html if missing
- ✅ Deploy modal UI structure
- ✅ Status update methods
- ✅ Integration with FileManager

**What's Missing**:
- ❌ Netlify API integration (automated deployment)
- ❌ Vercel API integration
- ❌ Deployment status tracking (database)
- ❌ Build log viewing
- ❌ Environment variable management
- ❌ Deployment history

#### Enhancement Plan

**Phase 1: Database Setup (Day 6)**
- Create migration for `deployments` and `deployment_tokens` tables
- Add RLS policies for user isolation
- Generate TypeScript types
- Test CRUD operations

**Phase 2: Netlify API (Day 7)**
- Create `NetlifyClient` class in `website/src/lib/deployment/`
- Implement methods:
  - `deployFiles(siteId, files, envVars)`
  - `getDeploymentStatus(deploymentId)`
  - `getBuildLog(deploymentId)`
- Create API route: `/api/deployment/deploy`
- Test automated Netlify deployment

**Phase 3: Vercel API (Day 8)**
- Create `VercelClient` class
- Implement methods:
  - `deployProject(name, files, envVars)`
  - `getDeploymentStatus(deploymentId)`
  - `getBuildLog(deploymentId)`
- Add Vercel support to deploy API route
- Test both platforms side-by-side

**Phase 4: UI Enhancement (Day 9)**
- Enhance existing deploy modal
- Add platform selector (Netlify/Vercel/Manual)
- Add deployment status display (pending/building/success/failed)
- Add build log viewer (streaming updates)
- Add environment variable editor
- Test full deployment flow

**Phase 5: Polish & History (Day 10)**
- Add deployment history panel
- Implement rollback functionality
- Add deployment analytics
- Write E2E tests
- Fix bugs and edge cases

**Final Structure**:
```javascript
// Enhanced DeployManager.js
export class DeployManager {
  constructor(fileManager, projectSyncManager) { // ADD projectSyncManager
    this.fileManager = fileManager
    this.projectSync = projectSyncManager // NEW
    this.netlifyClient = null // NEW
    this.vercelClient = null // NEW
    this.activeDeployment = null // NEW
  }

  // KEEP existing methods as fallback
  async deployToNetlify() { /* existing manual ZIP download */ }

  // NEW automated methods
  async deployToNetlifyAPI(siteId, envVars = {}) {
    const files = this.fileManager.files.reduce((acc, file) => {
      acc[file.name] = file.content
      return acc
    }, {})

    const deployment = await this.netlifyClient.deployFiles({
      siteId,
      files,
      envVars
    })

    await this.saveDeploymentToDatabase(deployment)
    this.updateDeploymentStatus(deployment.id, 'building')
    return deployment
  }

  async deployToVercelAPI(projectName, envVars = {}) {
    const files = this.fileManager.files.map(file => ({
      file: file.name,
      data: Buffer.from(file.content).toString('base64')
    }))

    const deployment = await this.vercelClient.deployProject({
      name: projectName,
      files,
      envVars
    })

    await this.saveDeploymentToDatabase(deployment)
    return deployment
  }

  async saveDeploymentToDatabase(deployment) {
    const authToken = this.projectSync.authToken
    await fetch(`${this.projectSync.websiteAPI}/deployment/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        projectId: this.projectSync.currentProject.id,
        platform: deployment.platform,
        deployUrl: deployment.url,
        status: deployment.status,
        deploymentId: deployment.id
      })
    })
  }
}
```

---

## API Integration Points

### Terminal API Routes

**1. WebSocket Connection** (`/api/terminal`)
```typescript
// website/src/app/api/terminal/route.ts
import { Server } from 'socket.io'
import { spawn } from 'node-pty'

export function GET(request: Request) {
  const io = new Server(server)
  
  io.on('connection', (socket) => {
    const { projectId } = socket.handshake.query
    
    // Spawn shell for this session
    const shell = spawn('bash', [], {
      name: 'xterm-color',
      cwd: `/workspaces/${projectId}`,
      env: process.env
    })
    
    // Forward shell output to client
    shell.onData(data => socket.emit('output', data))
    
    // Forward client input to shell
    socket.on('input', (command) => shell.write(command))
  })
}
```

**2. Command History** (existing - enhance)
```typescript
// POST /api/projects/:id/terminal
// Already exists - keep for history logging
```

### Deployment API Routes

**1. Deploy Endpoint** (`/api/deployment/deploy`)
```typescript
// website/src/app/api/deployment/deploy/route.ts
import { NetlifyClient } from '@/lib/deployment/NetlifyClient'
import { VercelClient } from '@/lib/deployment/VercelClient'

export async function POST(request: Request) {
  const { projectId, platform, siteId, envVars } = await request.json()
  
  // Load project files
  const project = await getProject(projectId)
  
  let deployment
  if (platform === 'netlify') {
    const client = new NetlifyClient(userToken)
    deployment = await client.deployFiles({ siteId, files: project.files, envVars })
  } else if (platform === 'vercel') {
    const client = new VercelClient(userToken)
    deployment = await client.deployProject({ name: project.name, files: project.files, envVars })
  }
  
  // Save to database
  await supabase.from('deployments').insert({
    project_id: projectId,
    user_id: userId,
    platform,
    deploy_url: deployment.url,
    deployment_id: deployment.id,
    status: 'building'
  })
  
  return Response.json(deployment)
}
```

**2. Deployment Status** (`/api/deployment/:id/status`)
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const deployment = await supabase
    .from('deployments')
    .select('*')
    .eq('id', params.id)
    .single()
  
  // Poll external API for latest status
  if (deployment.platform === 'netlify') {
    const netlify = new NetlifyClient(userToken)
    const status = await netlify.getDeploymentStatus(deployment.deployment_id)
    
    // Update database
    if (status.state !== deployment.status) {
      await supabase.from('deployments').update({
        status: status.state,
        deploy_url: status.url
      }).eq('id', params.id)
    }
  }
  
  return Response.json(deployment)
}
```

**3. Build Logs** (`/api/deployment/:id/logs`)
```typescript
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const deployment = await supabase
    .from('deployments')
    .select('*')
    .eq('id', params.id)
    .single()
  
  let logs
  if (deployment.platform === 'netlify') {
    const netlify = new NetlifyClient(userToken)
    logs = await netlify.getBuildLog(deployment.deployment_id)
  } else if (deployment.platform === 'vercel') {
    const vercel = new VercelClient(userToken)
    logs = await vercel.getBuildLog(deployment.deployment_id)
  }
  
  return Response.json({ logs })
}
```

---

## Database Schema

### New Tables for Sprint 2

```sql
-- Deployment tracking
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('netlify', 'vercel', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'success', 'failed')),
  deploy_url TEXT,
  site_id TEXT, -- Netlify site ID or Vercel project ID
  deployment_id TEXT, -- External platform deployment ID
  build_log TEXT, -- Cached build log
  environment_vars JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_deployments_project ON deployments(project_id);
CREATE INDEX idx_deployments_user ON deployments(user_id);
CREATE INDEX idx_deployments_status ON deployments(status);

-- Deployment platform tokens (encrypted)
CREATE TABLE deployment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('netlify', 'vercel')),
  access_token TEXT NOT NULL, -- Encrypted at application level
  refresh_token TEXT, -- Encrypted at application level
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Terminal sessions (enhance existing if already exists)
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  commands JSONB DEFAULT '[]', -- Array of { command, cwd, output, timestamp }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_command_at TIMESTAMPTZ
);

CREATE INDEX idx_terminal_project ON terminal_sessions(project_id);
```

### Row Level Security

```sql
-- Deployments RLS
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deployments"
  ON deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deployments"
  ON deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deployments"
  ON deployments FOR UPDATE
  USING (auth.uid() = user_id);

-- Deployment tokens RLS
ALTER TABLE deployment_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON deployment_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Terminal sessions RLS
ALTER TABLE terminal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own terminal sessions"
  ON terminal_sessions FOR ALL
  USING (auth.uid() = user_id);
```

---

## Constructor Dependencies

### Current app.js Initialization (Estimated)

```javascript
// app.js
import { ProjectSyncManager } from './modules/ProjectSyncManager.js'
import { FileManager } from './modules/FileManager.js'
import { TerminalManager } from './modules/TerminalManager.js'
import { DeployManager } from './modules/DeployManager.js'
// ... other imports

// Initialize core managers
const projectSync = new ProjectSyncManager(fileManager)
const fileManager = new FileManager()
const terminalManager = new TerminalManager(projectSync)
const deployManager = new DeployManager(fileManager)

// TerminalManager needs ProjectSyncManager
// DeployManager needs FileManager AND ProjectSyncManager (UPDATE THIS)
```

### Updated Initialization

```javascript
// app.js
// ADD projectSync to DeployManager constructor
const deployManager = new DeployManager(fileManager, projectSync) // CHANGE THIS

// DeployManager.js constructor update:
constructor(fileManager, projectSyncManager) { // ADD second param
  this.fileManager = fileManager
  this.projectSync = projectSyncManager // NEW
  // ... rest of initialization
}
```

---

## Testing Strategy

### Terminal Tests

**E2E Tests** (`website/tests/e2e/terminal.spec.ts`):
```typescript
test('should open terminal panel', async ({ page }) => {
  await page.goto('/editor?project=test-project')
  await page.click('[data-testid="terminal-toggle"]')
  await expect(page.locator('.xterm')).toBeVisible()
})

test('should execute npm install', async ({ page }) => {
  await page.goto('/editor?project=test-project')
  await page.click('[data-testid="terminal-toggle"]')
  await page.type('.xterm textarea', 'npm install express\n')
  await expect(page.locator('.xterm')).toContainText('added 1 package')
})

test('should support multiple terminal tabs', async ({ page }) => {
  await page.goto('/editor?project=test-project')
  await page.click('[data-testid="terminal-toggle"]')
  await page.click('[data-testid="new-terminal"]')
  await expect(page.locator('[data-testid="terminal-tab"]')).toHaveCount(2)
})
```

### Deployment Tests

**E2E Tests** (`website/tests/e2e/deployment.spec.ts`):
```typescript
test('should deploy to Netlify', async ({ page }) => {
  await page.goto('/editor?project=test-project')
  await page.click('[data-testid="deploy-button"]')
  await page.selectOption('[data-testid="platform-select"]', 'netlify')
  await page.fill('[data-testid="site-id-input"]', 'test-site-id')
  await page.click('[data-testid="deploy-submit"]')
  
  await page.waitForSelector('[data-testid="deployment-status"]')
  await expect(page.locator('[data-testid="deployment-status"]')).toContainText('building')
})

test('should show deployment history', async ({ page }) => {
  await page.goto('/editor?project=test-project')
  await page.click('[data-testid="deployment-history"]')
  await expect(page.locator('[data-testid="deployment-item"]')).toHaveCount(3)
})
```

---

## Implementation Timeline

### Week 1: Terminal (Days 1-5)

**Day 1 (Oct 28)**: xterm.js Setup
- ✅ Install: xterm, @xterm/addon-fit, @xterm/addon-web-links, socket.io-client
- ✅ Create: Terminal.tsx component
- ✅ Basic rendering in editor
- ✅ Input/output display working

**Day 2 (Oct 29)**: WebSocket Layer
- ✅ Install: socket.io, node-pty (backend)
- ✅ Create: /api/terminal route
- ✅ WebSocket connection working
- ✅ Bidirectional communication

**Day 3 (Oct 30)**: TerminalManager Integration
- ✅ Modify TerminalManager.js
- ✅ Connect sessions to xterm.js
- ✅ Keep logToWebsite() working
- ✅ Test command history

**Day 4 (Oct 31)**: Command Execution
- ✅ node-pty shell spawning
- ✅ Package manager detection
- ✅ Test: npm install, yarn add, pip install
- ✅ Command history (up/down arrows)

**Day 5 (Nov 1)**: Multi-Session
- ✅ TerminalPanel.tsx with tabs
- ✅ Multiple terminal instances
- ✅ Keyboard shortcuts
- ✅ Session persistence

### Week 2: Deployment (Days 6-10)

**Day 6 (Nov 4)**: Database Setup
- ✅ Create: deployments, deployment_tokens tables
- ✅ Run migration in Supabase
- ✅ RLS policies
- ✅ TypeScript types

**Day 7 (Nov 5)**: Netlify Integration
- ✅ Create: NetlifyClient class
- ✅ deployFiles() method
- ✅ API route: /api/deployment/deploy
- ✅ Test: manual Netlify deployment

**Day 8 (Nov 6)**: Vercel Integration
- ✅ Create: VercelClient class
- ✅ deployProject() method
- ✅ Add to deploy API route
- ✅ Test: both platforms working

**Day 9 (Nov 7)**: UI Enhancement
- ✅ Enhance deploy modal
- ✅ Platform selector
- ✅ Status display
- ✅ Build log viewer
- ✅ Test: full flow

**Day 10 (Nov 8)**: Polish & Testing
- ✅ Environment variable editor
- ✅ Deployment history
- ✅ E2E tests for terminal
- ✅ E2E tests for deployment
- ✅ Bug fixes

---

## Success Criteria

### Terminal Feature (Must Have)
- ✅ Terminal panel opens/closes
- ✅ Can type and see input
- ✅ Commands execute in real shell
- ✅ Output displays in real-time
- ✅ npm/yarn/pip commands work
- ✅ Multiple terminal tabs work
- ✅ Command history (up/down arrows)
- ✅ Terminal persists across refreshes
- ✅ 3+ E2E tests passing

### Deployment Feature (Must Have)
- ✅ Deploy to Netlify via API
- ✅ Deploy to Vercel via API
- ✅ Manual ZIP download (backward compatible)
- ✅ Deployment status tracking
- ✅ Build log viewing
- ✅ Environment variables
- ✅ Deployment history
- ✅ Error handling
- ✅ 3+ E2E tests passing

### Nice to Have (Post-Sprint)
- ⏳ AI command suggestions
- ⏳ Terminal output parsing
- ⏳ Deployment rollback
- ⏳ Custom build configurations
- ⏳ Real-time build log streaming

---

## Risk Assessment

### Risk 1: xterm.js + Next.js SSR
**Probability**: High  
**Impact**: Medium  
**Mitigation**: Use dynamic imports with `{ ssr: false }`
```typescript
// Terminal.tsx
const Terminal = dynamic(() => import('./TerminalComponent'), { ssr: false })
```

### Risk 2: WebSocket Scaling
**Probability**: Medium  
**Impact**: Low (not immediate)  
**Mitigation**: Plan for Redis session storage in Sprint 3

### Risk 3: node-pty Security
**Probability**: Medium  
**Impact**: High  
**Mitigation**: 
- Whitelist safe commands
- Sandbox execution environment
- Command validation before execution

### Risk 4: API Rate Limits
**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:
- Implement cooldown (5 min between deploys)
- Show rate limit errors clearly
- Track last deployment time in database

---

## Backward Compatibility

### Terminal
- **Before**: No real terminal, just command logging
- **After**: Full terminal + command logging
- **Compatibility**: Existing `logToWebsite()` calls continue to work
- **Migration**: None needed (pure enhancement)

### Deployment
- **Before**: Manual ZIP download for Netlify Drop
- **After**: Automated API deployment + manual fallback
- **Compatibility**: Keep `deployToNetlify()` method as manual option
- **Migration**: None needed (add new methods, keep old)

---

## Next Steps

1. ✅ **Get user confirmation on this integration strategy**
2. ⏳ Create todo list for Sprint 2 implementation
3. ⏳ Begin Day 1: Terminal xterm.js setup

**Ready to proceed? Let me know and we'll start implementing! 🚀**
