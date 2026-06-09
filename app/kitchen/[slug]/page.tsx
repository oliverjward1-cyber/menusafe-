import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PinEntry from './PinEntry'
import { HospoPilotLogo } from '@/components/HospoPilotLogo'

export default async function KitchenPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, staff_pin')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) notFound()

  return (
    <div className="min-h-screen bg-hospopilot-ink flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <HospoPilotLogo className="mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-display font-semibold text-white">{restaurant.name}</h1>
          <p className="text-sm text-white/50 mt-1">Staff portal</p>
        </div>

        {restaurant.staff_pin ? (
          <PinEntry slug={restaurant.slug} restaurantName={restaurant.name} />
        ) : (
          <div className="bg-white/10 rounded-2xl p-5 text-center">
            <p className="text-white/70 text-sm">No staff PIN has been set yet.</p>
            <p className="text-white/40 text-xs mt-1">Ask your manager to set one in Settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
