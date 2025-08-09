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
  const isTry = searchParams.get('try') === '1'

  useEffect(() => {
    const loadAndRedirect = async () => {
      try {
        // If no project ID or explicit try mode, redirect to standalone editor (guest mode)
        if (!projectId || isTry) {
          window.location.href = 'https://ai-assisted-editor.netlify.app'
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
          window.location.href = 'https://ai-assisted-editor.netlify.app'
          return
        }

        // Check access permissions
        if (projectData.user_id !== user.id && !projectData.is_public) {
          router.push('/dashboard')
          return
        }

        // Prepare project data for your existing editor
        const editorData = {
          projectId: projectData.id,
          title: projectData.title,
          description: projectData.description,
          language: projectData.language,
          framework: projectData.framework,
          code: projectData.content?.code || projectData.content || '',
          tags: projectData.tags,
          isOwner: projectData.user_id === user.id,
          websiteReturn: true // Flag to show "back to website" button
        }

        // Pass data to your existing editor via localStorage
        localStorage.setItem('liveEditorProject', JSON.stringify(editorData))
        
        // Redirect to your existing, beautiful editor
        window.location.href = 'https://ai-assisted-editor.netlify.app'

      } catch (error) {
        console.error('Error loading project:', error)
        // Fallback to standalone editor
        window.location.href = 'https://ai-assisted-editor.netlify.app'
      }
    }

    loadAndRedirect()
  }, [projectId, router, supabase, isTry])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-lg">Loading your project in LiveEditor...</span>
      </div>
    </div>
  )
}
