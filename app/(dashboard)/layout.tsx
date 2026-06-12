import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/nav/AppNav'
import { ViewSwitcher } from '@/components/nav/ViewSwitcher'
import { MobileNavWrapper } from '@/components/nav/MobileNavWrapper'
import { DevPanel } from '@/components/dev/DevPanel'
import { ImpersonationBanner } from '@/components/dev/ImpersonationBanner'
import { getDevContext } from '@/lib/dev/context'

type Role = 'owner' | 'manager' | 'head_chef' | 'chef' | 'foh'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role, restaurant_id, is_developer').eq('id', user.id).single()
    : { data: null }

  const devCtx = user ? await getDevContext() : null

  // Fall back to cookie-based restaurant (testing / no-auth mode)
  const restaurantId = devCtx?.restaurantId ?? profile?.restaurant_id ?? cookies().get('msafe_rid')?.value ?? null

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
  const role: Role = devCtx?.role ?? (validRoles.includes(profile?.role as Role) ? (profile!.role as Role) : 'chef')

  const isDeveloper = !!devCtx?.isDeveloper
  const isImpersonating = !!devCtx?.isImpersonating

  const nav = (
    <AppNav
      restaurantName={restaurant?.name ?? ''}
      restaurantSlug={restaurant?.slug ?? ''}
      role={role}
      isDeveloper={isDeveloper}
    />
  )

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <ViewSwitcher
        menuUrl={menuUrl}
        extra={isDeveloper ? <DevPanel currentRole={role} currentRestaurantId={restaurantId} /> : null}
      />
      {isImpersonating && (
        <ImpersonationBanner role={role} restaurantName={restaurant?.name ?? ''} />
      )}
      <MobileNavWrapper nav={nav} extra={isDeveloper ? <DevPanel currentRole={role} currentRestaurantId={restaurantId} /> : null}>{children}</MobileNavWrapper>
    </div>
  )
}
