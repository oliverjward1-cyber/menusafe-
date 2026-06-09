import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function planFromSubscription(sub: Stripe.Subscription): string | null {
  const meta = sub.metadata?.plan
  if (meta === 'compliance' || meta === 'compliance_kitchen') return meta
  return null
}

async function syncSubscription(sub: Stripe.Subscription) {
  const restaurantId = sub.metadata?.restaurant_id
  if (!restaurantId) return

  const admin = createAdminClient()
  const plan = planFromSubscription(sub)
  const currentPeriodEnd = (sub.items.data[0] as unknown as { current_period_end?: number })?.current_period_end ?? sub.start_date

  await admin.from('restaurants').update({
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    ...(plan ? { plan } : {}),
    subscription_ends_at: new Date(currentPeriodEnd * 1000).toISOString(),
  }).eq('id', restaurantId)
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const restaurantId = session.client_reference_id
        if (restaurantId && session.customer) {
          await admin.from('restaurants').update({
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer.id,
          }).eq('id', restaurantId)
        }
        if (session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          await syncSubscription(sub)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscription(sub)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.subscription
        if (subId) {
          const id = typeof subId === 'string' ? subId : subId.id
          const sub = await stripe.subscriptions.retrieve(id)
          const restaurantId = sub.metadata?.restaurant_id
          if (restaurantId) {
            await admin.from('restaurants').update({
              subscription_status: sub.status,
            }).eq('id', restaurantId)
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
