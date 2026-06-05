import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mise.kitchen'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  const { data: restaurant } = await adminSupabase
    .from('restaurants')
    .select('id, name, stripe_customer_id')
    .eq('id', profile.restaurant_id)
    .single()
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  // Create or reuse Stripe customer
  let customerId = restaurant.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: restaurant.name,
      metadata: { restaurant_id: restaurant.id },
    })
    customerId = customer.id
    await adminSupabase.from('restaurants').update({ stripe_customer_id: customerId }).eq('id', restaurant.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].stripePriceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { restaurant_id: restaurant.id, plan },
    },
    success_url: `${SITE_URL}/owner/billing?success=1`,
    cancel_url: `${SITE_URL}/owner/billing?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return NextResponse.json({ url: session.url })
}
