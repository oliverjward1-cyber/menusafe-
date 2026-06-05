import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PLANS, type PlanKey } from '@/lib/stripe'
import BillingClient from './BillingClient'

export const metadata = { title: 'Billing — mise' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')

  const { data: restaurant } = await adminSupabase
    .from('restaurants')
    .select('subscription_status, plan, trial_ends_at, current_period_end, stripe_subscription_id, stripe_customer_id')
    .eq('id', profile.restaurant_id)
    .single()

  const status = restaurant?.subscription_status ?? 'trialing'
  const currentPlan = (restaurant?.plan ?? 'core') as PlanKey
  const trialEndsAt = restaurant?.trial_ends_at ?? null
  const currentPeriodEnd = restaurant?.current_period_end ?? null
  const hasCustomer = !!restaurant?.stripe_customer_id

  return (
    <BillingClient
      status={status}
      currentPlan={currentPlan}
      trialEndsAt={trialEndsAt}
      currentPeriodEnd={currentPeriodEnd}
      hasCustomer={hasCustomer}
      plans={PLANS}
      success={!!searchParams.success}
      canceled={!!searchParams.canceled}
    />
  )
}
