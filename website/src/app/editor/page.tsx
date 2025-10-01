'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function EditorBridgePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const projectId = searchParams.get('project')

  useEffect(() => {
    const loadAndRedirect = async () => {
      try {
        // If no project ID, redirect to editor directly (guest mode)
        if (!projectId) {
          window.location.href = '/editor/'
          return
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        
        if (!user) {
          router.push(`/auth/login?redirect=/editor?project=${projectId}`)
          return
        }

        // Load project data from database
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) {
          console.error('Project not found, redirecting to blank editor')
          window.location.href = '/editor/'
          return
        }

        // Check access permissions
        if (projectData.user_id !== user.id && !projectData.is_public) {
          router.push('/dashboard')
          return
        }

        // Get auth token for API access
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token

        // Redirect to editor with project ID and token
        const editorUrl = new URL('/editor/', window.location.origin)
        editorUrl.searchParams.set('project', projectData.id)
        if (token) {
          editorUrl.searchParams.set('token', token)
        }
        window.location.href = editorUrl.toString()

      } catch (error) {
        console.error('Error loading project:', error)
        // Fallback to blank editor
        window.location.href = '/editor/'
      }
    }

    loadAndRedirect()
  }, [projectId, router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-lg">Loading your project...</span>
      </div>
    </div>
  )
}
