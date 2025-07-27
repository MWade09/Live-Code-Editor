'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectWithDetails } from '@/types'
import { 
  Search,
  Filter,
  Code,
  Heart,
  Eye,
  Clock,
  Calendar,
  Github,
  ExternalLink,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProjectFilters {
  search: string
  language: string
  framework: string
  difficulty: string
  tags: string[]
  sortBy: 'created_at' | 'likes_count' | 'views_count' | 'title'
  sortOrder: 'desc' | 'asc'
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    language: '',
    framework: '',
    difficulty: '',
    tags: [],
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const supabase = createClient()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          user_profiles!inner(id, username, full_name, avatar_url),
          project_likes(count),
          project_views(count)
        `)
        .eq('is_public', true)
        .eq('status', 'published')

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      
      if (filters.language) {
        query = query.eq('language', filters.language)
      }
      
      if (filters.framework) {
        query = query.eq('framework', filters.framework)
      }
      
      if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty)
      }

      // Sort
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

      const { data, error } = await query.limit(50)

      if (error) throw error

      // Transform data to match ProjectWithDetails type
      const transformedProjects = data?.map((project: Record<string, unknown>) => ({
        ...project,
        user_profiles: project.user_profiles,
        total_likes: Array.isArray(project.project_likes) ? project.project_likes.length : 0,
        total_views: Array.isArray(project.project_views) ? project.project_views.length : 0,
        total_comments: 0, // Will be implemented later
        is_liked: false // Will be implemented later
      })) as ProjectWithDetails[] || []

      setProjects(transformedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
    setLoading(false)
  }, [filters.search, filters.language, filters.framework, filters.difficulty, filters.sortBy, filters.sortOrder, supabase])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleLike = async (projectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id)
      } else {
        // Like
        await supabase
          .from('project_likes')
          .insert({
            project_id: projectId,
            user_id: user.id
          })
      }

      // Refresh projects to update like count
      fetchProjects()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <Code className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Community Projects
                </h1>
                <p className="text-slate-400 mt-1">
                  Discover amazing code projects from our community
                </p>
              </div>
            </div>
            <Link
              href="/projects/create"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Share Project</span>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ 
                  ...prev, 
                  sortBy: sortBy as 'created_at' | 'likes_count' | 'views_count' | 'title', 
                  sortOrder: sortOrder as 'asc' | 'desc' 
                }))
              }}
              className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors min-w-[150px]"
            >
              <option value="created_at-desc">Latest</option>
              <option value="likes_count-desc">Most Liked</option>
              <option value="views_count-desc">Most Viewed</option>
              <option value="title-asc">A-Z</option>
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Language
                  </label>
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  >
                    <option value="">All Languages</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Framework
                  </label>
                  <select
                    value={filters.framework}
                    onChange={(e) => setFilters(prev => ({ ...prev, framework: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  >
                    <option value="">All Frameworks</option>
                    {FRAMEWORKS.map(framework => (
                      <option key={framework} value={framework}>{framework}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
            <p className="text-slate-400 mb-6">
              {filters.search || filters.language || filters.framework 
                ? 'Try adjusting your filters or search terms.' 
                : 'Be the first to share a project with the community!'}
            </p>
            <Link
              href="/projects/create"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Share Your Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-cyan-500/30 transition-all group"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-lg font-semibold text-white hover:text-cyan-300 transition-colors line-clamp-2 group-hover:text-cyan-300"
                    >
                      {project.title}
                    </Link>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getDifficultyColor(project.difficulty_level)} border ml-3 whitespace-nowrap`}>
                    {project.difficulty_level}
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {project.user_profiles?.avatar_url ? (
                      <Image
                        src={project.user_profiles.avatar_url}
                        alt={project.user_profiles.full_name || project.user_profiles.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      (project.user_profiles?.full_name || project.user_profiles?.username)?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      {project.user_profiles?.full_name || project.user_profiles?.username}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(project.created_at)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{project.estimated_time}m</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.language && (
                    <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 text-xs">
                      {project.language}
                    </span>
                  )}
                  {project.framework && (
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-xs">
                      {project.framework}
                    </span>
                  )}
                  {project.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs">
                      #{tag}
                    </span>
                  ))}
                  {project.tags && project.tags.length > 2 && (
                    <span className="px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded text-slate-300 text-xs">
                      +{project.tags.length - 2}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <button
                      onClick={() => handleLike(project.id)}
                      className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{project.total_likes}</span>
                    </button>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{project.total_views}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="View Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="View Source"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/projects/${project.id}`}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300 rounded hover:from-cyan-600/30 hover:to-purple-600/30 transition-all text-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More (placeholder for pagination) */}
        {projects.length > 0 && projects.length >= 50 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors">
              Load More Projects
            </button>
          </div>
        )}
      </div>
    </div>
  )
}