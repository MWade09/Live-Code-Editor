import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/discussions - List discussions with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const channel_id = searchParams.get('channel_id')
    const author_id = searchParams.get('author_id')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'latest' // latest, popular, active
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('discussions')
      .select(`
        *,
        channel:discussion_channels!inner(id, name, slug, icon, color),
        author:user_profiles!inner(id, username, full_name, avatar_url, role)
      `, { count: 'exact' })
      .eq('is_archived', false)

    // Apply filters
    if (channel_id) {
      query = query.eq('channel_id', channel_id)
    }

    if (author_id) {
      query = query.eq('author_id', author_id)
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('likes_count', { ascending: false })
        break
      case 'active':
        query = query.order('last_activity_at', { ascending: false })
        break
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Pinned discussions first
    query = query.order('is_pinned', { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: discussions, error, count } = await query

    if (error) throw error

    // Get current user to check if they liked discussions
    const { data: { user } } = await supabase.auth.getUser()
    
    let discussionsWithLikes = discussions || []
    if (user && discussions && discussions.length > 0) {
      const discussionIds = discussions.map(d => d.id)
      const { data: likes } = await supabase
        .from('discussion_likes')
        .select('discussion_id')
        .eq('user_id', user.id)
        .in('discussion_id', discussionIds)

      const likedIds = new Set(likes?.map(l => l.discussion_id) || [])
      discussionsWithLikes = discussions.map(d => ({
        ...d,
        is_liked: likedIds.has(d.id)
      }))
    }

    return NextResponse.json({
      discussions: discussionsWithLikes,
      total: count || 0,
      page,
      limit,
      has_next: count ? offset + limit < count : false
    })
  } catch (error) {
    console.error('Error fetching discussions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    )
  }
}

// POST /api/discussions - Create a new discussion
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channel_id, title, content, tags } = body

    // Validate required fields
    if (!channel_id || !title || !content) {
      return NextResponse.json(
        { error: 'Channel, title, and content are required' },
        { status: 400 }
      )
    }

    // Verify channel exists
    const { data: channel } = await supabase
      .from('discussion_channels')
      .select('id, requires_role')
      .eq('id', channel_id)
      .single()

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Check role requirement
    if (channel.requires_role !== 'user') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'moderator'].includes(profile.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions for this channel' },
          { status: 403 }
        )
      }
    }

    // Create discussion
    const { data: discussion, error } = await supabase
      .from('discussions')
      .insert({
        channel_id,
        author_id: user.id,
        title,
        content,
        tags: tags || []
      })
      .select(`
        *,
        channel:discussion_channels(id, name, slug, icon, color),
        author:user_profiles(id, username, full_name, avatar_url, role)
      `)
      .single()

    if (error) throw error

    // Auto-subscribe author to the discussion
    await supabase
      .from('discussion_subscriptions')
      .insert({
        discussion_id: discussion.id,
        user_id: user.id,
        notify_on_reply: true
      })
      .then(() => {}) // Ignore errors for subscription

    // Award points for creating discussion
    await supabase
      .from('user_points')
      .insert({
        user_id: user.id,
        points: 5,
        reason: 'Created discussion',
        source_type: 'discussion_created',
        source_id: discussion.id
      })
      .then(() => {}) // Ignore errors for points

    // Update user streak
    await supabase.rpc('update_user_streak', { p_user_id: user.id })
      .then(() => {}) // Ignore errors

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Error creating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    )
  }
}
