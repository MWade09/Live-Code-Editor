# 🖥️ Terminal Integration Implementation Plan

**Created**: October 22, 2025  
**Sprint**: Sprint 2 (Oct 28 - Nov 10)  
**Priority**: HIGH  
**Estimated Time**: 1-2 weeks

---

## 📋 Overview

Integrate a fully functional terminal emulator into the Live Code Editor using **xterm.js**, providing users with command-line access for package management, build scripts, and development tasks.

---

## 🎯 Goals

### Primary Goals
1. Embedded terminal panel in the editor interface
2. Package manager support (npm, pip, yarn, pnpm)
3. Build script detection and execution
4. Command history navigation
5. Multiple terminal sessions

### Secondary Goals
1. AI-suggested commands
2. Terminal output parsing for errors
3. Custom command shortcuts
4. Terminal themes matching editor theme

---

## 🏗️ Architecture

### Technology Stack

**Frontend**:
- **xterm.js** (v5.x) - Terminal emulator
- **xterm-addon-fit** - Auto-resize terminal
- **xterm-addon-web-links** - Clickable URLs in output
- **xterm-addon-search** - Search in terminal output
- React hooks for state management

**Backend**:
- **node-pty** - Pseudo terminal for Node.js (spawns actual shell)
- **WebSocket** (Socket.io) - Real-time communication
- Next.js API routes for terminal session management

### Component Structure

```
website/src/
├── components/
│   └── terminal/
│       ├── Terminal.tsx              # Main terminal component
│       ├── TerminalPanel.tsx         # Panel container with tabs
│       ├── TerminalToolbar.tsx       # Terminal controls
│       └── TerminalSession.tsx       # Individual session component
├── hooks/
│   ├── useTerminal.ts                # Terminal state management
│   └── useTerminalSession.ts         # Session lifecycle
├── lib/
│   └── terminal/
│       ├── pty-manager.ts            # Pseudo-terminal management
│       ├── command-parser.ts         # Parse and detect commands
│       └── terminal-themes.ts        # Terminal color schemes
└── app/
    └── api/
        └── terminal/
            ├── session/route.ts      # Create/destroy sessions
            └── execute/route.ts      # Execute commands
```

---

## 🔧 Implementation Steps

### Phase 1: Basic Terminal Setup (Days 1-3)

#### Step 1.1: Install Dependencies
```bash
cd website
npm install xterm @xterm/addon-fit @xterm/addon-web-links @xterm/addon-search
npm install socket.io socket.io-client
npm install node-pty  # Backend only
```

#### Step 1.2: Create Terminal Component
**File**: `website/src/components/terminal/Terminal.tsx`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import 'xterm/css/xterm.css'

interface TerminalProps {
  sessionId: string
  onData?: (data: string) => void
}

export function Terminal({ sessionId, onData }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    // Create terminal instance
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4'
      }
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    // Open terminal
    term.open(terminalRef.current)
    fitAddon.fit()

    // Handle data input
    term.onData((data) => {
      onData?.(data)
    })

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Handle resize
    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [sessionId, onData])

  return <div ref={terminalRef} className="w-full h-full" />
}
```

#### Step 1.3: Create WebSocket Connection Hook
**File**: `website/src/hooks/useTerminal.ts`

```typescript
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useTerminal(sessionId: string) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io('/terminal', {
      query: { sessionId }
    })

    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('output', (data: string) => {
      // Forward output to terminal
      terminalRef.current?.write(data)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [sessionId])

  const sendCommand = (command: string) => {
    socketRef.current?.emit('input', command)
  }

  return { connected, sendCommand }
}
```

#### Step 1.4: Create Backend Session Management
**File**: `website/src/app/api/terminal/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// In-memory session storage (consider Redis for production)
const sessions = new Map()

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = uuidv4()
    const { projectId } = await req.json()

    // Create pseudo-terminal session
    sessions.set(sessionId, {
      userId: user.id,
      projectId,
      createdAt: new Date()
    })

    return NextResponse.json({ sessionId })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    sessions.delete(sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
```

---

### Phase 2: Package Manager Integration (Days 4-5)

#### Step 2.1: Command Detection
**File**: `website/src/lib/terminal/command-parser.ts`

```typescript
export interface ParsedCommand {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | null
  command: string
  args: string[]
  isInstall: boolean
  packages: string[]
}

export function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/)
  const [cmd, ...args] = parts

  // Detect package manager
  let packageManager: ParsedCommand['packageManager'] = null
  let isInstall = false
  let packages: string[] = []

  if (cmd === 'npm') {
    packageManager = 'npm'
    isInstall = args[0] === 'install' || args[0] === 'i'
    packages = args.slice(1)
  } else if (cmd === 'yarn') {
    packageManager = 'yarn'
    isInstall = args[0] === 'add'
    packages = args.slice(1)
  } else if (cmd === 'pnpm') {
    packageManager = 'pnpm'
    isInstall = args[0] === 'add' || args[0] === 'install'
    packages = args.slice(1)
  } else if (cmd === 'pip') {
    packageManager = 'pip'
    isInstall = args[0] === 'install'
    packages = args.slice(1)
  }

  return {
    packageManager,
    command: cmd,
    args,
    isInstall,
    packages
  }
}
```

#### Step 2.2: Build Script Detection
**File**: `website/src/lib/terminal/build-scripts.ts`

```typescript
export interface BuildScript {
  name: string
  command: string
  packageManager: string
}

export function detectBuildScripts(packageJson: any): BuildScript[] {
  const scripts: BuildScript[] = []

  if (!packageJson?.scripts) return scripts

  const commonScripts = ['build', 'dev', 'start', 'test', 'lint']

  for (const scriptName of commonScripts) {
    if (packageJson.scripts[scriptName]) {
      scripts.push({
        name: scriptName,
        command: packageJson.scripts[scriptName],
        packageManager: 'npm' // Can detect from lock files
      })
    }
  }

  return scripts
}
```

---

### Phase 3: UI Components (Days 6-8)

#### Step 3.1: Terminal Panel with Tabs
**File**: `website/src/components/terminal/TerminalPanel.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Terminal } from './Terminal'
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react'

interface TerminalSession {
  id: string
  name: string
}

export function TerminalPanel() {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', name: 'Terminal 1' }
  ])
  const [activeSession, setActiveSession] = useState('1')

  const addSession = () => {
    const newId = `${Date.now()}`
    setSessions([...sessions, { id: newId, name: `Terminal ${sessions.length + 1}` }])
    setActiveSession(newId)
  }

  const closeSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id)
    setSessions(newSessions)
    if (activeSession === id && newSessions.length > 0) {
      setActiveSession(newSessions[0].id)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-800 border-b border-slate-700">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer ${
              activeSession === session.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            onClick={() => setActiveSession(session.id)}
          >
            <TerminalIcon className="w-4 h-4" />
            <span className="text-sm">{session.name}</span>
            {sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeSession(session.id)
                }}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addSession}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`w-full h-full ${activeSession === session.id ? 'block' : 'hidden'}`}
          >
            <Terminal sessionId={session.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### Phase 4: Advanced Features (Days 9-10)

#### Step 4.1: Command History
- Arrow up/down navigation through command history
- Store in localStorage per project
- Shared history across sessions

#### Step 4.2: AI Command Suggestions
- Integrate with existing AI system
- Suggest commands based on project context
- Show command explanations

#### Step 4.3: Output Parsing
- Detect errors (exit code, stderr)
- Parse package installation success/failure
- Show notifications for important events

---

## 🎨 UI/UX Requirements

### Layout
```
┌─────────────────────────────────────────┐
│  Editor / Preview Area                  │
│                                         │
├─────────────────────────────────────────┤
│ [Terminal 1] [Terminal 2] [+]           │ ← Tab Bar
├─────────────────────────────────────────┤
│ $ npm install react                     │
│ added 3 packages in 2s                  │
│                                         │
│ $ npm run dev                           │
│ > dev                                    │
│ > next dev                              │
│                                         │
│ ▸ Ready on http://localhost:3000        │
│ $ █                                     │ ← Cursor
└─────────────────────────────────────────┘
```

### Keyboard Shortcuts
- **Ctrl + `** - Toggle terminal panel
- **Ctrl + Shift + `** - New terminal
- **Ctrl + W** - Close current terminal
- **Ctrl + Tab** - Switch between terminals
- **Arrow Up/Down** - Command history

### Theme Integration
- Match editor theme (dark/light)
- Use consistent color palette
- Customizable font size

---

## 🔒 Security Considerations

### Command Restrictions
- **Whitelist** safe commands (npm, yarn, git, etc.)
- **Blacklist** dangerous commands (rm -rf, sudo, etc.)
- Require confirmation for destructive operations

### Resource Limits
- Max 5 terminals per user
- Timeout for long-running commands (5 minutes)
- Memory limits per session

### Authentication
- Verify user session before creating terminal
- Associate terminals with projects
- Cleanup on user logout

---

## 🧪 Testing Strategy

### Unit Tests
- Command parser functions
- Build script detection
- Terminal session management

### Integration Tests
- WebSocket connection
- Command execution
- Output streaming

### E2E Tests
- Open terminal panel
- Execute commands
- Create multiple sessions
- Close sessions

---

## 📊 Success Metrics

### Must-Have (Launch Blockers)
- ✅ Terminal opens and accepts input
- ✅ Commands execute correctly
- ✅ npm/yarn installation works
- ✅ Multiple sessions supported
- ✅ Command history navigation

### Nice-to-Have (Post-Launch)
- AI command suggestions
- Output parsing and error detection
- Custom command shortcuts
- Terminal recording/playback

---

## 🚀 Deployment Considerations

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Test WebSocket performance

### Server Requirements
- WebSocket server (Socket.io)
- Node.js runtime for node-pty
- File system access for project files

### Scalability
- Consider Redis for session storage
- Load balancing for WebSocket connections
- Connection pooling

---

## 📚 Resources

### Documentation
- [xterm.js Documentation](https://xtermjs.org/)
- [node-pty GitHub](https://github.com/microsoft/node-pty)
- [Socket.io Documentation](https://socket.io/docs/)

### Examples
- [VS Code Terminal](https://github.com/microsoft/vscode)
- [CodeSandbox Terminal](https://codesandbox.io/)
- [Replit Terminal](https://replit.com/)

---

**Next Steps**: Begin Phase 1 implementation on Oct 28, 2025
