# 🚀 Deployment System Implementation Plan

**Created**: October 22, 2025  
**Sprint**: Sprint 2 (Oct 28 - Nov 10)  
**Priority**: HIGH  
**Estimated Time**: 1 week

---

## 📋 Overview

Implement one-click deployment system supporting **Netlify** and **Vercel**, enabling users to deploy their projects directly from the Live Code Editor with minimal configuration.

---

## 🎯 Goals

### Primary Goals
1. One-click deployment to Netlify
2. One-click deployment to Vercel
3. Deployment status tracking
4. Environment variable management
5. Build log viewing

### Secondary Goals
1. Automatic domain assignment
2. Deployment history
3. Rollback to previous deployments
4. Preview deployments
5. Custom domain configuration

---

## 🏗️ Architecture

### Technology Stack

**Platforms**:
- **Netlify** - Primary deployment target
- **Vercel** - Secondary deployment target

**APIs**:
- Netlify API (REST)
- Vercel API (REST)
- Deploy hooks for automated builds

**Storage**:
- Supabase database for deployment records
- User tokens encrypted in database

### Data Model

**Database Table**: `deployments`
```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('netlify', 'vercel')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'success', 'failed')),
  deploy_url TEXT,
  site_id TEXT,
  deployment_id TEXT,
  build_log TEXT,
  environment_vars JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_deployments_project ON deployments(project_id);
CREATE INDEX idx_deployments_user ON deployments(user_id);
CREATE INDEX idx_deployments_status ON deployments(status);
```

**Database Table**: `deployment_tokens`
```sql
CREATE TABLE deployment_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('netlify', 'vercel')),
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

### Component Structure

```
website/src/
├── components/
│   └── deployment/
│       ├── DeployButton.tsx          # Main deploy button
│       ├── DeployModal.tsx           # Deployment configuration
│       ├── DeploymentStatus.tsx      # Status indicator
│       ├── DeploymentHistory.tsx     # Past deployments
│       ├── PlatformSelector.tsx      # Netlify/Vercel choice
│       └── EnvironmentVars.tsx       # Env var editor
├── hooks/
│   ├── useDeployment.ts              # Deployment state
│   └── useDeploymentStatus.ts        # Poll deployment status
├── lib/
│   └── deployment/
│       ├── netlify-client.ts         # Netlify API wrapper
│       ├── vercel-client.ts          # Vercel API wrapper
│       ├── deployment-helpers.ts     # Shared utilities
│       └── file-bundler.ts           # Bundle project files
└── app/
    └── api/
        └── deployment/
            ├── deploy/route.ts       # Initiate deployment
            ├── status/[id]/route.ts  # Check deploy status
            ├── tokens/route.ts       # Store/retrieve tokens
            └── logs/[id]/route.ts    # Get build logs
```

---

## 🔧 Implementation Steps

### Phase 1: Netlify Integration (Days 1-3)

#### Step 1.1: Netlify API Client
**File**: `website/src/lib/deployment/netlify-client.ts`

```typescript
import axios from 'axios'

export interface NetlifyDeployOptions {
  siteId?: string
  files: { [path: string]: string } // file path -> content
  envVars?: { [key: string]: string }
}

export interface NetlifyDeployResponse {
  id: string
  site_id: string
  deploy_url: string
  admin_url: string
  state: 'uploading' | 'processing' | 'ready' | 'error'
}

export class NetlifyClient {
  private accessToken: string
  private apiUrl = 'https://api.netlify.com/api/v1'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async createSite(siteName: string): Promise<{ site_id: string }> {
    const response = await axios.post(
      `${this.apiUrl}/sites`,
      {
        name: siteName,
        custom_domain: null
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return { site_id: response.data.id }
  }

  async deployFiles(options: NetlifyDeployOptions): Promise<NetlifyDeployResponse> {
    const { siteId, files, envVars } = options

    // Create a zip file of the project
    const fileMap: { [key: string]: { content: string } } = {}
    for (const [path, content] of Object.entries(files)) {
      fileMap[path] = { content }
    }

    // Deploy using Netlify's deploy API
    const response = await axios.post(
      `${this.apiUrl}/sites/${siteId}/deploys`,
      {
        files: fileMap,
        functions: {},
        environment: envVars || {}
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      id: response.data.id,
      site_id: response.data.site_id,
      deploy_url: response.data.deploy_ssl_url,
      admin_url: response.data.admin_url,
      state: response.data.state
    }
  }

  async getDeploymentStatus(siteId: string, deployId: string): Promise<NetlifyDeployResponse> {
    const response = await axios.get(
      `${this.apiUrl}/sites/${siteId}/deploys/${deployId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    )

    return {
      id: response.data.id,
      site_id: response.data.site_id,
      deploy_url: response.data.deploy_ssl_url,
      admin_url: response.data.admin_url,
      state: response.data.state
    }
  }

  async getBuildLog(siteId: string, deployId: string): Promise<string> {
    const response = await axios.get(
      `${this.apiUrl}/deploys/${deployId}/log`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    )

    return response.data
  }
}
```

#### Step 1.2: Netlify Deploy API Route
**File**: `website/src/app/api/deployment/deploy/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NetlifyClient } from '@/lib/deployment/netlify-client'
import { VercelClient } from '@/lib/deployment/vercel-client'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, platform, envVars } = await req.json()

    // Get project files
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get deployment token
    const { data: tokenData } = await supabase
      .from('deployment_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (!tokenData) {
      return NextResponse.json({ error: 'No deployment token found' }, { status: 400 })
    }

    // Parse project files
    const files: { [key: string]: string } = {}
    
    if (Array.isArray(project.content)) {
      // Multi-file project
      for (const file of project.content) {
        files[file.path] = file.content
      }
    } else {
      // Legacy single-file project
      files['index.html'] = project.content
    }

    // Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from('deployments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        platform,
        status: 'pending',
        environment_vars: envVars || {}
      })
      .select()
      .single()

    if (deployError) {
      return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 })
    }

    // Deploy based on platform
    let deployResult
    
    if (platform === 'netlify') {
      const client = new NetlifyClient(tokenData.access_token)
      
      // Create site if needed
      let siteId = project.netlify_site_id
      if (!siteId) {
        const site = await client.createSite(project.title.toLowerCase().replace(/\s+/g, '-'))
        siteId = site.site_id
        
        // Save site ID
        await supabase
          .from('projects')
          .update({ netlify_site_id: siteId })
          .eq('id', projectId)
      }
      
      // Deploy
      deployResult = await client.deployFiles({
        siteId,
        files,
        envVars
      })

      // Update deployment record
      await supabase
        .from('deployments')
        .update({
          status: 'building',
          site_id: deployResult.site_id,
          deployment_id: deployResult.id,
          deploy_url: deployResult.deploy_url
        })
        .eq('id', deployment.id)

    } else if (platform === 'vercel') {
      const client = new VercelClient(tokenData.access_token)
      
      deployResult = await client.deployProject({
        name: project.title.toLowerCase().replace(/\s+/g, '-'),
        files,
        envVars
      })

      await supabase
        .from('deployments')
        .update({
          status: 'building',
          deployment_id: deployResult.id,
          deploy_url: deployResult.url
        })
        .eq('id', deployment.id)
    }

    return NextResponse.json({
      deploymentId: deployment.id,
      status: 'building',
      url: deployResult.deploy_url
    })

  } catch (error) {
    console.error('Deployment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    )
  }
}
```

---

### Phase 2: Vercel Integration (Days 4-5)

#### Step 2.1: Vercel API Client
**File**: `website/src/lib/deployment/vercel-client.ts`

```typescript
import axios from 'axios'

export interface VercelDeployOptions {
  name: string
  files: { [path: string]: string }
  envVars?: { [key: string]: string }
}

export interface VercelDeployResponse {
  id: string
  url: string
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR'
}

export class VercelClient {
  private accessToken: string
  private apiUrl = 'https://api.vercel.com'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async deployProject(options: VercelDeployOptions): Promise<VercelDeployResponse> {
    const { name, files, envVars } = options

    // Convert files to Vercel format
    const vercelFiles = Object.entries(files).map(([path, content]) => ({
      file: path,
      data: Buffer.from(content).toString('base64')
    }))

    const response = await axios.post(
      `${this.apiUrl}/v13/deployments`,
      {
        name,
        files: vercelFiles,
        projectSettings: {
          framework: null
        },
        target: 'production'
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      id: response.data.id,
      url: `https://${response.data.url}`,
      readyState: response.data.readyState
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<VercelDeployResponse> {
    const response = await axios.get(
      `${this.apiUrl}/v13/deployments/${deploymentId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    )

    return {
      id: response.data.id,
      url: `https://${response.data.url}`,
      readyState: response.data.readyState
    }
  }
}
```

---

### Phase 3: UI Components (Days 6-7)

#### Step 3.1: Deploy Button Component
**File**: `website/src/components/deployment/DeployButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Rocket, Loader2 } from 'lucide-react'
import { DeployModal } from './DeployModal'

interface DeployButtonProps {
  projectId: string
  onDeploySuccess?: (url: string) => void
}

export function DeployButton({ projectId, onDeploySuccess }: DeployButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [deploying, setDeploying] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={deploying}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-500 hover:to-blue-500 transition-all disabled:opacity-50"
      >
        {deploying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            Deploy
          </>
        )}
      </button>

      {showModal && (
        <DeployModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onDeployStart={() => setDeploying(true)}
          onDeployComplete={(url) => {
            setDeploying(false)
            setShowModal(false)
            onDeploySuccess?.(url)
          }}
        />
      )}
    </>
  )
}
```

#### Step 3.2: Deploy Modal Component
**File**: `website/src/components/deployment/DeployModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { PlatformSelector } from './PlatformSelector'
import { EnvironmentVars } from './EnvironmentVars'

interface DeployModalProps {
  projectId: string
  onClose: () => void
  onDeployStart: () => void
  onDeployComplete: (url: string) => void
}

export function DeployModal({ projectId, onClose, onDeployStart, onDeployComplete }: DeployModalProps) {
  const [platform, setPlatform] = useState<'netlify' | 'vercel'>('netlify')
  const [envVars, setEnvVars] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState<string | null>(null)

  const handleDeploy = async () => {
    try {
      setError(null)
      onDeployStart()

      const response = await fetch('/api/deployment/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          platform,
          envVars
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Deployment failed')
      }

      const data = await response.json()
      onDeployComplete(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed')
      onDeployStart() // Reset state
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Deploy Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded">
              {error}
            </div>
          )}

          <PlatformSelector selected={platform} onSelect={setPlatform} />

          <EnvironmentVars vars={envVars} onChange={setEnvVars} />

          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded">
            <h3 className="text-white font-medium mb-2">Deployment Info</h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Your project will be deployed to {platform === 'netlify' ? 'Netlify' : 'Vercel'}</li>
              <li>• A unique URL will be generated</li>
              <li>• You can update deployments anytime</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeploy}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-500 hover:to-blue-500 transition-all"
          >
            Deploy Now
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔒 Security Considerations

### Token Management
- Encrypt tokens in database using AES-256
- Never expose tokens in client-side code
- Implement token refresh mechanism
- Allow users to revoke tokens

### Rate Limiting
- Limit deployments per user (10 per day)
- Implement cooldown period (5 minutes between deployments)
- Track deployment quotas

### Validation
- Validate project ownership before deployment
- Check file size limits (100MB max)
- Sanitize file names and paths

---

## 🧪 Testing Strategy

### Unit Tests
- Netlify client methods
- Vercel client methods
- File bundling logic

### Integration Tests
- API route responses
- Database operations
- Token encryption/decryption

### E2E Tests
- Complete deployment flow
- Status polling
- Error handling

---

## 📊 Success Metrics

### Must-Have (Launch Blockers)
- ✅ Deploy to Netlify works
- ✅ Deploy to Vercel works
- ✅ Deployment status tracking
- ✅ Build logs accessible
- ✅ Environment variables support

### Nice-to-Have (Post-Launch)
- Automatic domain assignment
- Deployment history
- Rollback functionality
- Preview deployments
- Custom domain configuration

---

**Next Steps**: Begin implementation on Oct 28, 2025
