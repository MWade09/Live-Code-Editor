export class ProjectSyncManager {
  constructor(fileManager) {
    this.fileManager = fileManager
    // Determine website API base from URL param if present (site=https://domain)
    try {
      const params = new URLSearchParams(window.location.search)
      const siteBase = params.get('site')
      if (siteBase) {
        const origin = siteBase.replace(/\/$/, '')
        this.websiteAPI = origin + '/api'
        console.log('[ProjectSync] websiteAPI (from site param):', this.websiteAPI)
      } else {
        // No explicit site provided. We'll detect later in loadWebsiteProject.
        this.websiteAPI = ''
        console.log('[ProjectSync] websiteAPI not set yet (no site param)')
      }
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
    } catch (err) {
      this.websiteAPI = ''
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
    const candidates = []
    // Prefer origin from site param (if provided)
    if (this.websiteAPI) {
      candidates.push(this.websiteAPI.replace(/\/api$/, ''))
    }
    // Then try referrer origin
    if (document.referrer) {
      try {
        const refOrigin = new URL(document.referrer).origin
        if (!candidates.includes(refOrigin)) candidates.push(refOrigin)
      } catch {}
    }
    // Known deployment (website) fallback
    for (const known of ['https://ailiveeditor.netlify.app']) {
      if (!candidates.includes(known)) candidates.push(known)
    }

    let project = null
    let lastError = null
    // Optional bearer token for private projects (captured in constructor)
    const authHeader = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}

    for (const origin of candidates) {
      try {
        const url = `${origin.replace(/\/$/, '')}/api/projects/${projectId}`
        try { console.log('[ProjectSync] Trying', url) } catch {}
        // For public reads, no credentials; attach Authorization when provided
        const res = await fetch(url, { headers: { ...authHeader } })
        if (!res.ok) {
          // Distinguish 404 for clarity
          lastError = new Error(`HTTP ${res.status}`)
          continue
        }
        project = await res.json()
        this.websiteAPI = origin.replace(/\/$/, '') + '/api'
        try { console.log('[ProjectSync] Using websiteAPI:', this.websiteAPI) } catch {}
        break
      } catch (err) {
        lastError = err
        continue
      }
    }
    if (!project) throw new Error(`Failed to load project: ${lastError?.message || 'unknown'}`)

    try {
      const content = typeof project.content === 'string' ? project.content : ''
      const filename = project.title?.trim() ? `${project.title}.html` : 'index.html'
      // Clear current files and tabs so we don't show local leftovers
      this.fileManager.files = []
      this.fileManager.openTabs = []
      this.fileManager.activeTabIndex = -1
      const newFile = this.fileManager.createNewFile(filename, content)
      this.fileManager.openFileInTab(newFile.id)
    } catch (e) {
      console.warn('Failed to import project structure, falling back to single file.', e)
    }

    this.currentProject = project
    this.syncEnabled = true
    return project
  }

  exportProjectContent() {
    const file = this.fileManager.getCurrentFile()
    return file?.content || ''
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
      const current = this.fileManager.getCurrentFile()
      const filename = current?.name || (this.currentProject?.title?.trim() ? `${this.currentProject.title}.html` : 'index.html')
      // Replace current file content
      if (current) {
        current.content = typeof latest.content === 'string' ? latest.content : ''
      } else {
        const newFile = this.fileManager.createNewFile(filename, typeof latest.content === 'string' ? latest.content : '')
        this.fileManager.openFileInTab(newFile.id)
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
    } catch (e) {
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


