import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/nav/AppNav'
import { ViewSwitcher } from '@/components/nav/ViewSwitcher'
import { MobileNavWrapper } from '@/components/nav/MobileNavWrapper'

type Role = 'owner' | 'manager' | 'head_chef' | 'chef' | 'foh'

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

  // Normalise role — legacy 'chef' maps to 'chef', unknown roles default to 'chef'
  const validRoles: Role[] = ['owner', 'manager', 'head_chef', 'chef', 'foh']
  const role: Role = validRoles.includes(profile?.role as Role) ? (profile!.role as Role) : 'chef'

  const nav = (
    <AppNav
      restaurantName={restaurant?.name ?? ''}
      restaurantSlug={restaurant?.slug ?? ''}
      role={role}
    />
  )

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <ViewSwitcher menuUrl={menuUrl} />
      <MobileNavWrapper nav={nav}>{children}</MobileNavWrapper>
    </div>
  )
}
