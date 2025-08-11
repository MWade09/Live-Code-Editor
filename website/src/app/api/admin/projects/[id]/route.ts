import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const match = new URL(req.url).pathname.match(/\/api\/admin\/projects\/([^/]+)/)
    const id = match?.[1]
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminIds = (process.env.NEXT_ADMIN_USER_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const isAdmin = !!userId && adminIds.includes(userId)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const allowed: Record<string, unknown> = {}
    if (Object.prototype.hasOwnProperty.call(body, 'is_featured')) {
      allowed['is_featured'] = body['is_featured']
      allowed['featured_at'] = body['is_featured'] ? new Date().toISOString() : null
    }
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      allowed['status'] = body['status']
    }
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { error: upErr } = await admin.from('projects').update(allowed).eq('id', id)
    if (upErr) throw upErr
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/admin/projects/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


