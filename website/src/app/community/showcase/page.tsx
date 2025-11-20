'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, TrendingUp, Clock, Heart } from 'lucide-react'
import ProjectCard from '@/components/community/ProjectCard'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  live_url: string | null
  github_url: string | null
  tags: string[] | null
  view_count: number
  like_count: number
  created_at: string
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  is_liked?: boolean
}

const POPULAR_TAGS = [
  'react',
  'nextjs',
  'typescript',
  'ai',
  'game',
  'animation',
  'tool',
  'ui',
  'api',
  'fullstack'
]

export default function ShowcasePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'trending' | 'new' | 'popular'>('trending')

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTag, sortBy])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTag) params.append('tag', selectedTag)
      params.append('sort', sortBy)

      const response = await fetch(`/api/community/projects?${params}`)
      if (!response.ok) throw new Error('Failed to fetch projects')

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
    setLoading(false)
  }

  const handleLike = (projectId: string, liked: boolean) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, is_liked: liked, like_count: p.like_count + (liked ? 1 : -1) }
          : p
      )
    )
  }

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const sortOptions = [
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'new', label: 'Latest', icon: Clock },
    { value: 'popular', label: 'Most Liked', icon: Heart }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Project Showcase
                </span>
              </h1>
              <p className="text-slate-400">
                Discover amazing projects built by our community
              </p>
            </div>

            <Link
              href="/projects"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Showcase Your Project</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects, tags, or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 sm:w-auto">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedTag === null
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              All Projects
            </button>
            {POPULAR_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading amazing projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
              <p className="text-slate-400 mb-6">
                {searchQuery || selectedTag
                  ? 'Try adjusting your filters or search query'
                  : 'Be the first to showcase your project!'}
              </p>
              <Link
                href="/projects"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Showcase Your Project</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-slate-400">
              Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
              {selectedTag && <span> with tag <span className="text-purple-400">#{selectedTag}</span></span>}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
