'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { 
  Code, 
  Upload, 
  Save, 
  X,
  Plus,
  Hash,
  Globe,
  Lock,
  FileText,
  Layers,
  Clock,
  Github,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface ProjectFormData {
  title: string
  description: string
  content: string
  language: string
  framework: string
  tags: string[]
  is_public: boolean
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_time: number
  demo_url: string
  github_url: string
}

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SQL', 'Other'
]

const FRAMEWORKS = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Node.js', 'Express',
  'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', 'Rails', 'Flutter',
  'React Native', 'Electron', 'Unity', 'TensorFlow', 'PyTorch', 'Other'
]

export default function CreateProjectPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [newTag, setNewTag] = useState('')
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    content: '',
    language: '',
    framework: '',
    tags: [],
    is_public: true,
    difficulty_level: 'beginner',
    estimated_time: 30,
    demo_url: '',
    github_url: ''
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/projects/create')
        return
      }
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim() || !formData.content.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content,
          language: formData.language,
          framework: formData.framework,
          tags: formData.tags,
          is_public: formData.is_public,
          difficulty_level: formData.difficulty_level,
          estimated_time: formData.estimated_time,
          demo_url: formData.demo_url.trim(),
          github_url: formData.github_url.trim(),
          status: 'published'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Project created successfully!' })
      setTimeout(() => {
        router.push('/projects')
      }, 2000)
    } catch (error) {
      console.error('Error creating project:', error)
      setMessage({ type: 'error', text: 'Failed to create project. Please try again.' })
    }
    setSaving(false)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Share Your Project
                </h1>
                <p className="text-slate-400 mt-1">
                  Upload and share your code with the community
                </p>
              </div>
            </div>
            <Link 
              href="/projects"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 text-cyan-400 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Enter a catchy title for your project"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                  placeholder="Describe what your project does and what makes it special..."
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Language & Framework */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Primary Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value="">Select a language</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Framework/Library
                </label>
                <select
                  value={formData.framework}
                  onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value="">Select a framework</option>
                  {FRAMEWORKS.map(framework => (
                    <option key={framework} value={framework}>{framework}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Code Content */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Code className="w-5 h-5 text-cyan-400 mr-2" />
              Code Content
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Code *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={12}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none font-mono text-sm"
                placeholder="Paste your code here..."
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Hash className="w-5 h-5 text-cyan-400 mr-2" />
              Tags
            </h2>
            
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-cyan-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Add tags (e.g., react, tutorial, beginner)"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.length >= 10}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {formData.tags.length}/10 tags
              </p>
            </div>
          </div>

          {/* Project Settings */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Layers className="w-5 h-5 text-cyan-400 mr-2" />
              Project Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert'
                  }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 30 }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              {/* Demo URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Demo URL
                </label>
                <input
                  type="url"
                  value={formData.demo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, demo_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="https://your-demo.com"
                />
              </div>

              {/* GitHub URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                  <Github className="w-4 h-4 mr-1" />
                  GitHub Repository
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Visibility
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.is_public}
                    onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                    className="sr-only"
                  />
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors ${
                    formData.is_public 
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                      : 'bg-slate-800/50 border-slate-600 text-slate-400'
                  }`}>
                    <Globe className="w-5 h-5" />
                    <span>Public</span>
                  </div>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.is_public}
                    onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                    className="sr-only"
                  />
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors ${
                    !formData.is_public 
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                      : 'bg-slate-800/50 border-slate-600 text-slate-400'
                  }`}>
                    <Lock className="w-5 h-5" />
                    <span>Private</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/projects"
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
