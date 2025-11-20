import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/discussions/[id] - Get a single discussion with replies
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Fetch discussion
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select(`
        *,
        channel:discussion_channels(id, name, slug, icon, color),
        author:user_profiles(id, username, full_name, avatar_url, role)
      `)
      .eq('id', id)
      .single()

    if (discussionError) {
      if (discussionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Discussion not found' },
          { status: 404 }
        )
      }
      throw discussionError
    }

    // Fetch replies
    const { data: replies, error: repliesError } = await supabase
      .from('discussion_replies')
      .select(`
        *,
        author:user_profiles(id, username, full_name, avatar_url, role)
      `)
      .eq('discussion_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (repliesError) throw repliesError

    // Build nested reply structure
    const replyMap = new Map()
    const rootReplies: typeof replies = []

    replies?.forEach(reply => {
      replyMap.set(reply.id, { ...reply, replies: [] })
    })

    replies?.forEach(reply => {
      const replyNode = replyMap.get(reply.id)
      if (reply.parent_id) {
        const parent = replyMap.get(reply.parent_id)
        if (parent) {
          parent.replies.push(replyNode)
        }
      } else {
        rootReplies.push(replyNode)
      }
    })

    // Get current user to check likes and subscription
    const { data: { user } } = await supabase.auth.getUser()
    
    let is_liked = false
    let is_subscribed = false

    if (user) {
      // Check if user liked this discussion
      const { data: like } = await supabase
        .from('discussion_likes')
        .select('id')
        .eq('discussion_id', id)
        .eq('user_id', user.id)
        .single()

      is_liked = !!like

      // Check if user is subscribed
      const { data: subscription } = await supabase
        .from('discussion_subscriptions')
        .select('id')
        .eq('discussion_id', id)
        .eq('user_id', user.id)
        .single()

      is_subscribed = !!subscription

      // Record view
      await supabase
        .from('discussion_views')
        .insert({
          discussion_id: id,
          user_id: user.id
        })
        .then(() => {}) // Ignore errors

      // Increment view count
      await supabase.rpc('increment', { 
        row_id: id, 
        table_name: 'discussions',
        column_name: 'views_count'
      }).then(() => {}) // Ignore errors if function doesn't exist
    }

    return NextResponse.json({
      discussion: {
        ...discussion,
        is_liked,
        is_subscribed
      },
      replies: rootReplies
    })
  } catch (error) {
    console.error('Error fetching discussion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussion' },
      { status: 500 }
    )
  }
}

// PATCH /api/discussions/[id] - Update a discussion
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the author or moderator
    const { data: discussion } = await supabase
      .from('discussions')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthor = discussion.author_id === user.id
    const isModerator = profile && ['admin', 'moderator'].includes(profile.role)

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    // Only allow certain fields to be updated
    if (body.title !== undefined && isAuthor) updates.title = body.title
    if (body.content !== undefined && isAuthor) updates.content = body.content
    if (body.tags !== undefined && isAuthor) updates.tags = body.tags
    if (body.is_pinned !== undefined && isModerator) updates.is_pinned = body.is_pinned
    if (body.is_locked !== undefined && isModerator) updates.is_locked = body.is_locked
    if (body.is_archived !== undefined && isModerator) updates.is_archived = body.is_archived

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedDiscussion, error } = await supabase
      .from('discussions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        channel:discussion_channels(id, name, slug, icon, color),
        author:user_profiles(id, username, full_name, avatar_url, role)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ discussion: updatedDiscussion })
  } catch (error) {
    console.error('Error updating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to update discussion' },
      { status: 500 }
    )
  }
}

// DELETE /api/discussions/[id] - Delete a discussion
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the author or moderator
    const { data: discussion } = await supabase
      .from('discussions')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthor = discussion.author_id === user.id
    const isModerator = profile && ['admin', 'moderator'].includes(profile.role)

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting discussion:', error)
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    )
  }
}
