import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  // Allow cross-origin read access for the editor host
  const allowedOrigin = origin || '*'
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
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
    // Extract project id from URL path to avoid Next.js type friction
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)/)
    const id = match?.[1]
    if (!id) {
      return corsResponse({ error: 'Invalid project id' }, origin, 400)
    }
    // Allow bearer token to be passed for cross-origin private project reads
    const authHeader = req.headers.get('authorization') || ''
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : null
    let userId: string | null = null
    if (bearer) {
      const { data } = await admin.auth.getUser(bearer)
      userId = data.user?.id ?? null
    } else {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
    }

    const { data: project, error } = await admin
      .from('projects')
      .select('id, user_id, is_public, title, content, updated_at')
      .eq('id', id)
      .single()

    if (error || !project) {
      return corsResponse({ error: 'Project not found' }, origin, 404)
    }

    const isOwner = userId && project.user_id === userId
    const isPublic = !!project.is_public
    if (!isOwner && !isPublic) {
      return corsResponse({ error: 'Forbidden' }, origin, 403)
    }

    return corsResponse(project, origin, 200)
  } catch (error) {
    console.error('GET /api/projects/[id] failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function PUT(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    // Extract project id from URL path
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)/)
    const id = match?.[1]
    if (!id) {
      return corsResponse({ error: 'Invalid project id' }, origin, 400)
    }
    // Require auth: try bearer first, fall back to cookie session
    const authHeader = req.headers.get('authorization') || ''
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : null
    let userId: string | null = null
    if (bearer) {
      const { data } = await admin.auth.getUser(bearer)
      userId = data.user?.id ?? null
    } else {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
    }

    if (!userId) {
      return corsResponse({ error: 'Unauthorized' }, origin, 401)
    }

    const adminIds = (process.env.NEXT_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
    const isAdmin = !!userId && adminIds.includes(userId)

    const { data: project, error: fetchErr } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchErr || !project) {
      return corsResponse({ error: 'Project not found' }, origin, 404)
    }

    if (!isAdmin && project.user_id !== userId) {
      return corsResponse({ error: 'Forbidden' }, origin, 403)
    }

    const payload = await req.json().catch(() => null) as unknown
    if (!payload || typeof payload !== 'object') {
      return corsResponse({ error: 'Invalid payload' }, origin, 400)
    }

    // Pick allowed fields to update
    const body = payload as Record<string, unknown>
    const allowedKeys = [
      'title',
      'description',
      'is_public',
      'content',
      'language',
      'framework',
      'tags',
      'difficulty_level',
      'estimated_time',
      'demo_url',
      'github_url',
      // Admin-only below; non-admin updates will be ignored server-side if provided
      'is_featured',
      'status'
    ] as const
    const updateFields: Record<string, unknown> = {}
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateFields[key] = body[key]
      }
    }
    if (Object.keys(updateFields).length === 0) {
      return corsResponse({ error: 'No valid fields to update' }, origin, 400)
    }
    updateFields['updated_at'] = new Date().toISOString()

    // Auto-derive publish status if visibility changes
    if (Object.prototype.hasOwnProperty.call(updateFields, 'is_public')) {
      const willBePublic = Boolean(updateFields['is_public'])
      updateFields['status'] = willBePublic ? 'published' : 'draft'
      updateFields['published_at'] = willBePublic ? new Date().toISOString() : null
    }

    // If is_featured provided, set or clear featured_at (admin only)
    if (Object.prototype.hasOwnProperty.call(updateFields, 'is_featured')) {
      if (!isAdmin) {
        // Non-admin cannot change feature status
        delete updateFields['is_featured']
      } else {
        const willBeFeatured = Boolean(updateFields['is_featured'])
        updateFields['featured_at'] = willBeFeatured ? new Date().toISOString() : null
      }
    }

    const { data: updated, error: updateErr } = await admin
      .from('projects')
      .update(updateFields)
      .eq('id', id)
      .select('id, title, description, is_public, status, published_at, content, language, framework, tags, difficulty_level, estimated_time, demo_url, github_url, updated_at')
      .single()

    if (updateErr || !updated) {
      return corsResponse({ error: 'Failed to update project' }, origin, 500)
    }

    // Record a save entry (best-effort) for owner actions
    try {
      if (userId && (isAdmin || project.user_id === userId)) {
        const change_summary = typeof (payload as Record<string, unknown>)['change_summary'] === 'string'
          ? (payload as Record<string, unknown>)['change_summary'] as string
          : 'Content updated'
        await admin
          .from('project_saves')
          .insert({ project_id: id, user_id: userId, change_summary })
      }
    } catch (e) {
      console.warn('Failed to write project_saves entry:', e)
    }

    return corsResponse(updated, origin, 200)
  } catch (error) {
    console.error('PUT /api/projects/[id] failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}

export async function DELETE(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)/)
    const id = match?.[1]
    if (!id) {
      return corsResponse({ error: 'Invalid project id' }, origin, 400)
    }

    // Auth
    const authHeader = req.headers.get('authorization') || ''
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : null
    let userId: string | null = null
    if (bearer) {
      const { data } = await admin.auth.getUser(bearer)
      userId = data.user?.id ?? null
    } else {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
    }

    if (!userId) {
      return corsResponse({ error: 'Unauthorized' }, origin, 401)
    }

    const { data: project, error: fetchErr } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchErr || !project) {
      return corsResponse({ error: 'Project not found' }, origin, 404)
    }

    if (project.user_id !== userId) {
      return corsResponse({ error: 'Forbidden' }, origin, 403)
    }

    // Best-effort clean up related records prior to project deletion
    await admin.from('project_likes').delete().eq('project_id', id)
    await admin.from('project_views').delete().eq('project_id', id)

    const { error: delErr } = await admin
      .from('projects')
      .delete()
      .eq('id', id)

    if (delErr) {
      return corsResponse({ error: 'Failed to delete project' }, origin, 500)
    }

    // Return 204 No Content
    const res = NextResponse.json({}, { status: 204 })
    const allowedOrigin = origin || '*'
    res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    res.headers.set('Vary', 'Origin')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res
  } catch (error) {
    console.error('DELETE /api/projects/[id] failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


