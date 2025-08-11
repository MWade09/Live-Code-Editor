import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  const allowedOrigin = origin || '*'
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  return corsResponse({}, origin, 200)
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin')
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
    if (!project) return corsResponse({ error: 'Not found' }, origin, 404)

    const { data: user } = await supabase.auth.getUser()
    const uid = user.user?.id
    const isPublic = project.is_public && project.status === 'published'
    const isOwner = uid && uid === project.user_id
    if (!isPublic && !isOwner) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const { data: saves, error } = await admin
      .from('project_saves')
      .select('id, change_summary, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error

    return corsResponse({ data: saves || [] }, origin, 200)
  } catch (error) {
    console.error('GET /api/projects/[id]/saves failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/saves/)
    const id = match?.[1]
    if (!id) return corsResponse({ error: 'Invalid id' }, origin, 400)
    const { data: user } = await supabase.auth.getUser()
    const uid = user.user?.id
    if (!uid) return corsResponse({ error: 'Unauthorized' }, origin, 401)

    // Verify owner
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const change_summary = typeof body.change_summary === 'string' ? body.change_summary.slice(0, 280) : null
    const { data: inserted, error } = await admin
      .from('project_saves')
      .insert({ project_id: id, user_id: uid, change_summary })
      .select('id, created_at')
      .single()
    if (error || !inserted) return corsResponse({ error: 'Failed to insert' }, origin, 500)
    return corsResponse({ id: inserted.id, created_at: inserted.created_at }, origin, 200)
  } catch (error) {
    console.error('POST /api/projects/[id]/saves failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


