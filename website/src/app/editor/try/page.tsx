'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function EditorTryPage() {
  useEffect(() => {
    // Redirect to hosted editor in guest mode
    // Append a hint so the editor can show a guest banner if needed
    const url = new URL('https://ai-assisted-editor.netlify.app')
    url.searchParams.set('guest', '1')
    window.location.href = url.toString()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      <div className="flex items-center gap-3 text-slate-300">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Opening the editor…</span>
      </div>
    </div>
  )
}


