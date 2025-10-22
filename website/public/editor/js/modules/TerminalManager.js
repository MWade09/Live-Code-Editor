export class TerminalManager {
  constructor(projectSyncManager) {
    this.projectSync = projectSyncManager
    this.terminals = new Map()
    this.activeTerminalId = null
    this.currentSessionId = null
    this.sessionCommands = []
    this.cwd = '/'
    
    // NEW: xterm.js instances
    this.xtermInstances = new Map()
    this.terminalCounter = 1
    
    this.initializeUI()
    this.attachEventListeners()
  }

  get websiteAPI() {
    return this.projectSync.websiteAPI
  }

  get authHeader() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.projectSync.authToken) headers['Authorization'] = `Bearer ${this.projectSync.authToken}`
    return headers
  }

  initializeUI() {
    this.terminalPanel = document.getElementById('terminal-panel')
    this.terminalContent = document.getElementById('terminal-content')
    this.terminalTabs = document.getElementById('terminal-tabs')
    this.toggleButton = document.getElementById('terminal-toggle-btn')
    this.newTerminalButton = document.getElementById('new-terminal-btn')
    this.closeButton = document.getElementById('close-terminal-panel-btn')
  }

  attachEventListeners() {
    // Toggle terminal panel
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.togglePanel())
    }

    // New terminal
    if (this.newTerminalButton) {
      this.newTerminalButton.addEventListener('click', () => this.createTerminal())
    }

    // Close panel
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.togglePanel())
    }

    // Keyboard shortcut: Ctrl+` to toggle terminal
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        this.togglePanel()
      }
    })
  }

  togglePanel() {
    const isHidden = this.terminalPanel.style.display === 'none'
    
    if (isHidden) {
      this.terminalPanel.style.display = 'flex'
      document.body.classList.add('terminal-open')
      
      // Create first terminal if none exist
      if (this.terminals.size === 0) {
        this.createTerminal()
      } else {
        // Resize active terminal to fit
        this.fitActiveTerminal()
      }
    } else {
      this.terminalPanel.style.display = 'none'
      document.body.classList.remove('terminal-open')
    }
  }

  getActiveTerminal() {
    if (!this.activeTerminalId) return null
    return this.terminals.get(this.activeTerminalId) || null
  }

  async createTerminal() {
    const id = `t_${this.terminalCounter++}`
    const title = `Terminal ${this.terminalCounter - 1}`
    
    // Create terminal data
    const terminalData = {
      id,
      title,
      lines: [],
      cwd: '/',
      createdAt: Date.now()
    }
    
    this.terminals.set(id, terminalData)
    
    // Check if xterm.js is available
    if (typeof window.Terminal === 'undefined') {
      console.error('xterm.js not loaded!')
      return terminalData
    }
    
    // Create xterm.js instance
    const term = new window.Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      scrollback: 1000,
      allowTransparency: false,
      convertEol: true
    })

    // Add fit addon
    const fitAddon = new window.FitAddon.FitAddon()
    term.loadAddon(fitAddon)

    // Add web links addon
    const webLinksAddon = new window.WebLinksAddon.WebLinksAddon()
    term.loadAddon(webLinksAddon)

    // Create container for this terminal
    const container = document.createElement('div')
    container.id = `terminal-${id}`
    container.className = 'terminal-instance'
    this.terminalContent.appendChild(container)

    // Open terminal in container
    term.open(container)
    fitAddon.fit()

    // Store references
    this.xtermInstances.set(id, { term, fitAddon, container })

    // Welcome message
    term.writeln('\x1b[1;32m╔══════════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[1;32m║   Live Code Editor - Terminal v1.0      ║\x1b[0m')
    term.writeln('\x1b[1;32m╚══════════════════════════════════════════╝\x1b[0m')
    term.writeln('')
    term.writeln('\x1b[1;33mDay 1: Mock Terminal (WebSocket coming Day 2)\x1b[0m')
    term.writeln('Type \x1b[1;36mhelp\x1b[0m for available commands')
    term.writeln('')
    term.write('$ ')

    // Handle user input (Day 1 - Mock implementation)
    let currentLine = ''
    term.onData((data) => {
      const code = data.charCodeAt(0)

      // Handle Enter key
      if (code === 13) {
        term.write('\r\n')
        if (currentLine.trim()) {
          this.handleMockCommand(id, currentLine.trim(), term)
        }
        currentLine = ''
        term.write('$ ')
      }
      // Handle Backspace
      else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1)
          term.write('\b \b')
        }
      }
      // Handle Ctrl+C
      else if (code === 3) {
        term.write('^C\r\n$ ')
        currentLine = ''
      }
      // Handle Ctrl+L (clear screen)
      else if (code === 12) {
        term.clear()
        term.write('$ ')
        currentLine = ''
      }
      // Regular characters
      else {
        currentLine += data
        term.write(data)
      }
    })

    // Create tab
    this.createTab(id, title)
    
    // Set as active
    this.setActiveTerminal(id)
    
    return terminalData
  }

  createTab(id, title) {
    const tab = document.createElement('div')
    tab.className = 'terminal-tab'
    tab.dataset.terminalId = id
    
    const tabTitle = document.createElement('span')
    tabTitle.textContent = title
    
    const closeBtn = document.createElement('span')
    closeBtn.className = 'terminal-tab-close'
    closeBtn.innerHTML = '<i class="fas fa-times"></i>'
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.closeTerminal(id)
    })
    
    tab.appendChild(tabTitle)
    
    // Only show close button if more than one terminal
    if (this.terminals.size > 0) {
      tab.appendChild(closeBtn)
    }
    
    tab.addEventListener('click', () => this.setActiveTerminal(id))
    
    this.terminalTabs.appendChild(tab)
  }

  setActiveTerminal(id) {
    // Update active terminal ID
    this.activeTerminalId = id
    
    // Update tab styles
    document.querySelectorAll('.terminal-tab').forEach(tab => {
      if (tab.dataset.terminalId === id) {
        tab.classList.add('active')
      } else {
        tab.classList.remove('active')
      }
    })
    
    // Update terminal visibility
    document.querySelectorAll('.terminal-instance').forEach(instance => {
      instance.classList.remove('active')
    })
    
    const xtermData = this.xtermInstances.get(id)
    if (xtermData) {
      xtermData.container.classList.add('active')
      
      // Fit terminal to container
      setTimeout(() => {
        xtermData.fitAddon.fit()
      }, 0)
    }
  }

  closeTerminal(id) {
    // Don't close if it's the only terminal
    if (this.terminals.size === 1) {
      return
    }
    
    // Remove terminal data
    this.terminals.delete(id)
    
    // Dispose xterm instance
    const xtermData = this.xtermInstances.get(id)
    if (xtermData) {
      xtermData.term.dispose()
      xtermData.container.remove()
      this.xtermInstances.delete(id)
    }
    
    // Remove tab
    const tab = document.querySelector(`.terminal-tab[data-terminal-id="${id}"]`)
    if (tab) {
      tab.remove()
    }
    
    // Switch to another terminal if this was active
    if (this.activeTerminalId === id) {
      const firstTerminalId = this.terminals.keys().next().value
      if (firstTerminalId) {
        this.setActiveTerminal(firstTerminalId)
      }
    }
  }

  fitActiveTerminal() {
    const xtermData = this.xtermInstances.get(this.activeTerminalId)
    if (xtermData) {
      xtermData.fitAddon.fit()
    }
  }

  // Mock command handler for Day 1 (will be replaced with WebSocket in Day 2)
  handleMockCommand(terminalId, command, term) {
    const terminal = this.terminals.get(terminalId)
    
    // Log to website API (existing functionality)
    this.logToWebsite(command, terminal.cwd)
    
    // Mock responses for common commands
    if (command === 'help') {
      term.writeln('')
      term.writeln('\x1b[1;36mAvailable Commands (Day 1 - Mock):\x1b[0m')
      term.writeln('  \x1b[1;32mhelp\x1b[0m      - Show this help message')
      term.writeln('  \x1b[1;32mclear\x1b[0m     - Clear the terminal')
      term.writeln('  \x1b[1;32mecho\x1b[0m      - Echo text back')
      term.writeln('  \x1b[1;32mls\x1b[0m        - List files (mock)')
      term.writeln('  \x1b[1;32mpwd\x1b[0m       - Print working directory (mock)')
      term.writeln('  \x1b[1;32mdate\x1b[0m      - Show current date')
      term.writeln('  \x1b[1;32mwhoami\x1b[0m    - Show current user (mock)')
      term.writeln('')
      term.writeln('\x1b[1;33m⚠️  Note: Full command execution coming in Day 2!\x1b[0m')
      term.writeln('')
    } else if (command === 'clear') {
      term.clear()
    } else if (command.startsWith('echo ')) {
      const text = command.substring(5)
      term.writeln(text)
    } else if (command === 'ls' || command === 'dir') {
      term.writeln('\x1b[1;34mindex.html\x1b[0m')
      term.writeln('\x1b[1;34mstyles.css\x1b[0m')
      term.writeln('\x1b[1;34mscript.js\x1b[0m')
      term.writeln('\x1b[1;34mpackage.json\x1b[0m')
      term.writeln('\x1b[90m(Mock data - Real file system coming soon)\x1b[0m')
    } else if (command === 'pwd') {
      term.writeln('/workspace/project')
      term.writeln('\x1b[90m(Mock data - Real cwd tracking coming soon)\x1b[0m')
    } else if (command === 'date') {
      term.writeln(new Date().toString())
    } else if (command === 'whoami') {
      term.writeln('user')
      term.writeln('\x1b[90m(Mock data)\x1b[0m')
    } else if (command.trim() !== '') {
      term.writeln(`\x1b[1;31mCommand not found: ${command}\x1b[0m`)
      term.writeln('Type \x1b[1;36mhelp\x1b[0m for available commands.')
      term.writeln('\x1b[90mFull shell execution coming in Day 2!\x1b[0m')
    }
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
}


