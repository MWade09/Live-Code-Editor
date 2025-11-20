'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Search,
  Filter,
  Clock,
  Eye,
  Heart,
  Pin,
  Lock,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Discussion, DiscussionChannel } from '@/types/community'

type DiscussionWithDetails = Discussion & {
  channel: Pick<DiscussionChannel, 'id' | 'name' | 'slug' | 'icon' | 'color'>
  author: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }
  is_liked?: boolean
}

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<DiscussionWithDetails[]>([])
  const [channels, setChannels] = useState<DiscussionChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'active'>('active')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchChannels()
    fetchDiscussions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, sortBy])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/discussions/channels')
      const data = await response.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        limit: '20'
      })
      
      if (selectedChannel) {
        params.append('channel_id', selectedChannel)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/discussions?${params}`)
      const data = await response.json()
      setDiscussions(data.discussions || [])
    } catch (error) {
      console.error('Error fetching discussions:', error)
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Community Discussions
                </h1>
                <p className="text-slate-400 mt-1">
                  Ask questions, share knowledge, and connect with developers
                </p>
              </div>
            </div>
            <Link
              href="/community/discussions/new"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Discussion</span>
            </Link>
          </div>

          {/* Channel Tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedChannel('')}
              className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
                selectedChannel === ''
                  ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-200'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              All Channels
            </button>
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
                  selectedChannel === channel.id
                    ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
                style={{
                  borderColor: selectedChannel === channel.id ? channel.color || undefined : undefined
                }}
              >
                <span>{channel.icon}</span>
                <span>{channel.name}</span>
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchDiscussions()
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'active')}
                className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                <option value="active">Most Active</option>
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Discussions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading discussions...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No discussions found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || selectedChannel
                ? 'Try adjusting your filters or search terms.'
                : 'Be the first to start a discussion!'}
            </p>
            <Link
              href="/community/discussions/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Start a Discussion</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <Link
                key={discussion.id}
                href={`/community/discussions/${discussion.id}`}
                className="block bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-cyan-500/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {discussion.author.avatar_url ? (
                        <Image
                          src={discussion.author.avatar_url}
                          alt={discussion.author.full_name || discussion.author.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        (discussion.author.full_name || discussion.author.username)?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {discussion.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-400" />
                          )}
                          {discussion.is_locked && (
                            <Lock className="w-4 h-4 text-red-400" />
                          )}
                          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {discussion.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            {discussion.channel.icon}
                            <span style={{ color: discussion.channel.color || undefined }}>
                              {discussion.channel.name}
                            </span>
                          </span>
                          <span>•</span>
                          <span>by {discussion.author.username}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(discussion.created_at)}
                          </span>
                        </div>

                        {/* Tags */}
                        {discussion.tags && discussion.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {discussion.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                            {discussion.tags.length > 3 && (
                              <span className="px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded text-slate-300 text-xs">
                                +{discussion.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {discussion.replies_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {discussion.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {discussion.views_count}
                        </span>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>Last activity {formatDate(discussion.last_activity_at)}</span>
                      {discussion.has_accepted_answer && (
                        <>
                          <span>•</span>
                          <span className="text-green-400">✓ Answered</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
