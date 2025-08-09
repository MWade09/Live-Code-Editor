import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
  } else {
    res.headers.set('Access-Control-Allow-Origin', '*')
  }
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  return corsResponse({}, origin, 200)
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !project) {
      return corsResponse({ error: 'Project not found' }, origin, 404)
    }

    const isOwner = user && project.user_id === user.id
    const isPublic = !!project.is_public
    if (!isOwner && !isPublic) {
      return corsResponse({ error: 'Forbidden' }, origin, 403)
    }

    return corsResponse(
      {
        id: project.id,
        user_id: project.user_id,
        title: project.title,
        is_public: project.is_public,
        content: project.content,
        updated_at: project.updated_at
      },
      origin,
      200
    )
  } catch (error) {
    console.error('GET /api/projects/[id] failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return corsResponse({ error: 'Unauthorized' }, origin, 401)
    }

    const { data: project, error: fetchErr } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', params.id)
      .single()

    if (fetchErr || !project) {
      return corsResponse({ error: 'Project not found' }, origin, 404)
    }

    if (project.user_id !== user.id) {
      return corsResponse({ error: 'Forbidden' }, origin, 403)
    }

    const payload = await req.json().catch(() => null)
    if (!payload || typeof payload.content !== 'string') {
      return corsResponse({ error: 'Invalid payload' }, origin, 400)
    }

    const { data: updated, error: updateErr } = await supabase
      .from('projects')
      .update({ content: payload.content, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*')
      .single()

    if (updateErr || !updated) {
      return corsResponse({ error: 'Failed to update project' }, origin, 500)
    }

    return corsResponse(
      {
        id: updated.id,
        content: updated.content,
        updated_at: updated.updated_at
      },
      origin,
      200
    )
  } catch (error) {
    console.error('PUT /api/projects/[id] failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


