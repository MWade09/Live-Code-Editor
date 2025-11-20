'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft,
  MessageSquare,
  Hash,
  Eye,
  Send,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import type { DiscussionChannel } from '@/types/community'

export default function NewDiscussionPage() {
  const [channels, setChannels] = useState<DiscussionChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Form state
  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchChannels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setCurrentUser({ id: user.id })
  }

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/discussions/channels')
      if (!response.ok) throw new Error('Failed to fetch channels')
      
      const data = await response.json()
      setChannels(data.channels || [])
      
      // Set default channel to General if available
      const generalChannel = data.channels?.find((c: DiscussionChannel) => c.slug === 'general')
      if (generalChannel) {
        setChannelId(generalChannel.id)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
    setLoading(false)
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!channelId) {
      newErrors.channel = 'Please select a channel'
    }

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters'
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required'
    } else if (content.trim().length < 20) {
      newErrors.content = 'Content must be at least 20 characters'
    }

    if (tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
      
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag])
        setTagInput('')
        setErrors({ ...errors, tags: '' })
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!currentUser) {
      router.push('/auth/login')
      return
    }

    setPosting(true)

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create discussion')
      }

      const data = await response.json()
      
      // Redirect to the new discussion
      router.push(`/community/discussions/${data.discussion.id}`)
    } catch (error) {
      console.error('Error creating discussion:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create discussion. Please try again.' 
      })
    }

    setPosting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  const selectedChannel = channels.find(c => c.id === channelId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/community/discussions"
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Discussions</span>
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-cyan-400" />
              Start a Discussion
            </h1>
            <p className="text-slate-400 mt-2">
              Share your thoughts, ask questions, or showcase your work
            </p>
          </div>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              showPreview
                ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 space-y-6">
            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Channel <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {channels.map(channel => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => {
                      setChannelId(channel.id)
                      setErrors({ ...errors, channel: '' })
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      channelId === channel.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{channel.icon}</span>
                      <span className="font-semibold text-white">{channel.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{channel.description}</p>
                  </button>
                ))}
              </div>
              {errors.channel && (
                <p className="text-red-400 text-sm mt-2">{errors.channel}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setErrors({ ...errors, title: '' })
                }}
                placeholder="What's your discussion about?"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                maxLength={200}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.title ? (
                  <p className="text-red-400 text-sm">{errors.title}</p>
                ) : (
                  <p className="text-slate-500 text-sm">Make it clear and descriptive</p>
                )}
                <p className="text-slate-500 text-sm">{title.length}/200</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-2">
                Content <span className="text-red-400">*</span>
              </label>
              
              {showPreview ? (
                <div className="min-h-[300px] px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="prose prose-invert max-w-none">
                    {content ? (
                      <div className="text-slate-200 whitespace-pre-wrap">{content}</div>
                    ) : (
                      <p className="text-slate-500 italic">Nothing to preview yet...</p>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setErrors({ ...errors, content: '' })
                  }}
                  placeholder="Share your thoughts, code snippets, questions, or ideas..."
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none font-mono text-sm"
                />
              )}
              
              {errors.content && (
                <p className="text-red-400 text-sm mt-2">{errors.content}</p>
              )}
              <p className="text-slate-500 text-sm mt-1">
                {content.length} characters • Markdown supported
              </p>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-300 mb-2">
                Tags <span className="text-slate-500">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-purple-400 hover:text-purple-200 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags (press Enter)"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                disabled={tags.length >= 5}
              />
              {errors.tags && (
                <p className="text-red-400 text-sm mt-2">{errors.tags}</p>
              )}
              <p className="text-slate-500 text-sm mt-1">
                {tags.length}/5 tags • Help others find your discussion
              </p>
            </div>

            {/* Preview Card */}
            {(title || content) && (
              <div className="pt-6 border-t border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Preview</h3>
                <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                  {selectedChannel && (
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3"
                      style={{
                        backgroundColor: `${selectedChannel.color || '#6366f1'}20`,
                        borderColor: `${selectedChannel.color || '#6366f1'}40`,
                        color: selectedChannel.color || '#6366f1'
                      }}
                    >
                      <span>{selectedChannel.icon}</span>
                      <span>{selectedChannel.name}</span>
                    </span>
                  )}
                  <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {title || 'Your discussion title...'}
                  </h4>
                  <p className="text-slate-300 text-sm line-clamp-3">
                    {content || 'Your discussion content...'}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
              <Link
                href="/community/discussions"
                className="px-6 py-3 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={posting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {posting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Create Discussion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900/30 backdrop-blur-sm rounded-lg border border-slate-800">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Be Clear
            </h4>
            <p className="text-sm text-slate-400">
              Write a descriptive title and provide enough context for others to understand
            </p>
          </div>
          
          <div className="p-4 bg-slate-900/30 backdrop-blur-sm rounded-lg border border-slate-800">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-400" />
              Use Tags
            </h4>
            <p className="text-sm text-slate-400">
              Add relevant tags to help others discover your discussion
            </p>
          </div>
          
          <div className="p-4 bg-slate-900/30 backdrop-blur-sm rounded-lg border border-slate-800">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-400" />
              Preview First
            </h4>
            <p className="text-sm text-slate-400">
              Use preview mode to see how your discussion will appear
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
