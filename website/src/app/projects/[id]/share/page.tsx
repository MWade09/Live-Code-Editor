'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Share, 
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  Link as LinkIcon,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  ExternalLink,
  Settings,
  Eye,
  Heart,
  Calendar,
  X
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Project {
  id: string
  title: string
  description: string
  language: string
  framework: string
  tags: string[]
  is_public: boolean
  status: string
  created_at: string
  updated_at: string
  views_count: number
  likes_count: number
  demo_url?: string
  github_url?: string
  user_id: string
}

export default function ShareProjectPage() {
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)

  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const supabase = createClient()

  const fetchProject = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      if (!data) {
        router.push('/projects')
        return
      }
      
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      router.push('/projects')
    }
    setLoading(false)
  }, [supabase, projectId, router])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/projects')
        return
      }
      await fetchProject(user.id)
    }
    getUser()
  }, [supabase, router, projectId, fetchProject])

  const toggleVisibility = async () => {
    if (!project) return

    setUpdatingVisibility(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_public: !project.is_public })
        .eq('id', project.id)

      if (error) throw error
      
      setProject(prev => prev ? { ...prev, is_public: !prev.is_public } : null)
    } catch (error) {
      console.error('Error updating project visibility:', error)
    }
    setUpdatingVisibility(false)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getShareUrl = () => {
    return `${window.location.origin}/projects/${project?.id}`
  }

  const getEmbedCode = () => {
    return `<iframe src="${getShareUrl()}/embed" width="100%" height="600" frameborder="0"></iframe>`
  }

  const shareToSocial = (platform: string) => {
    if (!project) return

    const url = getShareUrl()
    const text = `Check out my project: ${project.title}`
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }

    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Project not found</h3>
            <Link href="/projects" className="text-cyan-400 hover:text-cyan-300">
              Back to Projects
            </Link>
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
                <Share className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Share Project
                </h1>
                <p className="text-slate-400 mt-1">
                  Share your project with the world
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

        {/* Project Info */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">{project.title}</h2>
              <p className="text-slate-400 mb-4">{project.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{project.views_count || 0} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{project.likes_count || 0} likes</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-300 font-medium">{project.language}</span>
                {project.framework && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-sm text-slate-400">{project.framework}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                project.is_public
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {project.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {project.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>

          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Visibility Settings */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 text-cyan-400 mr-2" />
            Privacy Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <h4 className="text-white font-medium">Project Visibility</h4>
                <p className="text-slate-400 text-sm">
                  {project.is_public 
                    ? 'Your project is visible to everyone and can be shared publicly'
                    : 'Your project is private and only visible to you'
                  }
                </p>
              </div>
              <button
                onClick={toggleVisibility}
                disabled={updatingVisibility}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  project.is_public
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {updatingVisibility ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {project.is_public ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    <span>Make {project.is_public ? 'Private' : 'Public'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Share Options */}
        {project.is_public && (
          <div className="space-y-8">
            {/* Share Links */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <LinkIcon className="w-5 h-5 text-cyan-400 mr-2" />
                Share Links
              </h3>
              
              <div className="space-y-4">
                {/* Project URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={getShareUrl()}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(getShareUrl(), 'url')}
                      className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all flex items-center space-x-2"
                    >
                      {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied === 'url' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Embed Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Embed Code
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={getEmbedCode()}
                      readOnly
                      rows={3}
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white font-mono text-sm resize-none"
                    />
                    <button
                      onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
                      className="px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all flex items-center space-x-2"
                    >
                      {copied === 'embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied === 'embed' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 text-cyan-400 mr-2" />
                Social Media
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="flex items-center justify-center space-x-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span>Share on Twitter</span>
                </button>
                
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex items-center justify-center space-x-3 p-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Share on Facebook</span>
                </button>
                
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="flex items-center justify-center space-x-3 p-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>Share on LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Additional Links */}
            {(project.demo_url || project.github_url) && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Additional Links</h3>
                
                <div className="space-y-3">
                  {project.demo_url && (
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ExternalLink className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-white font-medium">Live Demo</p>
                          <p className="text-slate-400 text-sm">{project.demo_url}</p>
                        </div>
                      </div>
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all text-sm"
                      >
                        Visit
                      </a>
                    </div>
                  )}
                  
                  {project.github_url && (
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Github className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-white font-medium">Source Code</p>
                          <p className="text-slate-400 text-sm">{project.github_url}</p>
                        </div>
                      </div>
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all text-sm"
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Private Project Message */}
        {!project.is_public && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="text-center py-8">
              <Lock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Project is Private</h3>
              <p className="text-slate-400 mb-6">
                Make your project public to share it with others and access sharing options.
              </p>
              <button
                onClick={toggleVisibility}
                disabled={updatingVisibility}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-medium rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                {updatingVisibility ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Globe className="w-5 h-5" />
                )}
                <span>Make Public</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
