import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/discussions/channels - List all discussion channels
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: channels, error } = await supabase
      .from('discussion_channels')
      .select('*')
      .eq('is_archived', false)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

// POST /api/discussions/channels - Create a new channel (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/moderator
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color, position, requires_role } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const { data: channel, error } = await supabase
      .from('discussion_channels')
      .insert({
        name,
        slug,
        description,
        icon,
        color,
        position: position || 999,
        requires_role: requires_role || 'user',
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Channel slug already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}
