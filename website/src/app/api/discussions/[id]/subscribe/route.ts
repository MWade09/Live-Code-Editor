import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/discussions/[id]/subscribe - Subscribe/unsubscribe from discussion notifications
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

    // Check if already subscribed
    const { data: existingSubscription } = await supabase
      .from('discussion_subscriptions')
      .select('id')
      .eq('discussion_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingSubscription) {
      // Unsubscribe
      const { error } = await supabase
        .from('discussion_subscriptions')
        .delete()
        .eq('discussion_id', id)
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({ subscribed: false })
    } else {
      // Subscribe
      const { error } = await supabase
        .from('discussion_subscriptions')
        .insert({
          discussion_id: id,
          user_id: user.id,
          notify_on_reply: true
        })

      if (error) throw error

      return NextResponse.json({ subscribed: true })
    }
  } catch (error) {
    console.error('Error toggling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to toggle subscription' },
      { status: 500 }
    )
  }
}
