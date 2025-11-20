import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string; replyId: string }>
}

// PATCH /api/discussions/[id]/replies/[replyId] - Update a reply
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { replyId } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the author
    const { data: reply } = await supabase
      .from('discussion_replies')
      .select('author_id')
      .eq('id', replyId)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    if (reply.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { content, is_accepted_answer } = body

    const updates: Record<string, unknown> = {}
    if (content !== undefined) {
      updates.content = content
      updates.is_edited = true
    }
    if (is_accepted_answer !== undefined) {
      updates.is_accepted_answer = is_accepted_answer
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedReply, error } = await supabase
      .from('discussion_replies')
      .update(updates)
      .eq('id', replyId)
      .select(`
        *,
        author:user_profiles(id, username, full_name, avatar_url, role)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ reply: updatedReply })
  } catch (error) {
    console.error('Error updating reply:', error)
    return NextResponse.json(
      { error: 'Failed to update reply' },
      { status: 500 }
    )
  }
}

// DELETE /api/discussions/[id]/replies/[replyId] - Delete a reply (soft delete)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { replyId } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the author or moderator
    const { data: reply } = await supabase
      .from('discussion_replies')
      .select('author_id')
      .eq('id', replyId)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthor = reply.author_id === user.id
    const isModerator = profile && ['admin', 'moderator'].includes(profile.role)

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    const { error } = await supabase
      .from('discussion_replies')
      .update({ 
        is_deleted: true,
        content: '[deleted]'
      })
      .eq('id', replyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    )
  }
}
