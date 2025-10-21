import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/projects/[id]/collaborators
 * Fetch all collaborators for a project
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

    // Check if user has permission to view collaborators
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only owner or collaborators can view the collaborator list
    const isOwner = project.user_id === user.id
    const { data: isCollaborator } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch collaborators with user profiles
    const { data: collaborators, error } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user profiles separately
    if (collaborators && collaborators.length > 0) {
      const userIds = collaborators.map(c => c.user_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      // Merge profiles with collaborators
      const collaboratorsWithProfiles = collaborators.map(collab => ({
        ...collab,
        user_profiles: profiles?.find(p => p.id === collab.user_id) || null
      }))

      return NextResponse.json({ collaborators: collaboratorsWithProfiles })
    }

    return NextResponse.json({ collaborators: [] })
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/projects/[id]/collaborators
 * Add a collaborator directly (admin only)
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
      return NextResponse.json({ error: 'Only project owner can add collaborators directly' }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user is already a collaborator
    const { data: existing } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 })
    }

    // Add collaborator
    const { data: collaborator, error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: id,
        user_id: userId,
        invited_by: user.id,
        role,
        status: 'accepted' // Direct add, no invitation needed
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user profile separately
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single()

    const collaboratorWithProfile = {
      ...collaborator,
      user_profiles: profile || null
    }

    return NextResponse.json({ collaborator: collaboratorWithProfile }, { status: 201 })
  } catch (error) {
    console.error('Error adding collaborator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
