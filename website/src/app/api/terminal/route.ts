import { Server as SocketIOServer } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'

// Store active terminal sessions
const terminals = new Map<string, ChildProcess>()

// Socket.io server singleton
let io: SocketIOServer | null = null

export async function GET() {
  // Initialize Socket.io server if not already done
  if (!io) {
    // Get the HTTP server from Next.js
    const httpServer = (global as Record<string, unknown>).httpServer
    
    if (!httpServer) {
      return new Response('WebSocket server not initialized', { status: 500 })
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/terminal/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
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
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
        const shellArgs = process.platform === 'win32' ? ['-NoLogo', '-NoProfile'] : []

        // Spawn shell process
        const pty = spawn(shell, shellArgs, {
          cwd,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
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
        socket.emit('created', { id })
      })

      // Handle input from client
      socket.on('input', (data: { id: string, input: string }) => {
        const { id, input } = data
        const pty = terminals.get(id)

        if (pty && pty.stdin) {
          pty.stdin.write(input)
        } else {
          console.warn(`⚠️ Terminal ${id} not found or stdin not available`)
        }
      })

      // Handle terminal resize (for proper line wrapping)
      socket.on('resize', (data: { id: string, cols: number, rows: number }) => {
        const { id } = data
        // child_process doesn't support resize, but we can handle it in the future with node-pty
        console.log(`📐 Terminal ${id} resize request:`, data.cols, 'x', data.rows)
      })

      // Handle terminal destruction
      socket.on('destroy-terminal', (data: { id: string }) => {
        const { id } = data
        const pty = terminals.get(id)

        if (pty) {
          console.log(`🗑️ Destroying terminal: ${id}`)
          pty.kill()
          terminals.delete(id)
        }
      })

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        console.log('🔌 Terminal client disconnected:', socket.id)
        
        // Kill all terminals for this socket
        terminals.forEach((pty, id) => {
          console.log(`🧹 Cleaning up terminal: ${id}`)
          pty.kill()
          terminals.delete(id)
        })
      })
    })

    console.log('✅ Socket.io server initialized for terminal')
  }

  return new Response('WebSocket server running', { status: 200 })
}

// Export POST handler for Socket.io handshake
export async function POST() {
  return GET()
}
