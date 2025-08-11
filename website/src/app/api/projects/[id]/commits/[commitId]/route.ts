import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function corsResponse(body: unknown, origin: string | null, status = 200) {
  const res = NextResponse.json(body, { status })
  const allowedOrigin = origin || '*'
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  res.headers.set('Vary', 'Origin')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
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
    const match = new URL(req.url).pathname.match(/\/api\/projects\/([^/]+)\/commits\/([^/]+)/)
    const projectId = match?.[1]
    const commitId = match?.[2]
    if (!projectId || !commitId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const { data: project } = await admin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()
    if (!project) return corsResponse({ error: 'Not found' }, origin, 404)

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

    const isOwner = uid && uid === project.user_id
    if (!isOwner) return corsResponse({ error: 'Forbidden' }, origin, 403)

    const { data: commit, error } = await admin
      .from('project_commits')
      .select('id, message, content, branch, created_at')
      .eq('id', commitId)
      .eq('project_id', projectId)
      .single()
    if (error || !commit) return corsResponse({ error: 'Not found' }, origin, 404)

    return corsResponse({ data: commit }, origin, 200)
  } catch (error) {
    console.error('GET /api/projects/[id]/commits/[commitId] failed:', error)
    return corsResponse({ error: 'Internal server error' }, origin, 500)
  }
}


