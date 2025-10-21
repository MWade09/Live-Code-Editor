import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/invites/decline
 * Decline a collaboration invite
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (optional for decline)
    const { data: { user } } = await supabase.auth.getUser()

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from('collaboration_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    }

    // Check if invite is still valid
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite already used' }, { status: 400 })
    }

    // Update invite status
    const { error } = await supabase
      .from('collaboration_invites')
      .update({ status: 'declined' })
      .eq('id', invite.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity if user is authenticated
    if (user) {
      await supabase
        .from('collaboration_activity')
        .insert({
          project_id: invite.project_id,
          user_id: user.id,
          activity_type: 'invite',
          activity_data: {
            action: 'declined',
            role: invite.role
          }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error declining invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
