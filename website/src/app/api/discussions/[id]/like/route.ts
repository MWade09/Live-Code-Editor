import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/discussions/[id]/like - Like/unlike a discussion
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

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('discussion_likes')
      .select('id')
      .eq('discussion_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('discussion_likes')
        .delete()
        .eq('discussion_id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Decrement like count
      const { data: currentDiscussion } = await supabase
        .from('discussions')
        .select('likes_count')
        .eq('id', id)
        .single()

      if (currentDiscussion) {
        await supabase
          .from('discussions')
          .update({ likes_count: Math.max(0, currentDiscussion.likes_count - 1) })
          .eq('id', id)
      }

      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('discussion_likes')
        .insert({
          discussion_id: id,
          user_id: user.id
        })

      if (insertError) throw insertError

      // Increment like count
      const { data: currentDiscussion } = await supabase
        .from('discussions')
        .select('likes_count')
        .eq('id', id)
        .single()

      if (currentDiscussion) {
        await supabase
          .from('discussions')
          .update({ likes_count: currentDiscussion.likes_count + 1 })
          .eq('id', id)
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
