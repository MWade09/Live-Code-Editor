'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft,
  Heart,
  Eye,
  MessageSquare,
  Clock,
  Pin,
  Lock,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Send,
  MoreVertical,
  Check,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Discussion, DiscussionChannel, DiscussionReply } from '@/types/community'

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
  is_subscribed?: boolean
}

type ReplyWithAuthor = DiscussionReply & {
  author: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }
  replies?: ReplyWithAuthor[]
  is_liked?: boolean
}

export default function DiscussionDetailPage() {
  const [discussion, setDiscussion] = useState<DiscussionWithDetails | null>(null)
  const [replies, setReplies] = useState<ReplyWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
    fetchDiscussion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user ? { id: user.id } : null)
  }

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/discussions/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/community/discussions')
        }
        throw new Error('Failed to fetch discussion')
      }

      const data = await response.json()
      setDiscussion(data.discussion)
      setReplies(data.replies || [])
    } catch (error) {
      console.error('Error fetching discussion:', error)
    }
    setLoading(false)
  }

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`/api/discussions/${params.id}/like`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      
      setDiscussion(prev => prev ? {
        ...prev,
        is_liked: data.liked,
        likes_count: prev.likes_count + (data.liked ? 1 : -1)
      } : null)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSubscribe = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`/api/discussions/${params.id}/subscribe`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to toggle subscription')

      const data = await response.json()
      
      setDiscussion(prev => prev ? {
        ...prev,
        is_subscribed: data.subscribed
      } : null)
    } catch (error) {
      console.error('Error toggling subscription:', error)
    }
  }

  const handlePostReply = async () => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    if (!replyContent.trim()) return

    setPosting(true)
    try {
      const response = await fetch(`/api/discussions/${params.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parent_id: replyingTo
        })
      })

      if (!response.ok) throw new Error('Failed to post reply')

      const data = await response.json()
      
      // Add new reply to the list
      if (replyingTo) {
        // Nested reply - need to refresh to show proper nesting
        fetchDiscussion()
      } else {
        setReplies(prev => [...prev, data.reply])
      }

      setReplyContent('')
      setReplyingTo(null)

      // Update reply count
      setDiscussion(prev => prev ? {
        ...prev,
        replies_count: prev.replies_count + 1
      } : null)
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Failed to post reply. Please try again.')
    }
    setPosting(false)
  }

  const handleDeleteDiscussion = async () => {
    if (!confirm('Delete this discussion? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/discussions/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete discussion')

      router.push('/community/discussions')
    } catch (error) {
      console.error('Error deleting discussion:', error)
      alert('Failed to delete discussion. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
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

  const renderReply = (reply: ReplyWithAuthor, depth: number = 0) => {
    const isAuthor = currentUser?.id === reply.author_id
    const maxDepth = 3

    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-12' : ''} mb-4`}>
        <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {reply.author.avatar_url ? (
                  <Image
                    src={reply.author.avatar_url}
                    alt={reply.author.full_name || reply.author.username}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  (reply.author.full_name || reply.author.username)?.charAt(0)?.toUpperCase()
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {reply.author.full_name || reply.author.username}
                  </span>
                  {reply.author.role !== 'user' && (
                    <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs">
                      {reply.author.role}
                    </span>
                  )}
                  {reply.is_accepted_answer && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-xs">
                      <Check className="w-3 h-3" />
                      Accepted Answer
                    </span>
                  )}
                  <span className="text-sm text-slate-400">
                    {formatRelativeTime(reply.created_at)}
                  </span>
                  {reply.is_edited && (
                    <span className="text-xs text-slate-500">(edited)</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isAuthor && (
                    <button
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-slate-200 whitespace-pre-wrap mb-3">
                {reply.content}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <button className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>{reply.likes_count || 0}</span>
                </button>

                {depth < maxDepth && (
                  <button
                    onClick={() => setReplyingTo(reply.id)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nested replies */}
        {reply.replies && reply.replies.length > 0 && (
          <div className="mt-2">
            {reply.replies.map(nestedReply => renderReply(nestedReply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading discussion...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Discussion not found</h3>
            <p className="text-slate-400 mb-6">The discussion you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link
              href="/community/discussions"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Discussions</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isAuthor = currentUser?.id === discussion.author_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/community/discussions"
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Discussions</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubscribe}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                discussion.is_subscribed
                  ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
              title={discussion.is_subscribed ? 'Unsubscribe from notifications' : 'Subscribe to notifications'}
            >
              {discussion.is_subscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {discussion.is_subscribed ? 'Unsubscribe' : 'Subscribe'}
              </span>
            </button>

            {isAuthor && (
              <>
                <Link
                  href={`/community/discussions/${discussion.id}/edit`}
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Edit discussion"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDeleteDiscussion}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete discussion"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}


          </div>
        </div>

        {/* Discussion Content */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 mb-6">
          {/* Channel and Status Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${discussion.channel.color || '#6366f1'}20`,
                borderColor: `${discussion.channel.color || '#6366f1'}40`,
                color: discussion.channel.color || '#6366f1'
              }}
            >
              <span>{discussion.channel.icon}</span>
              <span>{discussion.channel.name}</span>
            </span>

            {discussion.is_pinned && (
              <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}

            {discussion.is_locked && (
              <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-sm">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}

            {discussion.has_accepted_answer && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm">
                <Check className="w-3 h-3" />
                Answered
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">{discussion.title}</h1>

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {discussion.author.avatar_url ? (
                <Image
                  src={discussion.author.avatar_url}
                  alt={discussion.author.full_name || discussion.author.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                (discussion.author.full_name || discussion.author.username)?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${discussion.author.username}`}
                  className="font-semibold text-white hover:text-cyan-300 transition-colors"
                >
                  {discussion.author.full_name || discussion.author.username}
                </Link>
                {discussion.author.role !== 'user' && (
                  <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs">
                    {discussion.author.role}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(discussion.created_at)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(discussion.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-6">
            <div className="text-slate-200 whitespace-pre-wrap text-lg leading-relaxed">
              {discussion.content}
            </div>
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {discussion.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {discussion.replies_count} {discussion.replies_count === 1 ? 'reply' : 'replies'}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {discussion.views_count} {discussion.views_count === 1 ? 'view' : 'views'}
              </span>
            </div>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                discussion.is_liked
                  ? 'bg-red-600/20 border-red-500/40 text-red-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-500/30'
              }`}
            >
              <Heart className={`w-5 h-5 ${discussion.is_liked ? 'fill-current' : ''}`} />
              <span>{discussion.likes_count}</span>
            </button>
          </div>
        </div>

        {/* Replies Section */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            {discussion.replies_count} {discussion.replies_count === 1 ? 'Reply' : 'Replies'}
          </h2>

          {/* Reply Form */}
          {currentUser && !discussion.is_locked && (
            <div className="mb-8">
              {replyingTo && (
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                  <span>Replying to comment</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                />
                <button
                  onClick={handlePostReply}
                  disabled={posting || !replyContent.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {posting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="hidden sm:inline">Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {discussion.is_locked && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-center">
              <Lock className="w-5 h-5 mx-auto mb-2" />
              This discussion is locked. Only moderators can post replies.
            </div>
          )}

          {!currentUser && (
            <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
              <p className="text-slate-300 mb-3">Join the conversation!</p>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
              >
                Sign in to reply
              </Link>
            </div>
          )}

          {/* Replies List */}
          {replies.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {replies.map(reply => renderReply(reply))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
