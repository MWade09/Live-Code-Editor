import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

/**
 * GET /api/projects/[id]/invites
 * Fetch all pending invites for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the project owner
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      // Also allow admin collaborators to view invites
      const { data: isAdmin } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .eq('role', 'admin')
        .single()

      if (!isAdmin) {
        return NextResponse.json({ error: 'Only owner or admin can view invites' }, { status: 403 })
      }
    }

    // Fetch pending invites
    const { data: invites, error } = await supabase
      .from('collaboration_invites')
      .select('*')
      .eq('project_id', id)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/projects/[id]/invites
 * Create a new collaboration invite
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the project owner or admin
    const { data: project } = await supabase
      .from('projects')
      .select('user_id, title')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.user_id === user.id

    if (!isOwner) {
      const { data: isAdmin } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .eq('role', 'admin')
        .single()

      if (!isAdmin) {
        return NextResponse.json({ error: 'Only owner or admin can send invites' }, { status: 403 })
      }
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing email or role' }, { status: 400 })
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user with this email exists
    const { data: invitedUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', email) // Assuming email is stored as user ID or we need to query auth.users
      .single()

    // Check if email already has a pending invite
    const { data: existingInvite } = await supabase
      .from('collaboration_invites')
      .select('id, status')
      .eq('project_id', id)
      .eq('email', email)
      .single()

    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 })
      }
    }

    // Check if user is already a collaborator
    if (invitedUser) {
      const { data: existingCollaborator } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', id)
        .eq('user_id', invitedUser.id)
        .single()

      if (existingCollaborator) {
        return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 })
      }
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Create invite
    const { data: invite, error } = await supabase
      .from('collaboration_invites')
      .insert({
        project_id: id,
        invited_by: user.id,
        email,
        role,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('collaboration_activity')
      .insert({
        project_id: id,
        user_id: user.id,
        activity_type: 'invite',
        activity_data: {
          email,
          role
        }
      })

    // TODO: Send email notification
    // For now, return the invite with the token for testing
    return NextResponse.json({ 
      invite,
      inviteUrl: `${request.nextUrl.origin}/invites/${token}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
