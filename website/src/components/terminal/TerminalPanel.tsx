'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Terminal to avoid SSR issues with xterm.js
const Terminal = dynamic(() => import('./Terminal'), { ssr: false })

interface TerminalSession {
  id: string
  title: string
  createdAt: number
}

interface TerminalPanelProps {
  isOpen?: boolean
  onToggle?: () => void
}

export default function TerminalPanel({ isOpen = false, onToggle }: TerminalPanelProps) {
  const [terminals, setTerminals] = useState<TerminalSession[]>([
    { id: '1', title: 'Terminal 1', createdAt: Date.now() },
  ])
  const [activeTerminalId, setActiveTerminalId] = useState<string>('1')

  const createNewTerminal = () => {
    const newId = String(terminals.length + 1)
    const newTerminal: TerminalSession = {
      id: newId,
      title: `Terminal ${newId}`,
      createdAt: Date.now(),
    }
    setTerminals([...terminals, newTerminal])
    setActiveTerminalId(newId)
  }

  const closeTerminal = (id: string) => {
    if (terminals.length === 1) {
      // Don't close the last terminal, just clear it
      return
    }

    const newTerminals = terminals.filter((t) => t.id !== id)
    setTerminals(newTerminals)

    // If closing active terminal, switch to first available
    if (activeTerminalId === id && newTerminals.length > 0) {
      setActiveTerminalId(newTerminals[0].id)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="terminal-panel w-full h-full flex flex-col bg-[#1e1e1e] border-t border-gray-700">
      {/* Tab Bar */}
      <div className="tab-bar flex items-center bg-[#2d2d2d] border-b border-[#3e3e3e] overflow-x-auto">
        <div className="flex items-center flex-1 overflow-x-auto">
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              onClick={() => setActiveTerminalId(terminal.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-mono border-r border-[#3e3e3e]
                transition-colors whitespace-nowrap
                ${
                  activeTerminalId === terminal.id
                    ? 'bg-[#1e1e1e] text-white'
                    : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#252525] hover:text-gray-300'
                }
              `}
            >
              <span>{terminal.title}</span>
              {terminals.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTerminal(terminal.id)
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Close Terminal"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 3L3 9M3 3L9 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-2 border-l border-[#3e3e3e]">
          <button
            onClick={createNewTerminal}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#252525] rounded transition-colors"
            title="New Terminal (Ctrl+Shift+`)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3V13M3 8H13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#252525] rounded transition-colors"
              title="Close Terminal Panel"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="terminal-content flex-1 relative overflow-hidden">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className="absolute inset-0"
            style={{ display: activeTerminalId === terminal.id ? 'block' : 'none' }}
          >
            <Terminal
              id={terminal.id}
              isActive={activeTerminalId === terminal.id}
              onClose={() => closeTerminal(terminal.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
