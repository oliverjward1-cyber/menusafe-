import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrailClient from './TrailClient'

export default async function TrailPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id, full_name').eq('id', user.id).single()

  if (!profile?.restaurant_id) redirect('/owner')

  return (
    <TrailClient
      restaurantId={profile.restaurant_id}
      staffName={profile.full_name ?? 'You'}
    />
  )
}
