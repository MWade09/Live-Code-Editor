export class ProjectSyncManager {
  constructor(fileManager) {
    this.fileManager = fileManager
    // Determine website API base from URL param if present (site=https://domain)
    try {
      const params = new URLSearchParams(window.location.search)
      const siteBase = params.get('site')
      this.websiteAPI = (siteBase ? siteBase.replace(/\/$/, '') : 'https://ailiveeditor.netlify.app') + '/api'
    } catch {
      this.websiteAPI = 'https://ailiveeditor.netlify.app/api'
    }
    this.currentProject = null
    this.syncEnabled = false
  }

  async loadWebsiteProject(projectId) {
    if (!projectId) return
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}`, {
      credentials: 'include'
    })
    if (!res.ok) throw new Error(`Failed to load project: ${res.status}`)
    const project = await res.json()

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


