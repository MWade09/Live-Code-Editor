import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MyProjectsContent from '@/components/projects/my-projects-content'

export default async function MyProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/my-projects')
  }

  return <MyProjectsContent userId={user!.id} />
}


