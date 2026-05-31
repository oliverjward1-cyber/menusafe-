import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChefNav } from '@/components/nav/ChefNav'
import { OwnerNav } from '@/components/nav/OwnerNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    redirect('/signup')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('id', profile.restaurant_id)
    .single()

  if (!restaurant) {
    redirect('/signup')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {profile.role === 'chef' ? (
        <ChefNav restaurantName={restaurant.name} />
      ) : (
        <OwnerNav restaurantName={restaurant.name} restaurantSlug={restaurant.slug} />
      )}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
