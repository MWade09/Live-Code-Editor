import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the original project
    const { data: originalProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !originalProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project is public or user owns it
    if (!originalProject.is_public && originalProject.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot fork private project' },
        { status: 403 }
      )
    }

    // Create forked project
    const { data: forkedProject, error: createError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: `${originalProject.title} (Fork)`,
        description: originalProject.description || '',
        content: originalProject.content,
        language: originalProject.language || 'JavaScript',
        framework: originalProject.framework || '',
        tags: originalProject.tags || [],
        is_public: false, // Forks start as private
        difficulty_level: originalProject.difficulty_level || 'beginner',
        estimated_time: originalProject.estimated_time || null,
        demo_url: '',
        github_url: '',
        thumbnail_url: originalProject.thumbnail_url || null, // Copy thumbnail
        status: 'draft',
        forked_from: id, // Track the original project
        published_at: null
      })
      .select()
      .single()

    if (createError) {
      console.error('Fork creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create fork' },
        { status: 500 }
      )
    }

    // Increment forks_count on the original project
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        forks_count: (originalProject.forks_count || 0) + 1
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update forks_count:', updateError)
      // Don't fail the fork if this update fails
    }

    return NextResponse.json({
      success: true,
      project: forkedProject
    })
  } catch (error) {
    console.error('Fork error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
