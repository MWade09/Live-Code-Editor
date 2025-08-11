import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    // Identify requester
    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminIds = (process.env.NEXT_ADMIN_USER_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const isAdmin = !!userId && adminIds.includes(userId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch reports with related entities using service role (bypass RLS)
    const { data: reports, error } = await admin
      .from('project_reports')
      .select(`
        id, reason, status, created_at, updated_at,
        project_id,
        reporter_id,
        projects:projects(id, title, is_public, is_featured, status, user_id),
        reporter:user_profiles(id, username, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: reports || [] })
  } catch (error) {
    console.error('GET /api/admin/reports failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


