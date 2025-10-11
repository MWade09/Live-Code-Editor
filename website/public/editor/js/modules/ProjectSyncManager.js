export class ProjectSyncManager {
  constructor(fileManager) {
    this.fileManager = fileManager
    // Since editor is now served from the same domain, use relative /api path
    // This works for both local dev and production
    this.websiteAPI = '/api'
    console.log('[ProjectSync] Using same-origin API:', this.websiteAPI)
    
    try {
      const params = new URLSearchParams(window.location.search)
      // Capture optional auth token for private project access
      const token = params.get('token')
      this.authToken = token || ''
      if (this.authToken) {
        console.log('[ProjectSync] auth token present for private access')
      }
      // Sanitize URL to drop sensitive params (token)
      if (params.has('token')) {
        params.delete('token')
        const sanitized = `${location.pathname}?${params.toString()}`
        try { history.replaceState(null, '', sanitized) } catch {}
      }
    } catch {
      this.authToken = ''
    }
    this.currentProject = null
    this.syncEnabled = false
    this.errorLog = [] // recent errors
    this.pendingQueue = [] // queued payloads when offline
    this.retryTimer = null
    this._emitQueueChanged()
    try {
      window.addEventListener('online', () => this.flushQueue())
    } catch {}
  }

  async loadWebsiteProject(projectId) {
    if (!projectId) return
    
    // Use same-origin API endpoint
    const url = `/api/projects/${projectId}`
    console.log('[ProjectSync] Loading project from:', url)
    
    // Optional bearer token for private projects
    const authHeader = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}

    let project = null;  // ✅ Declare outside try block
    
    try {
      const res = await fetch(url, { headers: { ...authHeader } })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      project = await res.json()
      
      console.log('[ProjectSync] Loaded project:', project.title, 'Content type:', typeof project.content)
      
      // Clear current files and tabs so we don't show local leftovers
      this.fileManager.files = []
      this.fileManager.openTabs = []
      this.fileManager.activeTabIndex = -1
      
      // Handle different content formats:
      // 1. JSONB object with files array (new multi-file format)
      // 2. String content (legacy single-file format)
      
      if (project.content && typeof project.content === 'object' && Array.isArray(project.content.files)) {
        // NEW FORMAT: Multi-file project
        console.log('[ProjectSync] Loading multi-file project with', project.content.files.length, 'files')
        
        project.content.files.forEach(fileData => {
          this.fileManager.addFile(
            fileData.name || 'untitled.html',
            fileData.content || ''
          );
        });
        
        // Open the first file or the one marked as "main"
        const mainFile = project.content.files.find(f => f.isMain) || project.content.files[0];
        if (mainFile && this.fileManager.files.length > 0) {
          const fileToOpen = this.fileManager.files.find(f => f.name === mainFile.name);
          if (fileToOpen) {
            this.fileManager.openFileInTab(fileToOpen.id);
          }
        }
      } else {
        // LEGACY FORMAT: Single file as string
        console.log('[ProjectSync] Loading legacy single-file project')
        
        const content = typeof project.content === 'string' ? project.content : ''
        const filename = project.title?.trim() ? `${project.title}.html` : 'index.html'
        
        const newFile = this.fileManager.createNewFile(filename, content)
        this.fileManager.openFileInTab(newFile.id)
      }
      
      console.log('[ProjectSync] Project loaded successfully. Total files:', this.fileManager.files.length)
      
    } catch (e) {
      console.error('[ProjectSync] Failed to load project:', e)
      throw e; // Re-throw so caller knows it failed
    }

    this.currentProject = project
    this.projectId = projectId  // ✅ Store project ID for later use
    this.syncEnabled = true
    return project
  }

  exportProjectContent() {
    // Export ALL files in the new multi-file format
    const files = this.fileManager.files.map(file => ({
      id: file.id,
      name: file.name,
      content: file.content,
      type: file.type,
      isMain: file.id === this.fileManager.openTabs[0] // First open tab is considered "main"
    }));
    
    console.log('[ProjectSync] Exporting', files.length, 'files:', files.map(f => f.name).join(', '))
    
    return {
      files: files,
      version: '2.0', // Mark as new multi-file format
      lastModified: new Date().toISOString()
    };
  }

  async saveToWebsite() {
    if (!this.currentProject) return { ok: false, error: 'No project' }
    const content = this.exportProjectContent()
    const headers = { 'Content-Type': 'application/json' }
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.queueSave({ content, ts: Date.now() })
      this.pushError('Offline: queued save')
      return { ok: false, queued: true, error: 'Offline' }
    }

    // Best-effort conflict check: pull server updated_at first
    try {
      const latest = await this.fetchLatestMeta()
      if (latest && this.currentProject.updated_at && latest.updated_at && latest.updated_at !== this.currentProject.updated_at) {
        return { ok: false, conflict: true, serverUpdatedAt: latest.updated_at, serverContent: latest.content }
      }
    } catch {}

    try {
      const res = await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content })
      })
      if (!res.ok) {
        const text = await res.text()
        this.pushError(`Save failed: ${text || res.status}`)
        return { ok: false, error: text }
      }
      const updated = await res.json()
      this.currentProject.updated_at = updated.updated_at
      // Post a lightweight save record (best-effort)
      try {
        if (this.authToken) {
          await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}/saves`, {
            method: 'POST', headers, body: JSON.stringify({ change_summary: 'Content updated' })
          })
        }
      } catch {}
      return { ok: true }
    } catch (e) {
      this.queueSave({ content, ts: Date.now() })
      this.pushError(`Network error: queued save`)
      return { ok: false, queued: true, error: String(e) }
    }
  }

  async overwriteSave() {
    if (!this.currentProject) return { ok: false, error: 'No project' }
    const content = this.exportProjectContent()
    const headers = { 'Content-Type': 'application/json' }
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`
    try {
      const res = await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, {
        method: 'PUT', headers, body: JSON.stringify({ content })
      })
      if (!res.ok) {
        const text = await res.text()
        this.pushError(`Overwrite failed: ${text || res.status}`)
        return { ok: false, error: text }
      }
      const updated = await res.json()
      this.currentProject.updated_at = updated.updated_at
      return { ok: true }
    } catch (e) {
      this.pushError('Network error on overwrite')
      return { ok: false, error: String(e) }
    }
  }

  async pullLatest() {
    const latest = await this.fetchLatestMeta(true)
    if (!latest) throw new Error('Failed to fetch latest')
    
    try {
      console.log('[ProjectSync] Pulling latest content. Type:', typeof latest.content)
      
      // Handle multi-file format
      if (latest.content && typeof latest.content === 'object' && Array.isArray(latest.content.files)) {
        console.log('[ProjectSync] Pulling', latest.content.files.length, 'files from server')
        
        // Clear all current files
        this.fileManager.files = []
        this.fileManager.openTabs = []
        this.fileManager.activeTabIndex = -1
        
        // Load all files from server
        latest.content.files.forEach(fileData => {
          this.fileManager.addFile(
            fileData.name || 'untitled.html',
            fileData.content || ''
          );
        });
        
        // Open the first file or main file
        const mainFile = latest.content.files.find(f => f.isMain) || latest.content.files[0];
        if (mainFile && this.fileManager.files.length > 0) {
          const fileToOpen = this.fileManager.files.find(f => f.name === mainFile.name);
          if (fileToOpen) {
            this.fileManager.openFileInTab(fileToOpen.id);
          }
        }
      } else {
        // Legacy single-file format
        console.log('[ProjectSync] Pulling single file from server (legacy format)')
        
        const current = this.fileManager.getCurrentFile()
        const filename = current?.name || (this.currentProject?.title?.trim() ? `${this.currentProject.title}.html` : 'index.html')
        
        // Replace current file content
        if (current) {
          current.content = typeof latest.content === 'string' ? latest.content : ''
        } else {
          const newFile = this.fileManager.createNewFile(filename, typeof latest.content === 'string' ? latest.content : '')
          this.fileManager.openFileInTab(newFile.id)
        }
      }
      
      // Clear dirty states across tabs
      if (this.fileManager.clearAllDirty) this.fileManager.clearAllDirty()
      this.currentProject.updated_at = latest.updated_at
      return { ok: true }
    } catch (e) {
      this.pushError('Failed to apply latest content')
      return { ok: false, error: String(e) }
    }
  }

  async fetchLatestMeta(includeContent = false) {
    if (!this.currentProject) return null
    const headers = {}
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`
    const res = await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, { headers })
    if (!res.ok) return null
    const data = await res.json()
    return includeContent ? data : { updated_at: data.updated_at }
  }

  queueSave(entry) {
    this.pendingQueue.push(entry)
    this.scheduleRetry()
    this._emitQueueChanged()
  }

  scheduleRetry() {
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.flushQueue()
    }, 3000)
  }

  async flushQueue() {
    if (!this.pendingQueue.length) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    const next = this.pendingQueue.shift()
    const headers = { 'Content-Type': 'application/json' }
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`
    try {
      const res = await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, {
        method: 'PUT', headers, body: JSON.stringify({ content: next.content })
      })
      if (!res.ok) {
        this.pushError(`Retry failed: ${res.status}`)
        // Requeue tail and increase backoff
        this.pendingQueue.push(next)
        this.retryTimer = setTimeout(() => { this.retryTimer = null; this.flushQueue() }, 5000)
        this._emitQueueChanged()
        return
      }
      const updated = await res.json()
      this.currentProject.updated_at = updated.updated_at
      // Continue flushing
      this._emitQueueChanged()
      if (this.pendingQueue.length) this.flushQueue()
    } catch {
      this.pushError('Network error during retry')
      this.pendingQueue.push(next)
      this.retryTimer = setTimeout(() => { this.retryTimer = null; this.flushQueue() }, 7000)
      this._emitQueueChanged()
    }
  }

  pushError(message) {
    try {
      this.errorLog.unshift({ message, ts: Date.now() })
      this.errorLog = this.errorLog.slice(0, 5)
      document.dispatchEvent(new CustomEvent('projectSyncError', { detail: { message } }))
    } catch {}
  }

  _emitQueueChanged() {
    try {
      const count = this.pendingQueue.length
      document.dispatchEvent(new CustomEvent('projectSyncQueueChanged', { detail: { count } }))
    } catch {}
  }
}


