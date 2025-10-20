import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    
    // Extract and validate fields
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled Project'
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const content = typeof body.content === 'string' ? body.content : '// Start coding here...\n\n'
    const language = typeof body.language === 'string' ? body.language : 'JavaScript'
    const framework = typeof body.framework === 'string' ? body.framework : ''
    const tags = Array.isArray(body.tags) ? body.tags : []
    const is_public = typeof body.is_public === 'boolean' ? body.is_public : false
    const difficulty_level = typeof body.difficulty_level === 'string' ? body.difficulty_level : 'beginner'
    const estimated_time = typeof body.estimated_time === 'number' ? body.estimated_time : null
    const demo_url = typeof body.demo_url === 'string' ? body.demo_url.trim() : ''
    const github_url = typeof body.github_url === 'string' ? body.github_url.trim() : ''
    const status = is_public ? 'published' : 'draft'

    const { data: created, error } = await admin
      .from('projects')
      .insert({
        user_id: userId,
        title,
        description,
        content,
        language,
        framework,
        tags,
        is_public,
        status,
        difficulty_level,
        estimated_time,
        demo_url,
        github_url,
        published_at: is_public ? new Date().toISOString() : null
      })
      .select('id')
      .single()

    if (error || !created) {
      console.error('Failed to create project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ id: created.id, success: true })
  } catch (error) {
    console.error('POST /api/projects failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


