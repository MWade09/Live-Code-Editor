import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled Project'
    const content = typeof body.content === 'string' ? body.content : ''
    const is_public = false
    const status = 'draft'
    const language = typeof body.language === 'string' ? body.language : 'HTML'

    const { data: created, error } = await admin
      .from('projects')
      .insert({ user_id: userId, title, content, is_public, status, language })
      .select('id')
      .single()

    if (error || !created) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })

    return NextResponse.json({ id: created.id })
  } catch (error) {
    console.error('POST /api/projects failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


