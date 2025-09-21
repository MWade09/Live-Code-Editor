export class TerminalManager {
  constructor(projectSyncManager) {
    this.projectSync = projectSyncManager
    this.terminals = new Map()
    this.activeTerminalId = null
    this.currentSessionId = null
    this.sessionCommands = []
    this.cwd = '/'
    this.webcontainer = null
    this.webcontainerReady = false
  }

  get websiteAPI() {
    return this.projectSync.websiteAPI
  }

  get authHeader() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.projectSync.authToken) headers['Authorization'] = `Bearer ${this.projectSync.authToken}`
    return headers
  }

  getActiveTerminal() {
    if (!this.activeTerminalId) return null
    return this.terminals.get(this.activeTerminalId) || null
  }

  async createTerminal() {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    this.terminals.set(id, { id, lines: [], cwd: '/', createdAt: Date.now() })
    this.activeTerminalId = id
    return this.terminals.get(id)
  }

  async logToWebsite(command, cwd = '/', env = {}) {
    if (!this.projectSync.currentProject) return { ok: false, error: 'No project' }
    const projectId = this.projectSync.currentProject.id
    try {
      // If no session yet, create one
      if (!this.currentSessionId) {
        const res = await fetch(`${this.websiteAPI}/projects/${projectId}/terminal`, {
          method: 'POST', headers: this.authHeader, body: JSON.stringify({ command, cwd, env })
        })
        if (!res.ok) return { ok: false, error: await res.text() }
        const body = await res.json()
        this.currentSessionId = body?.data?.id || null
        this.sessionCommands = [{ ts: new Date().toISOString(), command }]
        this.cwd = cwd || '/'
        return { ok: true, data: body }
      }
      // Append to existing session
      const next = [...this.sessionCommands, { ts: new Date().toISOString(), command }]
      const res = await fetch(`${this.websiteAPI}/projects/${projectId}/terminal`, {
        method: 'PUT', headers: this.authHeader, body: JSON.stringify({ sessionId: this.currentSessionId, append: next })
      })
      if (!res.ok) return { ok: false, error: await res.text() }
      this.sessionCommands = next
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  }

  async ensureWebContainer() {
    if (this.webcontainer && this.webcontainerReady) return true
    try {
      const mod = await import('https://unpkg.com/@webcontainer/api/dist/index.js')
      const { WebContainer } = mod
      this.webcontainer = await WebContainer.boot()
      await this.mountProjectFiles()
      this.webcontainerReady = true
      return true
    } catch (e) {
      console.warn('[Terminal] WebContainer init failed:', e)
      this.webcontainer = null
      this.webcontainerReady = false
      return false
    }
  }

  async mountProjectFiles() {
    if (!this.webcontainer) return
    const files = (window.app && window.app.fileManager) ? window.app.fileManager.files : []
    const tree = {}
    for (const f of files) {
      const parts = String(f.name || '').split('/').filter(Boolean)
      let node = tree
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isFile = i === parts.length - 1
        if (isFile) {
          node[part] = { file: { contents: String(f.content || '') } }
        } else {
          node[part] = node[part] || { directory: {} }
          node = node[part].directory
        }
      }
    }
    try {
      await this.webcontainer.mount(tree)
    } catch (e) {
      console.warn('[Terminal] mount failed, attempting fresh mount:', e)
      // try mounting to empty first
      try { await this.webcontainer.mount({}) } catch {}
      await this.webcontainer.mount(tree)
    }
  }

  async runCommand(command, { onData, cwd = '/', cols = 120, rows = 24 } = {}) {
    const ok = await this.ensureWebContainer()
    if (!ok) {
      if (typeof onData === 'function') onData('[no runtime] WebContainer unavailable.\n')
      return { ok: false, code: -1 }
    }
    // Keep website log in the background (best-effort)
    this.logToWebsite(command, cwd).catch(() => {})
    try {
      // Remount to reflect latest files
      await this.mountProjectFiles()
      // Spawn a shell and run the command via bash -lc
      const proc = await this.webcontainer.spawn('bash', ['-lc', command], { terminal: { cols, rows } })
      const reader = proc.output.getReader()
      const decoder = new TextDecoder()
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value && typeof onData === 'function') onData(decoder.decode(value))
        }
      }
      await Promise.race([pump(), proc.exit])
      const code = await proc.exit
      return { ok: true, code }
    } catch (e) {
      if (typeof onData === 'function') onData(String(e) + '\n')
      return { ok: false, code: -1, error: String(e) }
    }
  }
}


