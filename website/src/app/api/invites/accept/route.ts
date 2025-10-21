import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/invites/accept
 * Accept a collaboration invite
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('collaboration_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
    }

    // Get user's email to verify it matches the invite
    // TODO: Implement email verification
    // For now, we'll accept any authenticated user

    // Check if user is already a collaborator
    const { data: existing } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', invite.project_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You are already a collaborator on this project' }, { status: 400 })
    }

    // Add user as collaborator
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: invite.project_id,
        user_id: user.id,
        invited_by: invite.invited_by,
        role: invite.role,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .select(`
        *,
        user_profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (collaboratorError) {
      return NextResponse.json({ error: collaboratorError.message }, { status: 500 })
    }

    // Update invite status
    await supabase
      .from('collaboration_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    // Log activity
    await supabase
      .from('collaboration_activity')
      .insert({
        project_id: invite.project_id,
        user_id: user.id,
        activity_type: 'join',
        activity_data: {
          role: invite.role,
          invited_by: invite.invited_by
        }
      })

    return NextResponse.json({ 
      success: true,
      collaborator,
      project_id: invite.project_id
    })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
