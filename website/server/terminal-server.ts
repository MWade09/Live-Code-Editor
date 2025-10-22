#!/usr/bin/env node

/**
 * Terminal WebSocket Server
 * Standalone Socket.io server for handling terminal sessions
 * Runs on port 3001 alongside Next.js dev server (port 3000)
 */

import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'

const PORT = process.env.TERMINAL_PORT || 3001

// Store active terminal sessions
const terminals = new Map<string, ChildProcess>()

// Create HTTP server
const httpServer = createServer()

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',  // Allow all origins in development
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('🔌 Terminal client connected:', socket.id)

  // Handle terminal creation
  socket.on('create-terminal', (data: { id: string, cwd?: string }) => {
    const { id, cwd = process.cwd() } = data
    
    console.log('🖥️ Creating terminal:', id)

    // Determine shell based on OS
    const isWindows = process.platform === 'win32'
    const shell = isWindows ? 'powershell.exe' : 'bash'
    const shellArgs = isWindows ? ['-NoLogo', '-NoProfile', '-Command', '-'] : ['--login']

    try {
      // Spawn shell process
      const pty = spawn(shell, shellArgs, {
        cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          PS1: isWindows ? undefined : '\\[\\033[01;32m\\]$\\[\\033[00m\\] ' // Green $ prompt for bash
        },
        shell: false,
        windowsHide: true
      })

      // Store terminal session
      terminals.set(id, pty)

      // Forward stdout to client
      pty.stdout?.on('data', (data: Buffer) => {
        socket.emit('output', {
          id,
          data: data.toString('utf-8')
        })
      })

      // Forward stderr to client
      pty.stderr?.on('data', (data: Buffer) => {
        socket.emit('output', {
          id,
          data: data.toString('utf-8')
        })
      })

      // Handle process exit
      pty.on('exit', (code: number | null) => {
        console.log(`🛑 Terminal ${id} exited with code:`, code)
        socket.emit('exit', { id, code })
        terminals.delete(id)
      })

      // Handle process error
      pty.on('error', (err: Error) => {
        console.error(`❌ Terminal ${id} error:`, err)
        socket.emit('error', { id, error: err.message })
      })

      // Notify client that terminal is ready
      socket.emit('created', { id, shell })
      console.log(`✅ Terminal ${id} created successfully`)
    } catch (err) {
      console.error(`❌ Failed to create terminal ${id}:`, err)
      socket.emit('error', { id, error: (err as Error).message })
    }
  })

  // Handle input from client
  socket.on('input', (data: { id: string, input: string }) => {
    const { id, input } = data
    const pty = terminals.get(id)

    if (pty && pty.stdin) {
      try {
        pty.stdin.write(input)
      } catch (err) {
        console.error(`❌ Failed to write to terminal ${id}:`, err)
        socket.emit('error', { id, error: (err as Error).message })
      }
    } else {
      console.warn(`⚠️ Terminal ${id} not found or stdin not available`)
    }
  })

  // Handle terminal resize (for proper line wrapping)
  socket.on('resize', (data: { id: string, cols: number, rows: number }) => {
    const { id, cols, rows } = data
    // child_process doesn't support resize directly
    // This would work with node-pty: pty.resize(cols, rows)
    console.log(`📐 Terminal ${id} resize request: ${cols}x${rows}`)
  })

  // Handle terminal destruction
  socket.on('destroy-terminal', (data: { id: string }) => {
    const { id } = data
    const pty = terminals.get(id)

    if (pty) {
      console.log(`🗑️ Destroying terminal: ${id}`)
      try {
        pty.kill()
        terminals.delete(id)
      } catch (err) {
        console.error(`❌ Failed to kill terminal ${id}:`, err)
      }
    }
  })

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Terminal client disconnected:', socket.id)
    
    // Kill all terminals for this socket (cleanup)
    // In production, you might want to keep terminals alive
    terminals.forEach((pty, id) => {
      console.log(`🧹 Cleaning up terminal: ${id}`)
      try {
        pty.kill()
        terminals.delete(id)
      } catch (err) {
        console.error(`❌ Failed to cleanup terminal ${id}:`, err)
      }
    })
  })
})

// Start server
httpServer.listen(PORT, () => {
  console.log('🚀 Terminal WebSocket Server')
  console.log(`📡 Listening on port ${PORT}`)
  console.log(`🔗 Connect via: ws://localhost:${PORT}`)
  console.log(`🖥️ Platform: ${process.platform}`)
  console.log(`🐚 Shell: ${process.platform === 'win32' ? 'PowerShell' : 'Bash'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️ SIGTERM received, closing server...')
  
  // Kill all active terminals
  terminals.forEach((pty, id) => {
    console.log(`🛑 Killing terminal: ${id}`)
    pty.kill()
  })
  terminals.clear()
  
  // Close server
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\n⏹️ SIGINT received, closing server...')
  
  // Kill all active terminals
  terminals.forEach((pty, id) => {
    console.log(`🛑 Killing terminal: ${id}`)
    pty.kill()
  })
  terminals.clear()
  
  // Close server
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})
