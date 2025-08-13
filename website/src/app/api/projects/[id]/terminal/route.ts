import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  const allowedOrigin = origin || '*'
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
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
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/terminal/)
    const id = match?.[1]
    if (!id) return corsResponse({ error: 'Invalid id' }, origin, 400)

    // Identify requester
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

    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const { data: sessions } = await admin
      .from('terminal_sessions')
      .select('id, project_id, user_id, commands, working_directory, environment_vars, created_at, last_active')
      .eq('project_id', id)
      .order('last_active', { ascending: false })
      .limit(10)
    return corsResponse({ data: sessions || [] }, origin, 200)
  } catch (e) {
    console.error('GET /api/projects/[id]/terminal failed:', e)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/terminal/)
    const id = match?.[1]
    if (!id) return corsResponse({ error: 'Invalid id' }, origin, 400)

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

    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const body = await req.json().catch(() => ({})) as { command?: unknown; cwd?: unknown; env?: unknown }
    const command = typeof body.command === 'string' ? body.command : ''
    const cwd = typeof body.cwd === 'string' ? body.cwd : null
    const env = (body.env && typeof body.env === 'object') ? body.env as Record<string, unknown> : {}
    if (!command) return corsResponse({ error: 'command required' }, origin, 400)

    const { data: inserted, error } = await admin
      .from('terminal_sessions')
      .insert({ project_id: id, user_id: uid, commands: [{ ts: new Date().toISOString(), command }], working_directory: cwd, environment_vars: env })
      .select('id, created_at, last_active')
      .single()
    if (error || !inserted) return corsResponse({ error: 'Insert failed' }, origin, 500)
    return corsResponse({ data: inserted }, origin, 200)
  } catch (e) {
    console.error('POST /api/projects/[id]/terminal failed:', e)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function PUT(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/terminal/)
    const id = match?.[1]
    if (!id) return corsResponse({ error: 'Invalid id' }, origin, 400)

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

    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const body = await req.json().catch(() => ({})) as { sessionId?: unknown; append?: unknown }
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    const append = Array.isArray(body.append) ? body.append : []
    if (!sessionId || !append.length) return corsResponse({ error: 'sessionId and append required' }, origin, 400)

    const { error } = await admin
      .from('terminal_sessions')
      .update({ commands: append, last_active: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('project_id', id)
    if (error) return corsResponse({ error: 'Update failed' }, origin, 500)
    return corsResponse({ ok: true }, origin, 200)
  } catch (e) {
    console.error('PUT /api/projects/[id]/terminal failed:', e)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


