'use client'

import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface EnvironmentVarsProps {
  vars: { [key: string]: string }
  onChange: (vars: { [key: string]: string }) => void
}

export function EnvironmentVars({ vars, onChange }: EnvironmentVarsProps) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const entries = Object.entries(vars)

  const addVariable = () => {
    if (!newKey.trim()) return

    onChange({
      ...vars,
      [newKey.trim()]: newValue.trim(),
    })

    setNewKey('')
    setNewValue('')
  }

  const removeVariable = (key: string) => {
    const updated = { ...vars }
    delete updated[key]
    onChange(updated)
  }

  const updateVariable = (oldKey: string, newKey: string, newValue: string) => {
    if (oldKey === newKey) {
      onChange({
        ...vars,
        [oldKey]: newValue,
      })
    } else {
      const updated = { ...vars }
      delete updated[oldKey]
      updated[newKey] = newValue
      onChange(updated)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addVariable()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          Environment Variables
        </label>
        <span className="text-xs text-slate-500">Optional</span>
      </div>

      {/* Existing variables */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <input
                type="text"
                value={key}
                onChange={(e) => updateVariable(key, e.target.value, value)}
                className="flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                placeholder="KEY"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => updateVariable(key, key, e.target.value)}
                className="flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
                placeholder="value"
              />
              <button
                onClick={() => removeVariable(key)}
                className="text-slate-400 hover:text-red-400 transition-colors p-2"
                title="Remove variable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new variable */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
          placeholder="KEY"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
          placeholder="value"
        />
        <button
          onClick={addVariable}
          disabled={!newKey.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add variable"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Add environment variables that will be available during your deployment.
      </p>
    </div>
  )
}
