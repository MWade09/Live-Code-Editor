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
    const url = new URL(req.url)
    const match = url.pathname.match(/\/api\/projects\/([^/]+)\/commits/)
    const id = match?.[1]
    const branch = url.searchParams.get('branch') || null
    const pageParam = url.searchParams.get('page')
    const pageSizeParam = url.searchParams.get('pageSize')
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(pageSizeParam || '15', 10) || 15))
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Verify project exists and determine owner
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project) return corsResponse({ error: 'Not found' }, origin, 404)

    // Identify requester (bearer or cookie)
    const authHeader = req.headers.get('authorization') || ''
    const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null
    let uid: string | null = null
    if (bearer) {
      const { data } = await admin.auth.getUser(bearer)
      uid = data.user?.id ?? null
    } else {
      const { data: user } = await supabase.auth.getUser()
      uid = user.user?.id ?? null
    }

    const isOwner = uid && uid === project.user_id
    if (!isOwner) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const offset = (page - 1) * pageSize
    let query = admin
      .from('project_commits')
      .select('id, message, created_at, branch', { count: 'exact' })
      .eq('project_id', id)
    if (branch) query = query.eq('branch', branch)
    const { data: commits, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)
    if (error) throw error

    return corsResponse({ data: commits || [], total: count || 0, page, pageSize }, origin, 200)
  } catch (error) {
    console.error('GET /api/projects/[id]/commits failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/commits/)
    const id = match?.[1]
    if (!id) return corsResponse({ error: 'Invalid id' }, origin, 400)

    // Identify requester (bearer or cookie)
    const authHeader = req.headers.get('authorization') || ''
    const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null
    let uid: string | null = null
    if (bearer) {
      const { data } = await admin.auth.getUser(bearer)
      uid = data.user?.id ?? null
    } else {
      const { data: user } = await supabase.auth.getUser()
      uid = user.user?.id ?? null
    }
    if (!uid) return corsResponse({ error: 'Unauthorized' }, origin, 401)

    // Verify owner
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const body = await req.json().catch(() => ({})) as { message?: string; content?: string; branch?: string }
    const message = (body.message || '').trim().slice(0, 280)
    const content = typeof body.content === 'string' ? body.content : ''
    const branch = (body.branch || 'main').slice(0, 64)
    if (!message || !content) return corsResponse({ error: 'message and content required' }, origin, 400)

    const { data: inserted, error } = await admin
      .from('project_commits')
      .insert({ project_id: id, user_id: uid, message, content, branch })
      .select('id, created_at, branch')
      .single()
    if (error || !inserted) return corsResponse({ error: 'Failed to insert' }, origin, 500)

    return corsResponse({ id: inserted.id, created_at: inserted.created_at, branch: inserted.branch }, origin, 200)
  } catch (error) {
    console.error('POST /api/projects/[id]/commits failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


