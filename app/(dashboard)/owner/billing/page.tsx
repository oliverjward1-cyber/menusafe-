import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PrintButton from '@/components/ui/PrintButton'
import PlanSelector from './PlanSelector'

const PLAN_LABELS: Record<string, string> = {
  core: 'Free / Trial',
  compliance: 'Compliance (£79/mo)',
  compliance_kitchen: 'Compliance + Kitchen (£129/mo)',
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Cancelled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  incomplete_expired: 'Incomplete (expired)',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single()

  const rid = profile?.restaurant_id
  if (!rid) redirect('/onboarding')

  if (profile?.role !== 'owner') {
    redirect('/owner')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('plan, subscription_status, trial_ends_at, subscription_ends_at')
    .eq('id', rid)
    .single()

  const plan = restaurant?.plan ?? 'core'
  const status = restaurant?.subscription_status ?? 'trialing'

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-mise-ink">Billing</h1>
          <p className="text-gray-500 mt-1">Manage your subscription and add-ons.</p>
        </div>
        <PrintButton label="Print" />
      </div>

      {searchParams.checkout === 'success' && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Thanks! Your subscription is being set up — this page will update shortly.
        </div>
      )}
      {searchParams.checkout === 'cancelled' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Checkout was cancelled — no changes were made.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-5 space-y-1">
        <p className="text-sm text-gray-500">Current plan</p>
        <p className="text-lg font-semibold text-mise-ink">{PLAN_LABELS[plan] ?? plan}</p>
        <p className="text-sm text-gray-500 mt-2">
          Status: <span className="font-medium text-mise-ink">{STATUS_LABELS[status] ?? status}</span>
        </p>
        {restaurant?.subscription_ends_at && (
          <p className="text-sm text-gray-500">
            Renews / ends: {new Date(restaurant.subscription_ends_at).toLocaleDateString('en-GB')}
          </p>
        )}
        {restaurant?.trial_ends_at && status === 'trialing' && (
          <p className="text-sm text-gray-500">
            Trial ends: {new Date(restaurant.trial_ends_at).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-mise-ink mb-4">Choose a plan</h2>
        <PlanSelector currentPlan={plan === 'core' ? null : plan} />
      </div>
    </div>
  )
}
