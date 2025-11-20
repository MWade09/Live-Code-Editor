'use client'

import { Check } from 'lucide-react'

interface PlatformSelectorProps {
  selected: 'netlify' | 'vercel'
  onSelect: (platform: 'netlify' | 'vercel') => void
  netlifyConnected?: boolean
  vercelConnected?: boolean
}

export function PlatformSelector({
  selected,
  onSelect,
  netlifyConnected = false,
  vercelConnected = false,
}: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Deployment Platform
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Netlify Option */}
        <button
          onClick={() => onSelect('netlify')}
          className={`
            relative p-4 rounded-lg border-2 transition-all
            ${
              selected === 'netlify'
                ? 'border-[#00C7B7] bg-[#00C7B7]/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Netlify Logo */}
            <div className="w-12 h-12 rounded-lg bg-[#00C7B7] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="white"
              >
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.8L19.2 12 12 19.2 4.8 12 12 4.8z" />
              </svg>
            </div>

            <div className="text-center">
              <div className="font-semibold text-white">Netlify</div>
              {netlifyConnected ? (
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <Check className="w-3 h-3" />
                  Connected
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-1">Not connected</div>
              )}
            </div>
          </div>

          {selected === 'netlify' && (
            <div className="absolute top-2 right-2">
              <Check className="w-5 h-5 text-[#00C7B7]" />
            </div>
          )}
        </button>

        {/* Vercel Option */}
        <button
          onClick={() => onSelect('vercel')}
          className={`
            relative p-4 rounded-lg border-2 transition-all
            ${
              selected === 'vercel'
                ? 'border-white bg-white/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Vercel Logo */}
            <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="white"
              >
                <path d="M12 2L2 19h20L12 2z" />
              </svg>
            </div>

            <div className="text-center">
              <div className="font-semibold text-white">Vercel</div>
              {vercelConnected ? (
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <Check className="w-3 h-3" />
                  Connected
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-1">Not connected</div>
              )}
            </div>
          </div>

          {selected === 'vercel' && (
            <div className="absolute top-2 right-2">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Connection Warning */}
      {selected === 'netlify' && !netlifyConnected && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300">
          ⚠️ You need to connect your Netlify account first. Visit Settings to add
          your API token.
        </div>
      )}

      {selected === 'vercel' && !vercelConnected && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300">
          ⚠️ You need to connect your Vercel account first. Visit Settings to add
          your API token.
        </div>
      )}
    </div>
  )
}
