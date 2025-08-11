import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  const allowedOrigin = origin || '*'
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
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
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/branches/)
    const id = match?.[1]
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

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

    // Owner only
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const { data: rows, error } = await admin
      .from('project_branches')
      .select('id, name, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    if (error) throw error

    return corsResponse({ data: rows || [] }, origin, 200)
  } catch (error) {
    console.error('GET /api/projects/[id]/branches failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/branches/)
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

    // Owner only
    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const body = await req.json().catch(() => ({})) as { name?: string }
    const name = (body.name || '').trim().slice(0, 64)
    if (!name) return corsResponse({ error: 'name required' }, origin, 400)

    const { data: inserted, error } = await admin
      .from('project_branches')
      .insert({ project_id: id, name, created_by: uid })
      .select('id, name, created_at')
      .single()
    if (error || !inserted) return corsResponse({ error: 'Failed to insert' }, origin, 500)
    return corsResponse({ data: inserted }, origin, 200)
  } catch (error) {
    console.error('POST /api/projects/[id]/branches failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


