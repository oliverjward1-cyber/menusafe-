import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ChefNav } from '@/components/nav/ChefNav'
import { OwnerNav } from '@/components/nav/OwnerNav'
import { ViewSwitcher } from '@/components/nav/ViewSwitcher'
import { MobileNavWrapper } from '@/components/nav/MobileNavWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single()
    : { data: null }

  // Fall back to cookie-based restaurant (testing / no-auth mode)
  const restaurantId = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value ?? null

  const { data: restaurant } = restaurantId
    ? await supabase.from('restaurants').select('id, name, slug').eq('id', restaurantId).single()
    : { data: null }

  const menuUrl = restaurant?.slug ? `/menu/${restaurant.slug}` : '/menu'

  // No restaurant set up at all — send to onboarding
  if (!restaurantId) {
    const { redirect } = await import('next/navigation')
    redirect('/onboarding')
  }

  const nav = profile?.role === 'chef'
    ? <ChefNav restaurantName={restaurant?.name ?? ''} />
    : <OwnerNav restaurantName={restaurant?.name ?? ''} restaurantSlug={restaurant?.slug ?? ''} />

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <ViewSwitcher menuUrl={menuUrl} />
      <MobileNavWrapper nav={nav}>{children}</MobileNavWrapper>
    </div>
  )
}
