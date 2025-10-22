'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import 'xterm/css/xterm.css'

interface TerminalProps {
  id: string
  onClose?: () => void
  isActive?: boolean
}

export default function Terminal({ id, onClose, isActive = true }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!terminalRef.current || isInitialized) return

    // Initialize xterm.js
    const term = new XTerm({
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
        brightWhite: '#ffffff',
      },
      rows: 24,
      cols: 80,
      scrollback: 1000,
      allowTransparency: false,
      convertEol: true,
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    // Open terminal in DOM
    term.open(terminalRef.current)
    fitAddon.fit()

    // Store references
    xtermRef.current = term
    fitAddonRef.current = fitAddon
    setIsInitialized(true)

    // Welcome message
    term.writeln('\x1b[1;32mTerminal Ready\x1b[0m')
    term.writeln('Type commands to execute in the terminal.')
    term.writeln('')
    term.write('$ ')

    // Handle user input
    let currentLine = ''
    term.onData((data) => {
      const code = data.charCodeAt(0)

      // Handle Enter key
      if (code === 13) {
        term.write('\r\n')
        if (currentLine.trim()) {
          handleCommand(currentLine.trim(), term)
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
      // Regular characters
      else {
        currentLine += data
        term.write(data)
      }
    })

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current && isActive) {
        setTimeout(() => {
          fitAddonRef.current?.fit()
        }, 0)
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [isInitialized, isActive])

  // Fit terminal when active state changes
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit()
      }, 0)
    }
  }, [isActive])

  // Mock command handler (will be replaced with WebSocket in Day 2)
  const handleCommand = (command: string, term: XTerm) => {
    // Basic command responses for Day 1 testing
    if (command === 'help') {
      term.writeln('Available commands (Day 1 - Mock):')
      term.writeln('  help     - Show this help message')
      term.writeln('  clear    - Clear the terminal')
      term.writeln('  echo     - Echo text back')
      term.writeln('  ls       - List files (mock)')
      term.writeln('  pwd      - Print working directory (mock)')
      term.writeln('')
      term.writeln('Note: Full command execution coming in Day 2!')
    } else if (command === 'clear') {
      term.clear()
    } else if (command.startsWith('echo ')) {
      const text = command.substring(5)
      term.writeln(text)
    } else if (command === 'ls') {
      term.writeln('index.html')
      term.writeln('styles.css')
      term.writeln('script.js')
      term.writeln('(Mock data - WebSocket integration coming soon)')
    } else if (command === 'pwd') {
      term.writeln('/workspace/project')
      term.writeln('(Mock data - WebSocket integration coming soon)')
    } else if (command.trim() !== '') {
      term.writeln(`\x1b[1;31mCommand not found: ${command}\x1b[0m`)
      term.writeln('Type "help" for available commands.')
    }
  }

  return (
    <div className="terminal-container h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* Terminal Header */}
      <div className="terminal-header flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-mono">Terminal {id}</span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close Terminal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="terminal-body flex-1 overflow-hidden p-2"
        style={{ display: isActive ? 'block' : 'none' }}
      />

      {/* Status Bar */}
      <div className="terminal-status flex items-center justify-between px-3 py-1 bg-[#2d2d2d] border-t border-[#3e3e3e] text-xs text-gray-400">
        <span>Ready</span>
        <span>80x24</span>
      </div>
    </div>
  )
}
