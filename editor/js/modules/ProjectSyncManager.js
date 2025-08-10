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
    } catch (err) {
      this.websiteAPI = ''
      this.authToken = ''
    }
    this.currentProject = null
    this.syncEnabled = false
  }

  async loadWebsiteProject(projectId) {
    if (!projectId) return
    const candidates = []
    // If websiteAPI was set from site param, use ONLY that
    if (this.websiteAPI) {
      candidates.push(this.websiteAPI.replace(/\/api$/, ''))
    } else {
      // Otherwise, detect from referrer and known fallbacks
      if (document.referrer) {
        try { candidates.push(new URL(document.referrer).origin) } catch {}
      }
      candidates.push('https://liveeditorcode.netlify.app')
      candidates.push('https://ailiveeditor.netlify.app')
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
    const res = await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ content })
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text }
    }
    const updated = await res.json()
    this.currentProject.updated_at = updated.updated_at
    return { ok: true }
  }
}


