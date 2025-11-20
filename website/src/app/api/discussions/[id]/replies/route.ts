import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/discussions/[id]/replies - Create a reply
export async function POST(
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

    // Verify discussion exists and is not locked
    const { data: discussion } = await supabase
      .from('discussions')
      .select('id, is_locked, author_id')
      .eq('id', id)
      .single()

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    if (discussion.is_locked) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'moderator'].includes(profile.role)) {
        return NextResponse.json(
          { error: 'Discussion is locked' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { content, parent_id } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // If replying to a parent, verify it exists
    if (parent_id) {
      const { data: parentReply } = await supabase
        .from('discussion_replies')
        .select('id, discussion_id')
        .eq('id', parent_id)
        .single()

      if (!parentReply || parentReply.discussion_id !== id) {
        return NextResponse.json(
          { error: 'Parent reply not found' },
          { status: 404 }
        )
      }
    }

    // Create reply
    const { data: reply, error } = await supabase
      .from('discussion_replies')
      .insert({
        discussion_id: id,
        author_id: user.id,
        parent_id: parent_id || null,
        content
      })
      .select(`
        *,
        author:user_profiles(id, username, full_name, avatar_url, role)
      `)
      .single()

    if (error) throw error

    // Award points for reply
    await supabase
      .from('user_points')
      .insert({
        user_id: user.id,
        points: 2,
        reason: 'Posted reply',
        source_type: 'comment_created',
        source_id: reply.id
      })
      .then(() => {}) // Ignore errors

    // Update user streak
    await supabase.rpc('update_user_streak', { p_user_id: user.id })
      .then(() => {}) // Ignore errors

    // Create notifications for subscribers (except the author)
    const { data: subscribers } = await supabase
      .from('discussion_subscriptions')
      .select('user_id')
      .eq('discussion_id', id)
      .eq('notify_on_reply', true)
      .neq('user_id', user.id)

    if (subscribers && subscribers.length > 0) {
      const { data: authorProfile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const notifications = subscribers.map(sub => ({
        user_id: sub.user_id,
        type: 'comment',
        title: 'New reply',
        message: `${authorProfile?.username || 'Someone'} replied to a discussion you're following`,
        data: {
          discussion_id: id,
          reply_id: reply.id
        }
      }))

      await supabase
        .from('notifications')
        .insert(notifications)
        .then(() => {}) // Ignore errors
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
