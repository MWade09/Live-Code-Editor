import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/community/projects/[id]/like - Toggle like on project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: projectId } = await params

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      await supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)

      // Decrement like count
      const { data: project } = await supabase
        .from('projects')
        .select('like_count')
        .eq('id', projectId)
        .single()

      if (project) {
        await supabase
          .from('projects')
          .update({ like_count: Math.max(0, (project.like_count || 0) - 1) })
          .eq('id', projectId)
      }

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await supabase
        .from('project_likes')
        .insert({
          project_id: projectId,
          user_id: user.id
        })

      // Increment like count
      const { data: project } = await supabase
        .from('projects')
        .select('like_count')
        .eq('id', projectId)
        .single()

      if (project) {
        await supabase
          .from('projects')
          .update({ like_count: (project.like_count || 0) + 1 })
          .eq('id', projectId)
      }

      return NextResponse.json({ liked: true })
    }

  } catch (error) {
    console.error('Error toggling project like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
