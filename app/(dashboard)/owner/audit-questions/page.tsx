import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuditQuestionsManager from './AuditQuestionsManager'

export default async function AuditQuestionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/login')

  return <AuditQuestionsManager restaurantId={profile.restaurant_id} />
}
