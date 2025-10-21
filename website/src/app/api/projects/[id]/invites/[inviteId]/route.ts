import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/projects/[id]/invites/[inviteId]
 * Cancel a pending invite
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id, inviteId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the project owner or admin
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
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
        return NextResponse.json({ error: 'Only owner or admin can cancel invites' }, { status: 403 })
      }
    }

    // Delete the invite
    const { error } = await supabase
      .from('collaboration_invites')
      .delete()
      .eq('id', inviteId)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
