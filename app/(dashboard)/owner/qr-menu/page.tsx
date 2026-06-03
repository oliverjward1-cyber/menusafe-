import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QrMenuDisplay from './QrMenuDisplay'

export default async function QrMenuPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, slug')
    .eq('id', profile?.restaurant_id ?? '')
    .single()

  if (!restaurant) redirect('/owner')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-mise-ink">QR Menu</h1>
        <p className="text-mise-ink/50 mt-1">
          Print this QR code for customers to scan — no login required
        </p>
      </div>
      <QrMenuDisplay
        restaurantName={restaurant.name}
        restaurantSlug={restaurant.slug}
      />
    </div>
  )
}
