export class VersionControlManager {
  constructor(projectSyncManager, fileManager) {
    this.projectSync = projectSyncManager
    this.fileManager = fileManager
    this.cache = { commits: [], branches: [], currentBranch: 'main' }
  }

  get hasProject() {
    return !!(this.projectSync && this.projectSync.currentProject)
  }

  get websiteAPI() {
    return this.projectSync.websiteAPI
  }

  get authHeader() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.projectSync.authToken) headers['Authorization'] = `Bearer ${this.projectSync.authToken}`
    return headers
  }

  getProjectId() {
    return this.projectSync.currentProject?.id || null
  }

  async listCommits() {
    if (!this.hasProject) return []
    const projectId = this.getProjectId()
    const url = new URL(`${this.websiteAPI}/projects/${projectId}/commits`)
    if (this.cache.currentBranch) url.searchParams.set('branch', this.cache.currentBranch)
    const res = await fetch(url.toString(), { headers: this.authHeader })
    if (!res.ok) return []
    const data = await res.json()
    this.cache.commits = Array.isArray(data.data) ? data.data : []
    return this.cache.commits
  }

  async listCommitsForBranch(branchName, limit = 1) {
    if (!this.hasProject) return []
    const projectId = this.getProjectId()
    const url = new URL(`${this.websiteAPI}/projects/${projectId}/commits`)
    if (branchName) url.searchParams.set('branch', branchName)
    url.searchParams.set('page', '1')
    url.searchParams.set('pageSize', String(Math.max(1, limit)))
    const res = await fetch(url.toString(), { headers: this.authHeader })
    if (!res.ok) return []
    const data = await res.json()
    const commits = Array.isArray(data.data) ? data.data : []
    return commits
  }

  async getLatestCommitForBranch(branchName) {
    const commits = await this.listCommitsForBranch(branchName, 1)
    return commits[0] || null
  }

  async getCommit(commitId) {
    if (!this.hasProject) return null
    const projectId = this.getProjectId()
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/commits/${commitId}`, { headers: this.authHeader })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || null
  }

  async createCommit(message, branch = 'main') {
    if (!this.hasProject) return { ok: false, error: 'No project' }
    const projectId = this.getProjectId()
    const content = this.fileManager.getCurrentFile()?.content || ''
    let expectedHeadId = null
    const targetBranch = branch || this.cache.currentBranch || 'main'
    if ((this.cache.currentBranch || 'main') === targetBranch && Array.isArray(this.cache.commits) && this.cache.commits.length) {
      expectedHeadId = this.cache.commits[0]?.id || null
    }
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/commits`, {
      method: 'POST', headers: this.authHeader, body: JSON.stringify({ message, content, branch: targetBranch, expectedHeadId })
    })
    if (!res.ok) {
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}))
        return { ok: false, conflict: true, latest: body?.latest, error: 'Remote changed' }
      }
      const text = await res.text()
      return { ok: false, error: text || res.status }
    }
    const inserted = await res.json()
    return { ok: true, data: inserted }
  }

  async listBranches() {
    if (!this.hasProject) return []
    const projectId = this.getProjectId()
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/branches`, { headers: this.authHeader })
    if (!res.ok) return []
    const data = await res.json()
    this.cache.branches = Array.isArray(data.data) ? data.data : []
    return this.cache.branches
  }

  async createBranch(name) {
    if (!this.hasProject) return { ok: false, error: 'No project' }
    const projectId = this.getProjectId()
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/branches`, { method: 'POST', headers: this.authHeader, body: JSON.stringify({ name }) })
    if (!res.ok) return { ok: false, error: await res.text() }
    return { ok: true, data: await res.json() }
  }

  checkoutBranch(name) {
    this.cache.currentBranch = name || 'main'
    return this.listCommits()
  }

  async renameBranch(oldName, newName) {
    if (!this.hasProject) return { ok: false, error: 'No project' }
    const projectId = this.getProjectId()
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/branches`, { method: 'PATCH', headers: this.authHeader, body: JSON.stringify({ oldName, newName }) })
    if (!res.ok) return { ok: false, error: await res.text() }
    return { ok: true }
  }

  async deleteBranch(name) {
    if (!this.hasProject) return { ok: false, error: 'No project' }
    const projectId = this.getProjectId()
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/branches`, { method: 'DELETE', headers: this.authHeader, body: JSON.stringify({ name }) })
    if (!res.ok) return { ok: false, error: await res.text() }
    return { ok: true }
  }

  async amendLastCommit(newMessage) {
    if (!this.hasProject) return { ok: false, error: 'No project' }
    const head = this.cache.commits?.[0]
    if (!head?.id) return { ok: false, error: 'No commits' }
    const projectId = this.getProjectId()
    const res = await fetch(`${this.websiteAPI}/projects/${projectId}/commits/${head.id}`, { method: 'PATCH', headers: this.authHeader, body: JSON.stringify({ message: newMessage }) })
    if (!res.ok) return { ok: false, error: await res.text() }
    return { ok: true }
  }

  computeLineDiff(oldText, newText) {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const max = Math.max(oldLines.length, newLines.length)
    const diff = []
    for (let i = 0; i < max; i += 1) {
      const a = oldLines[i] ?? ''
      const b = newLines[i] ?? ''
      if (a === b) {
        diff.push({ type: 'context', text: a })
      } else {
        if (a) diff.push({ type: 'removed', text: a })
        if (b) diff.push({ type: 'added', text: b })
      }
    }
    return diff
  }

  async restoreToCommit(commitId, options = { autoSync: true, createCommit: true }) {
    const commit = await this.getCommit(commitId)
    if (!commit) return { ok: false, error: 'Commit not found' }
    const target = typeof commit.content === 'string' ? commit.content : ''
    const file = this.fileManager.getCurrentFile()
    if (file) {
      file.content = target
    } else {
      const name = this.projectSync.currentProject?.title?.trim() ? `${this.projectSync.currentProject.title}.html` : 'index.html'
      const created = this.fileManager.createNewFile(name, target)
      this.fileManager.openFileInTab(created.id)
    }
    if (typeof this.fileManager.clearAllDirty === 'function') this.fileManager.clearAllDirty()
    if (options.autoSync) {
      const res = await this.projectSync.saveToWebsite()
      if (!res.ok) return { ok: false, error: res.error || 'Sync failed' }
    }
    if (options.createCommit) {
      const msg = `Revert to ${commit.id.slice(0, 7)}: ${commit.message || ''}`.slice(0, 120)
      await this.createCommit(msg)
    }
    return { ok: true }
  }
}


