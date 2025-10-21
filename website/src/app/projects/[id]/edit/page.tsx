'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // Redirect to the full editor with the project loaded
    const projectId = params.id
    if (projectId) {
      // Use window.location to go to the standalone editor
      window.location.href = `/editor?project=${projectId}`
    } else {
      // If no project ID, go back to dashboard
      router.push('/dashboard')
    }
  }, [params.id, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
        <p className="text-slate-400">Opening project in Live Editor...</p>
      </div>
    </div>
  )
}




