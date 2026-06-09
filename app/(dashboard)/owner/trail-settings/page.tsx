import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrailSettingsClient from './TrailSettingsClient'

export default async function TrailSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')

  const { data: templates } = await supabase
    .from('ops_task_templates')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('sort_order')

  return (
    <TrailSettingsClient
      restaurantId={profile.restaurant_id}
      initialTemplates={templates ?? []}
    />
  )
}
