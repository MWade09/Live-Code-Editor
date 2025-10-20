'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  AlertTriangle,
  Loader2,
  Settings as SettingsIcon,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProjectSettings {
  title: string
  description: string
  language: string
  framework: string
  tags: string[]
  is_public: boolean
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_time: number
  demo_url: string
  github_url: string
  thumbnail_url: string | null
}

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  
  const [settings, setSettings] = useState<ProjectSettings>({
    title: '',
    description: '',
    language: '',
    framework: '',
    tags: [],
    is_public: false,
    difficulty_level: 'beginner',
    estimated_time: 30,
    demo_url: '',
    github_url: '',
    thumbnail_url: null
  })

  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error || !data) throw error || new Error('Project not found')
        if (data.user_id !== user.id) {
          router.push('/dashboard')
          return
        }

        setSettings({
          title: data.title || '',
          description: data.description || '',
          language: data.language || 'JavaScript',
          framework: data.framework || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          is_public: data.is_public || false,
          difficulty_level: data.difficulty_level || 'beginner',
          estimated_time: data.estimated_time || 30,
          demo_url: data.demo_url || '',
          github_url: data.github_url || '',
          thumbnail_url: data.thumbnail_url || null
        })
      } catch (err) {
        console.error('Error loading project:', err)
        setMessage({ type: 'error', text: 'Failed to load project settings' })
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [params.id, router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: settings.title.trim(),
          description: settings.description.trim(),
          language: settings.language,
          framework: settings.framework,
          tags: settings.tags,
          is_public: settings.is_public,
          difficulty_level: settings.difficulty_level,
          estimated_time: settings.estimated_time,
          demo_url: settings.demo_url.trim(),
          github_url: settings.github_url.trim(),
          status: settings.is_public ? 'published' : 'draft',
          published_at: settings.is_public ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' })
      return
    }

    setDeleting(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/my-projects')
    } catch (err) {
      console.error('Error deleting project:', err)
      setMessage({ type: 'error', text: 'Failed to delete project. Please try again.' })
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    setUploadingThumbnail(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete old thumbnail if exists
      if (settings.thumbnail_url) {
        const oldPath = settings.thumbnail_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('user-uploads')
            .remove([`project-thumbnails/${oldPath}`])
        }
      }

      // Upload new thumbnail
      const fileExt = file.name.split('.').pop()
      const fileName = `${params.id}-${Date.now()}.${fileExt}`
      const filePath = `project-thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      const thumbnailUrl = urlData.publicUrl

      // Update database
      const { error: dbError } = await supabase
        .from('projects')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', params.id)

      if (dbError) throw dbError

      setSettings(prev => ({ ...prev, thumbnail_url: thumbnailUrl }))
      setMessage({ type: 'success', text: 'Thumbnail uploaded successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Error uploading thumbnail:', err)
      setMessage({ type: 'error', text: 'Failed to upload thumbnail. Please try again.' })
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleRemoveThumbnail = async () => {
    if (!settings.thumbnail_url) return

    setUploadingThumbnail(true)
    setMessage(null)

    try {
      // Delete from storage
      const filePath = settings.thumbnail_url.split('/').pop()
      if (filePath) {
        await supabase.storage
          .from('user-uploads')
          .remove([`project-thumbnails/${filePath}`])
      }

      // Update database
      const { error } = await supabase
        .from('projects')
        .update({ thumbnail_url: null })
        .eq('id', params.id)

      if (error) throw error

      setSettings(prev => ({ ...prev, thumbnail_url: null }))
      setMessage({ type: 'success', text: 'Thumbnail removed successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Error removing thumbnail:', err)
      setMessage({ type: 'error', text: 'Failed to remove thumbnail. Please try again.' })
    } finally {
      setUploadingThumbnail(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Link
              href={`/projects/${params.id}`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
              <SettingsIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Project Settings</h1>
              <p className="text-slate-400 text-sm">Manage your project configuration</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                  placeholder="Describe your project"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Language
                  </label>
                  <input
                    type="text"
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Framework
                  </label>
                  <input
                    type="text"
                    value={settings.framework}
                    onChange={(e) => setSettings(prev => ({ ...prev, framework: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Metadata */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Metadata</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={settings.difficulty_level}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert'
                  }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={settings.estimated_time}
                  onChange={(e) => setSettings(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 30 }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Demo URL
                </label>
                <input
                  type="url"
                  value={settings.demo_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, demo_url: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="https://demo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={settings.github_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, github_url: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="https://github.com/user/repo"
                />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Visibility</h2>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_public"
                checked={settings.is_public}
                onChange={(e) => setSettings(prev => ({ ...prev, is_public: e.target.checked }))}
                className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
              />
              <label htmlFor="is_public" className="text-sm text-slate-300">
                Make this project public (visible in community)
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-7">
              Public projects can be viewed by anyone and appear in the community page. Private projects are only visible to you.
            </p>
          </div>

          {/* Thumbnail */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Thumbnail</h2>
            
            {settings.thumbnail_url ? (
              <div className="flex items-center gap-4">
                <Image 
                  src={settings.thumbnail_url} 
                  alt="Project thumbnail" 
                  width={200}
                  height={120}
                  className="rounded-lg border border-slate-600 object-cover"
                />
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="thumbnail-upload"
                    className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    {uploadingThumbnail ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Change Thumbnail'
                    )}
                  </label>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                    className="hidden"
                  />
                  <button 
                    onClick={handleRemoveThumbnail}
                    disabled={uploadingThumbnail}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Remove Thumbnail
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-3">No thumbnail uploaded</p>
                <label
                  htmlFor="thumbnail-upload"
                  className="inline-block px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {uploadingThumbnail ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload Thumbnail'
                  )}
                </label>
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploadingThumbnail}
                  className="hidden"
                />
                <p className="text-xs text-slate-500 mt-2">Max size: 5MB • Formats: JPG, PNG, GIF, WebP</p>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
            </div>
            
            <p className="text-sm text-slate-300 mb-4">
              Once you delete this project, there is no going back. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-400 font-medium">
                  Type <span className="font-mono bg-red-500/10 px-2 py-1 rounded">DELETE</span> to confirm deletion
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-red-500/30 rounded-lg text-white placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Type DELETE"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirmText !== 'DELETE'}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Project Permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link
              href={`/projects/${params.id}`}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
