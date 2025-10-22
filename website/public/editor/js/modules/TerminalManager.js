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
    console.log('🔧 TerminalManager: Initializing UI...')
    this.terminalPanel = document.getElementById('terminal-panel')
    this.terminalContent = document.getElementById('terminal-content')
    this.terminalTabs = document.getElementById('terminal-tabs')
    this.toggleButton = document.getElementById('terminal-toggle-btn')
    this.newTerminalButton = document.getElementById('new-terminal-btn')
    this.closeButton = document.getElementById('close-terminal-panel-btn')
    
    console.log('📍 Terminal Panel:', this.terminalPanel ? '✅ Found' : '❌ Not found')
    console.log('📍 Toggle Button:', this.toggleButton ? '✅ Found' : '❌ Not found')
    console.log('📍 Terminal Content:', this.terminalContent ? '✅ Found' : '❌ Not found')
    console.log('📍 Terminal Tabs:', this.terminalTabs ? '✅ Found' : '❌ Not found')
  }

  attachEventListeners() {
    console.log('🎯 TerminalManager: Attaching event listeners...')
    
    // Toggle terminal panel
    if (this.toggleButton) {
      console.log('✅ Adding click listener to toggle button')
      this.toggleButton.addEventListener('click', () => {
        console.log('🖱️ Terminal toggle button clicked!')
        this.togglePanel()
      })
    } else {
      console.warn('⚠️ Toggle button not found - cannot attach listener')
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
        console.log('⌨️ Ctrl+` pressed - toggling terminal')
        this.togglePanel()
      }
    })
    
    // Terminal resize handle
    const resizer = document.getElementById('terminal-resizer')
    if (resizer) {
      let isResizing = false
      let startY = 0
      let startHeight = 0
      
      resizer.addEventListener('mousedown', (e) => {
        isResizing = true
        startY = e.clientY
        startHeight = this.terminalPanel.offsetHeight
        document.body.style.cursor = 'ns-resize'
        document.body.style.userSelect = 'none'
        e.preventDefault()
      })
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return
        
        const deltaY = startY - e.clientY // Inverted because we're resizing from top
        const newHeight = Math.max(100, Math.min(startHeight + deltaY, window.innerHeight * 0.8))
        
        this.terminalPanel.style.flex = `0 0 ${newHeight}px`
        
        // Fit all terminal instances
        this.xtermInstances.forEach(({ fitAddon }) => {
          if (fitAddon) {
            setTimeout(() => fitAddon.fit(), 0)
          }
        })
      })
      
      document.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
        }
      })
      
      console.log('✅ Terminal resizer initialized')
    }
    
    console.log('✅ TerminalManager: Event listeners attached')
  }

  togglePanel() {
    console.log('🔄 togglePanel() called')
    
    if (!this.terminalPanel) {
      console.error('❌ Terminal panel element not found!')
      return
    }
    
    const isHidden = this.terminalPanel.style.display === 'none'
    console.log('📊 Current state - Hidden:', isHidden)
    
    if (isHidden) {
      console.log('👁️ Opening terminal panel...')
      this.terminalPanel.style.display = 'flex'
      document.body.classList.add('terminal-open')
      console.log('📐 Panel display:', this.terminalPanel.style.display)
      console.log('📐 Panel computed display:', window.getComputedStyle(this.terminalPanel).display)
      console.log('📐 Panel visibility:', window.getComputedStyle(this.terminalPanel).visibility)
      console.log('📐 Panel height:', window.getComputedStyle(this.terminalPanel).height)
      console.log('📐 Panel z-index:', window.getComputedStyle(this.terminalPanel).zIndex)
      
      // Create first terminal if none exist
      if (this.terminals.size === 0) {
        console.log('➕ Creating first terminal...')
        this.createTerminal()
      } else {
        // Resize active terminal to fit
        this.fitActiveTerminal()
      }
    } else {
      console.log('👁️‍🗨️ Closing terminal panel...')
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
    console.log('🔍 Checking for xterm.js...')
    console.log('window.Terminal:', typeof window.Terminal)
    console.log('window.FitAddon:', typeof window.FitAddon)
    console.log('window.WebLinksAddon:', typeof window.WebLinksAddon)
    
    if (typeof window.Terminal === 'undefined') {
      console.error('❌ xterm.js not loaded!')
      console.error('Available window properties:', Object.keys(window).filter(k => k.includes('term') || k.includes('xterm')))
      return terminalData
    }
    
    console.log('✅ xterm.js is available, creating terminal instance...')
    
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

    console.log('✅ Terminal instance created')

    // Add fit addon
    let fitAddon = null
    try {
      fitAddon = new window.FitAddon.FitAddon()
      term.loadAddon(fitAddon)
      console.log('✅ FitAddon loaded')
      
      // Add web links addon
      const webLinksAddon = new window.WebLinksAddon.WebLinksAddon()
      term.loadAddon(webLinksAddon)
      console.log('✅ WebLinksAddon loaded')
    } catch (error) {
      console.error('❌ Error loading addons:', error)
      console.log('Addon objects:', { fitAddon: window.FitAddon, webLinks: window.WebLinksAddon })
    }

    console.log('📦 Creating terminal container...')
    // Create container for this terminal
    const container = document.createElement('div')
    container.id = `terminal-${id}`
    container.className = 'terminal-instance'
    this.terminalContent.appendChild(container)
    console.log('✅ Container created and added to DOM')

    console.log('🖥️ Opening terminal in container...')
    // Open terminal in container
    term.open(container)
    console.log('✅ Terminal opened')
    
    if (fitAddon) {
      console.log('📐 Fitting terminal to container...')
      fitAddon.fit()
      console.log('✅ Terminal fitted')
    }

    // Store references
    this.xtermInstances.set(id, { term, fitAddon, container })
    console.log('✅ Terminal instance stored')

    console.log('💬 Writing welcome message...')
    try {
      // Welcome message
      term.writeln('\x1b[1;32m╔══════════════════════════════════════════╗\x1b[0m')
      term.writeln('\x1b[1;32m║   Live Code Editor - Terminal v1.0      ║\x1b[0m')
      term.writeln('\x1b[1;32m╚══════════════════════════════════════════╝\x1b[0m')
      term.writeln('')
      term.writeln('\x1b[1;33mDay 1: Mock Terminal (WebSocket coming Day 2)\x1b[0m')
      term.writeln('Type \x1b[1;36mhelp\x1b[0m for available commands')
      term.writeln('')
      term.write('$ ')
      console.log('✅ Welcome message written')
    } catch (error) {
      console.error('❌ Error writing welcome message:', error)
    }

    console.log('🎧 Setting up input handler...')
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
    console.log('✅ Input handler set up')

    console.log('📑 Creating tab...')
    // Create tab
    this.createTab(id, title)
    console.log('✅ Tab created')
    
    console.log('🎯 Setting as active terminal...')
    // Set as active
    this.setActiveTerminal(id)
    console.log('✅ Terminal set as active')
    
    console.log('🎉 Terminal creation complete!')
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
    console.log('🎯 setActiveTerminal called with id:', id)
    
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
    console.log('✅ Tab styles updated')
    
    // Update terminal visibility
    document.querySelectorAll('.terminal-instance').forEach(instance => {
      instance.classList.remove('active')
    })
    console.log('✅ Removed active class from all instances')
    
    const xtermData = this.xtermInstances.get(id)
    console.log('📦 Found xterm data:', xtermData ? 'YES' : 'NO')
    
    if (xtermData) {
      xtermData.container.classList.add('active')
      console.log('✅ Added active class to container')
      console.log('📐 Container display:', window.getComputedStyle(xtermData.container).display)
      console.log('📐 Container visibility:', window.getComputedStyle(xtermData.container).visibility)
      console.log('📐 Container classes:', xtermData.container.className)
      
      // Fit terminal to container
      setTimeout(() => {
        if (xtermData.fitAddon) {
          xtermData.fitAddon.fit()
          console.log('✅ Terminal fitted to container')
        }
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


