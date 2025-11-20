'use client'

import { useState } from 'react'
import { Heart, Eye, ExternalLink, Github, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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

interface ProjectCardProps {
  project: Project
  onLike?: (projectId: string, liked: boolean) => void
}

export default function ProjectCard({ project, onLike }: ProjectCardProps) {
  const [liked, setLiked] = useState(project.is_liked || false)
  const [likeCount, setLikeCount] = useState(project.like_count || 0)
  const [liking, setLiking] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (liking) return

    setLiking(true)
    try {
      const response = await fetch(`/api/community/projects/${project.id}/like`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      const newLiked = data.liked
      
      setLiked(newLiked)
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1)
      
      if (onLike) {
        onLike(project.id, newLiked)
      }
    } catch (error) {
      console.error('Error liking project:', error)
    }
    setLiking(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="group relative bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <Link href={`/projects/${project.id}`} className="block">
        <div className="relative w-full aspect-video bg-slate-800/50 overflow-hidden">
          {project.thumbnail_url ? (
            <Image
              src={project.thumbnail_url}
              alt={project.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="text-slate-600 text-6xl font-bold opacity-20">
                {project.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="flex items-center gap-3 text-white text-sm">
              {project.live_url && (
                <a
                  href={project.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600/80 backdrop-blur-sm rounded-lg hover:bg-cyan-500/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
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
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm rounded-lg hover:bg-slate-700/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="w-4 h-4" />
                  <span>Code</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link href={`/projects/${project.id}`}>
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 hover:text-cyan-400 transition-colors">
            {project.name}
          </h3>
        </Link>

        {/* Description */}
        {project.description && (
          <p className="text-slate-300 text-sm mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-slate-700/50 rounded text-slate-400 text-xs">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          {/* Author */}
          <Link
            href={`/profile/${project.profiles.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
              {project.profiles.avatar_url ? (
                <Image
                  src={project.profiles.avatar_url}
                  alt={project.profiles.full_name || project.profiles.username}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <User className="w-3 h-3" />
              )}
            </div>
            <span className="text-sm text-slate-300">
              {project.profiles.full_name || project.profiles.username}
            </span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1 transition-colors ${
                liked ? 'text-red-400' : 'hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{project.view_count || 0}</span>
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="mt-2 text-xs text-slate-500">
          {formatDate(project.created_at)}
        </div>
      </div>
    </div>
  )
}
