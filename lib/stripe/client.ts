import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export const PLAN_PRICES = {
  compliance: process.env.STRIPE_PRICE_COMPLIANCE!,
  compliance_kitchen: process.env.STRIPE_PRICE_COMPLIANCE_KITCHEN!,
} as const

export const ADDITIONAL_SITE_PRICE = process.env.STRIPE_PRICE_ADDITIONAL_SITE!

export type PlanKey = keyof typeof PLAN_PRICES

export function isPlanKey(value: string): value is PlanKey {
  return value in PLAN_PRICES
}
