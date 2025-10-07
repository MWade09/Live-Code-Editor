import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIUsageContent } from '@/components/profile/ai-usage-content'

export default async function AIUsagePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch AI usage data
  const { data: usageData, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching AI usage:', error)
  }

  return <AIUsageContent usageData={usageData || []} />
}
