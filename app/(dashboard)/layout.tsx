import { createClient } from '@/lib/supabase/server'
import { ChefNav } from '@/components/nav/ChefNav'
import { OwnerNav } from '@/components/nav/OwnerNav'
import { ViewSwitcher } from '@/components/nav/ViewSwitcher'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role, restaurant_id').eq('id', user.id).single()
    : { data: null }

  const { data: restaurant } = profile?.restaurant_id
    ? await supabase.from('restaurants').select('id, name, slug').eq('id', profile.restaurant_id).single()
    : { data: null }

  const menuUrl = restaurant?.slug ? `/menu/${restaurant.slug}` : '/menu'

  return (
    <div className="flex flex-col min-h-screen">
      <ViewSwitcher menuUrl={menuUrl} />
      <div className="flex flex-col md:flex-row flex-1">
        {profile?.role === 'chef' ? (
          <ChefNav restaurantName={restaurant?.name ?? ''} />
        ) : (
          <OwnerNav restaurantName={restaurant?.name ?? ''} restaurantSlug={restaurant?.slug ?? ''} />
        )}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
