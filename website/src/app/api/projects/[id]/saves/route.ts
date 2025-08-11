import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/saves/)
    const id = match?.[1]
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Allow public access for public projects; otherwise require owner
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id, is_public, status')
      .eq('id', id)
      .single()
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: user } = await supabase.auth.getUser()
    const uid = user.user?.id
    const isPublic = project.is_public && project.status === 'published'
    const isOwner = uid && uid === project.user_id
    if (!isPublic && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: saves, error } = await admin
      .from('project_saves')
      .select('id, change_summary, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error

    return NextResponse.json({ data: saves || [] })
  } catch (error) {
    console.error('GET /api/projects/[id]/saves failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/saves/)
    const id = match?.[1]
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    const { data: user } = await supabase.auth.getUser()
    const uid = user.user?.id
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify owner
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const change_summary = typeof body.change_summary === 'string' ? body.change_summary.slice(0, 280) : null
    const { data: inserted, error } = await admin
      .from('project_saves')
      .insert({ project_id: id, user_id: uid, change_summary })
      .select('id, created_at')
      .single()
    if (error || !inserted) return NextResponse.json({ error: 'Failed to insert' }, { status: 500 })
    return NextResponse.json({ id: inserted.id, created_at: inserted.created_at })
  } catch (error) {
    console.error('POST /api/projects/[id]/saves failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


