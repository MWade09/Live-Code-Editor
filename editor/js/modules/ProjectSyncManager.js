export class ProjectSyncManager {
  constructor(fileManager) {
    this.fileManager = fileManager
    // Determine website API base from URL param if present (site=https://domain)
    try {
      const params = new URLSearchParams(window.location.search)
      let siteBase = params.get('site')
      if (!siteBase && document.referrer) {
        try {
          const ref = new URL(document.referrer)
          siteBase = ref.origin
        } catch {}
      }
      // Final fallback to the current known website deployment
      const fallbackOrigin = 'https://liveeditorcode.netlify.app'
      const origin = (siteBase || fallbackOrigin).replace(/\/$/, '')
      this.websiteAPI = origin + '/api'
      console.debug('[ProjectSync] websiteAPI:', this.websiteAPI)
    } catch (err) {
      this.websiteAPI = 'https://liveeditorcode.netlify.app/api'
      console.debug('[ProjectSync] websiteAPI fallback:', this.websiteAPI)
    }
    this.currentProject = null
    this.syncEnabled = false
  }

  async loadWebsiteProject(projectId) {
    if (!projectId) return
    const candidates = []
    try {
      const params = new URLSearchParams(window.location.search)
      const siteBase = params.get('site')
      if (siteBase) candidates.push(siteBase.replace(/\/$/, ''))
    } catch {}
    if (document.referrer) {
      try { candidates.push(new URL(document.referrer).origin) } catch {}
    }
    // Known deployments (fallbacks)
    candidates.push('https://liveeditorcode.netlify.app')
    candidates.push('https://ailiveeditor.netlify.app')

    let project = null
    let lastError = null
    for (const origin of candidates) {
      try {
        const url = `${origin.replace(/\/$/, '')}/api/projects/${projectId}`
        console.debug('[ProjectSync] Trying', url)
        // For public reads, no credentials to avoid third-party cookie issues
        const res = await fetch(url)
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status}`)
          continue
        }
        project = await res.json()
        this.websiteAPI = origin.replace(/\/$/, '') + '/api'
        console.debug('[ProjectSync] Using websiteAPI:', this.websiteAPI)
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
    const res = await fetch(`${this.websiteAPI}/projects/${this.currentProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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


