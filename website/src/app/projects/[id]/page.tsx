'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectWithDetails } from '@/types'
import { User } from '@supabase/supabase-js'
import { 
  ArrowLeft,
  Heart,
  Eye,
  Clock,
  Calendar,
  Github,
  ExternalLink,
  Share2,
  Copy,
  MessageCircle,
  Flag,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ProjectDetailPage() {
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [copying, setCopying] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!inner(id, username, full_name, avatar_url),
          project_likes(count),
          project_views(count)
        `)
        .eq('id', params.id)
        .eq('is_public', true)
        .single()

      if (error) throw error

      const transformedProject: ProjectWithDetails = {
        ...data,
        user_profiles: data.user_profiles,
        total_likes: Array.isArray(data.project_likes) ? data.project_likes.length : 0,
        total_views: Array.isArray(data.project_views) ? data.project_views.length : 0,
        total_comments: 0, // Will be implemented later
        is_liked: false
      }

      setProject(transformedProject)
      
      // Check if current user liked this project
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: like } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', params.id)
          .eq('user_id', user.id)
          .single()
        
        setIsLiked(!!like)
      }
    } catch (error: unknown) {
      console.error('Error fetching project:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        router.push('/404')
      }
    }
    setLoading(false)
  }

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const incrementViewCount = async () => {
    if (!currentUser) return
    
    try {
      // Check if user has already viewed this project
      const { data: existingView } = await supabase
        .from('project_views')
        .select('id')
        .eq('project_id', params.id)
        .eq('user_id', currentUser.id)
        .single()

      if (!existingView) {
        await supabase
          .from('project_views')
          .insert({
            project_id: params.id as string,
            user_id: currentUser.id
          })
      }
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchProject()
      checkCurrentUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (currentUser && params.id) {
      incrementViewCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, params.id])

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', params.id)
          .eq('user_id', currentUser.id)
        
        setIsLiked(false)
        if (project) {
          setProject({
            ...project,
            total_likes: project.total_likes - 1
          })
        }
      } else {
        // Like
        await supabase
          .from('project_likes')
          .insert({
            project_id: params.id as string,
            user_id: currentUser.id
          })
        
        setIsLiked(true)
        if (project) {
          setProject({
            ...project,
            total_likes: project.total_likes + 1
          })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const copyCode = async () => {
    if (!project?.content) return
    
    setCopying(true)
    try {
      await navigator.clipboard.writeText(project.content as string)
      setTimeout(() => setCopying(false), 2000)
    } catch (error) {
      console.error('Error copying code:', error)
      setCopying(false)
    }
  }

  const shareProject = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.description || 'Check out this awesome project!',
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Error copying URL:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400'
      case 'intermediate': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400'
      case 'advanced': return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400'
      case 'expert': return 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400'
      default: return 'from-slate-500/20 to-gray-500/20 border-slate-500/30 text-slate-400'
    }
  }

  const getLanguageForHighlighter = (language: string) => {
    const langMap: Record<string, string> = {
      'JavaScript': 'javascript',
      'TypeScript': 'typescript',
      'Python': 'python',
      'Java': 'java',
      'C++': 'cpp',
      'C#': 'csharp',
      'Go': 'go',
      'Rust': 'rust',
      'PHP': 'php',
      'Ruby': 'ruby',
      'Swift': 'swift',
      'Kotlin': 'kotlin',
      'Dart': 'dart',
      'HTML': 'html',
      'CSS': 'css',
      'SQL': 'sql'
    }
    
    return langMap[language] || 'text'
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
            <h2 className="text-2xl font-bold text-white mb-2">Project not found</h2>
            <p className="text-slate-400 mb-6">The project you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link
              href="/projects"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = currentUser && project.user_id === currentUser.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/projects"
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Projects</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={shareProject}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Share Project"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {isOwner && (
              <>
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                  title="Edit Project"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            {!isOwner && (
              <button
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Report Project"
              >
                <Flag className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
                <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getDifficultyColor(project.difficulty_level)} border`}>
                  {project.difficulty_level}
                </div>
              </div>
              
              {project.description && (
                <p className="text-slate-300 text-lg mb-6">{project.description}</p>
              )}

              {/* Author */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {project.user_profiles?.avatar_url ? (
                    <Image
                      src={project.user_profiles.avatar_url}
                      alt={project.user_profiles.full_name || project.user_profiles.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    (project.user_profiles?.full_name || project.user_profiles?.username)?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div>
                  <Link
                    href={`/profile/${project.user_profiles?.username}`}
                    className="text-lg font-semibold text-white hover:text-cyan-300 transition-colors"
                  >
                    {project.user_profiles?.full_name || project.user_profiles?.username}
                  </Link>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.created_at)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{project.estimated_time} min</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-3 mb-6">
                {project.language && (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium">
                    {project.language}
                  </span>
                )}
                {project.framework && (
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium">
                    {project.framework}
                  </span>
                )}
                {project.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Links */}
              <div className="flex items-center space-x-4">
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:from-cyan-600/30 hover:to-purple-600/30 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Live Demo</span>
                  </a>
                )}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 border border-slate-600 text-slate-300 rounded-lg hover:text-white hover:border-slate-500 transition-all"
                  >
                    <Github className="w-4 h-4" />
                    <span>Source Code</span>
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="lg:w-48">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4">
                <h3 className="text-white font-semibold mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLike}
                        className={`flex items-center space-x-1 transition-colors ${
                          isLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span>Likes</span>
                      </button>
                    </div>
                    <span className="text-white font-medium">{project.total_likes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span>Views</span>
                    </div>
                    <span className="text-white font-medium">{project.total_views}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>Comments</span>
                    </div>
                    <span className="text-white font-medium">{project.total_comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Source Code</h2>
            <button
              onClick={copyCode}
              className="flex items-center space-x-2 px-3 py-1 bg-slate-800/50 border border-slate-600 text-slate-300 rounded hover:text-white hover:border-slate-500 transition-all"
            >
              {copying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          
          <div className="relative">
            <SyntaxHighlighter
              language={getLanguageForHighlighter(project.language)}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                background: 'transparent',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              showLineNumbers
              wrapLines
            >
              {project.content as string}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Comments Section (Placeholder) */}
        <div className="mt-8 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 text-cyan-400 mr-2" />
            Comments ({project.total_comments})
          </h3>
          <div className="text-center py-8 text-slate-400">
            <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p>Comments feature coming soon!</p>
            <p className="text-sm">Users will be able to discuss and provide feedback on projects.</p>
          </div>
        </div>
      </div>
    </div>
  )
}