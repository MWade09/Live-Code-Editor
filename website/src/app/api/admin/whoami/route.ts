import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id
    if (!userId) return NextResponse.json({ isAdmin: false }, { status: 200 })

    const adminIds = (process.env.NEXT_ADMIN_USER_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const isAdmin = adminIds.includes(userId)
    return NextResponse.json({ isAdmin }, { status: 200 })
  } catch (error) {
    console.error('GET /api/admin/whoami failed:', error)
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}


