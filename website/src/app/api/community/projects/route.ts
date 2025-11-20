import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/community/projects - List all showcase projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const sort = searchParams.get('sort') || 'trending' // trending, new, popular
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        html_content,
        css_content,
        js_content,
        thumbnail_url,
        live_url,
        github_url,
        tags,
        is_public,
        view_count,
        like_count,
        fork_count,
        created_at,
        updated_at,
        user_id,
        profiles!inner(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .eq('is_showcase', true)

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag])
    }

    // Sort
    if (sort === 'new') {
      query = query.order('created_at', { ascending: false })
    } else if (sort === 'popular') {
      query = query.order('like_count', { ascending: false })
    } else {
      // Trending: combination of recent activity and engagement
      query = query.order('updated_at', { ascending: false })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: projects, error } = await query

    if (error) throw error

    // Get current user's likes
    const { data: { user } } = await supabase.auth.getUser()
    let userLikes: string[] = []
    
    if (user) {
      const { data: likes } = await supabase
        .from('project_likes')
        .select('project_id')
        .eq('user_id', user.id)
        .in('project_id', projects?.map(p => p.id) || [])
      
      userLikes = likes?.map(l => l.project_id) || []
    }

    // Add is_liked flag
    const projectsWithLikes = projects?.map(project => ({
      ...project,
      is_liked: userLikes.includes(project.id)
    }))

    return NextResponse.json({
      projects: projectsWithLikes,
      total: projects?.length || 0
    })

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/community/projects - Create/update showcase project
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { project_id, showcase_description, tags } = body

    if (!project_id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, description, is_showcase')
      .eq('id', project_id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const wasShowcase = project.is_showcase

    // Update project to be showcase
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        is_showcase: true,
        is_public: true,
        description: showcase_description || project.description,
        tags: tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id)
      .select(`
        id,
        name,
        description,
        thumbnail_url,
        live_url,
        github_url,
        tags,
        created_at
      `)
      .single()

    if (updateError) throw updateError

    // Award points for showcasing (first time only)
    if (!wasShowcase) {
      await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_points: 50,
        p_reason: 'showcase_project'
      })
    }

    return NextResponse.json({
      project: updatedProject,
      message: 'Project added to showcase!'
    })

  } catch (error) {
    console.error('Error adding project to showcase:', error)
    return NextResponse.json(
      { error: 'Failed to add project to showcase' },
      { status: 500 }
    )
  }
}
