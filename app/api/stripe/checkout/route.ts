import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLAN_PRICES, ADDITIONAL_SITE_PRICE, isPlanKey } from '@/lib/stripe/client'

export async function POST(request: Request) {
  try {
    const { plan, additionalSites } = await request.json()

    if (!plan || !isPlanKey(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const extraSites = Number.isFinite(additionalSites) && additionalSites > 0 ? Math.floor(additionalSites) : 0

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role, restaurant_id').eq('id', user.id).single()

    if (profile?.role !== 'owner' || !profile.restaurant_id) {
      return NextResponse.json({ error: 'Forbidden: only owners can manage billing' }, { status: 403 })
    }

    const { data: restaurant } = await supabase
      .from('restaurants').select('id, name, stripe_customer_id').eq('id', profile.restaurant_id).single()

    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

    const lineItems: { price: string; quantity: number }[] = [
      { price: PLAN_PRICES[plan], quantity: 1 },
    ]
    if (extraSites > 0) {
      lineItems.push({ price: ADDITIONAL_SITE_PRICE, quantity: extraSites })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      customer: restaurant.stripe_customer_id ?? undefined,
      customer_email: restaurant.stripe_customer_id ? undefined : user.email,
      client_reference_id: restaurant.id,
      subscription_data: {
        metadata: { restaurant_id: restaurant.id, plan },
      },
      success_url: `${siteUrl}/owner/billing?checkout=success`,
      cancel_url: `${siteUrl}/owner/billing?checkout=cancelled`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
