import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, getPlanByPriceId } from '@/lib/stripe'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const restaurantId = sub.metadata?.restaurant_id
      const plan = sub.metadata?.plan
      if (!restaurantId) break

      const priceId = sub.items.data[0]?.price.id
      const resolvedPlan = plan ?? getPlanByPriceId(priceId ?? '') ?? 'core'

      await adminSupabase.from('restaurants').update({
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        plan: resolvedPlan,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', restaurantId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const restaurantId = sub.metadata?.restaurant_id
      if (!restaurantId) break

      const priceId = sub.items.data[0]?.price.id
      const plan = sub.metadata?.plan ?? getPlanByPriceId(priceId ?? '') ?? 'core'

      await adminSupabase.from('restaurants').update({
        subscription_status: sub.status,
        plan,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', restaurantId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const restaurantId = sub.metadata?.restaurant_id
      if (!restaurantId) break

      await adminSupabase.from('restaurants').update({
        subscription_status: 'canceled',
        stripe_subscription_id: null,
      }).eq('id', restaurantId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const restaurantId = sub.metadata?.restaurant_id
      if (!restaurantId) break

      await adminSupabase.from('restaurants').update({
        subscription_status: 'past_due',
      }).eq('id', restaurantId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
