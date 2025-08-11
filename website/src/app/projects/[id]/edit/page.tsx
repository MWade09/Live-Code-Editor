'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

type Visibility = 'public' | 'private'

interface ProjectFormState {
  title: string
  description: string
  is_public: boolean
  content: string
  language: string
  framework: string
  tags: string
  difficulty_level: string
  estimated_time: number | ''
  demo_url: string
  github_url: string
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProjectFormState>({
    title: '',
    description: '',
    is_public: true,
    content: '',
    language: 'JavaScript',
    framework: '',
    tags: '',
    difficulty_level: 'beginner',
    estimated_time: '',
    demo_url: '',
    github_url: ''
  })

  const backHref = useMemo(() => (searchParams.get('from') === 'my-projects' ? '/my-projects' : `/projects/${params.id}`), [searchParams, params.id])

  useEffect(() => {
    const load = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user
        if (!user) {
          router.push('/auth/login')
          return
        }
        const { data, error: err } = await supabase
          .from('projects')
          .select('*')
          .eq('id', params.id)
          .single()
        if (err || !data) throw err || new Error('Project not found')
        if (data.user_id !== user.id) {
          router.push('/dashboard')
          return
        }
        setForm({
          title: data.title || '',
          description: data.description || '',
          is_public: !!data.is_public,
          content: data.content || '',
          language: data.language || 'JavaScript',
          framework: data.framework || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
          difficulty_level: data.difficulty_level || 'beginner',
          estimated_time: typeof data.estimated_time === 'number' ? data.estimated_time : '',
          demo_url: data.demo_url || '',
          github_url: data.github_url || ''
        })
      } catch (e) {
        console.error(e)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, checked } = e.target as HTMLInputElement
    if (name === 'is_public') {
      setForm(prev => ({ ...prev, is_public: checked }))
      return
    }
    if (name === 'estimated_time') {
      const num = value === '' ? '' : Number(value)
      setForm(prev => ({ ...prev, estimated_time: Number.isNaN(num) ? '' : num }))
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const payload = {
        title: form.title,
        description: form.description,
        is_public: form.is_public,
        content: form.content,
        language: form.language,
        framework: form.framework,
        tags: form.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        difficulty_level: form.difficulty_level,
        estimated_time: form.estimated_time === '' ? null : form.estimated_time,
        demo_url: form.demo_url,
        github_url: form.github_url
      }
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Failed with status ${res.status}`)
      }
      router.push(`/projects/${params.id}${searchParams.get('from') ? `?from=${searchParams.get('from')}` : ''}`)
    } catch (e) {
      console.error('Save failed:', e)
      setError('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={backHref} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Visibility (Publish to Community)</label>
              <select name="is_public" value={form.is_public ? 'public' : 'private'} onChange={(e) => setForm(prev => ({ ...prev, is_public: (e.target.value as Visibility) === 'public' }))} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">Public projects appear in Community and can be shared externally. Private projects are only visible to you.</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Language</label>
              <input name="language" value={form.language} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Framework</label>
              <input name="framework" value={form.framework} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Estimated Time (min)</label>
              <input name="estimated_time" value={form.estimated_time} onChange={handleChange} type="number" className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Difficulty</label>
            <select name="difficulty_level" value={form.difficulty_level} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Demo URL</label>
            <input name="demo_url" value={form.demo_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">GitHub URL</label>
            <input name="github_url" value={form.github_url} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Content</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows={12} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white font-mono" />
          </div>
        </div>
      </div>
    </div>
  )
}


