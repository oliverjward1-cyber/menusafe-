import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KitchenSettingsForm from './KitchenSettingsForm'
import SeedDemoDataButton from './SeedDemoDataButton'

export default async function KitchenSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, slug, staff_pin')
    .eq('id', profile?.restaurant_id ?? '')
    .single()

  if (!restaurant) redirect('/owner')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Kitchen portal</h1>
        <p className="text-hospopilot-ink/50 mt-1">Set the staff PIN and get the link for your kitchen team</p>
      </div>
      <KitchenSettingsForm
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        currentPin={restaurant.staff_pin ?? null}
      />
      <SeedDemoDataButton />
    </div>
  )
}
