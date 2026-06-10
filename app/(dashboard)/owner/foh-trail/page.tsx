import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, ShieldAlert } from 'lucide-react'
import FohTrailClient from './FohTrailClient'
import Link from 'next/link'

export default async function FohTrailPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id, full_name, role').eq('id', user.id).single()

  if (!profile?.restaurant_id) redirect('/owner')

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-hospopilot-mid" />
            <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">FOH Daily Checks</h1>
          </div>
          <p className="text-sm text-hospopilot-ink/50 mt-0.5">{today}</p>
        </div>
        <Link
          href="/owner/trail"
          className="text-xs text-gray-500 hover:text-hospopilot-mid border border-gray-200 rounded-lg px-3 py-1.5"
        >
          Kitchen Trail →
        </Link>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Allergen reminder:</strong> Always verify allergen information with the kitchen before advising customers. Never guess — check the current allergen menu or ask a chef.
        </p>
      </div>

      <FohTrailClient
        restaurantId={profile.restaurant_id}
        staffName={profile.full_name ?? 'You'}
      />
    </div>
  )
}
