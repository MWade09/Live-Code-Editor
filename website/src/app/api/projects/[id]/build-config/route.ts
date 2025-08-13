import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  const allowedOrigin = origin || '*'
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
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
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/build-config/)
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

    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()
    if (!project || project.user_id !== uid) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const { data: cfg } = await admin
      .from('project_build_configs')
      .select('*')
      .eq('project_id', id)
      .single()
    return corsResponse({ data: cfg || null }, origin, 200)
  } catch (e) {
    console.error('GET /api/projects/[id]/build-config failed:', e)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function PUT(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/build-config/)
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

    const body = await req.json().catch(() => ({})) as { build_command?: unknown; environment?: unknown; deploy_target?: unknown }
    const build_command = typeof body.build_command === 'string' ? body.build_command : undefined
    const environment = (body.environment && typeof body.environment === 'object') ? body.environment as Record<string, unknown> : undefined
    const deploy_target = typeof body.deploy_target === 'string' ? body.deploy_target : undefined

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (build_command !== undefined) payload.build_command = build_command
    if (environment !== undefined) payload.environment = environment
    if (deploy_target !== undefined) payload.deploy_target = deploy_target

    const { data: upserted, error } = await admin
      .from('project_build_configs')
      .upsert({ project_id: id, ...payload }, { onConflict: 'project_id' })
      .select('*')
      .single()
    if (error) return corsResponse({ error: 'Upsert failed' }, origin, 500)
    return corsResponse({ data: upserted }, origin, 200)
  } catch (e) {
    console.error('PUT /api/projects/[id]/build-config failed:', e)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


