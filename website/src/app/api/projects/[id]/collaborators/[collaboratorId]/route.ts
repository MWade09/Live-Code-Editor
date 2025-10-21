import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/projects/[id]/collaborators/[collaboratorId]
 * Update a collaborator's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const { id, collaboratorId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the project owner or an admin collaborator
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
      // Check if user is an admin collaborator
      const { data: userCollaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (!userCollaborator || userCollaborator.role !== 'admin') {
        return NextResponse.json({ error: 'Only owner or admin can update collaborator roles' }, { status: 403 })
      }
    }

    const { role } = await request.json()

    if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update collaborator role
    const { data: collaborator, error } = await supabase
      .from('project_collaborators')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', collaboratorId)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user profile separately
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', collaborator.user_id)
      .single()

    const collaboratorWithProfile = {
      ...collaborator,
      user_profiles: profile || null
    }

    // Log activity
    await supabase
      .from('collaboration_activity')
      .insert({
        project_id: id,
        user_id: user.id,
        activity_type: 'role_change',
        activity_data: {
          collaborator_id: collaboratorId,
          new_role: role
        }
      })

    return NextResponse.json({ collaborator: collaboratorWithProfile })
  } catch (error) {
    console.error('Error updating collaborator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/projects/[id]/collaborators/[collaboratorId]
 * Remove a collaborator from a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const { id, collaboratorId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the collaborator being removed
    const { data: collaborator } = await supabase
      .from('project_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .single()

    if (!collaborator) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    // Check if user is the project owner, admin collaborator, or removing themselves
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.user_id === user.id
    const isSelf = collaborator.user_id === user.id

    if (!isOwner && !isSelf) {
      // Check if user is an admin collaborator
      const { data: userCollaborator } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (!userCollaborator || userCollaborator.role !== 'admin') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Remove collaborator
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('project_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('collaboration_activity')
      .insert({
        project_id: id,
        user_id: user.id,
        activity_type: 'leave',
        activity_data: {
          removed_user_id: collaborator.user_id,
          self_removal: isSelf
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
