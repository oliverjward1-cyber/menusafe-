import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export const PLANS = {
  core: {
    name: 'mise Core',
    price: 49_00, // pence
    stripePriceId: process.env.STRIPE_PRICE_CORE!,
    description: 'Allergens, menus & QR for a single site.',
    features: ['Allergen matrix', 'QR customer menu', 'Owen\'s Law compliance', 'Staff training & quiz', 'Kitchen compliance portal'],
  },
  plus: {
    name: 'mise Plus',
    price: 79_00,
    stripePriceId: process.env.STRIPE_PRICE_PLUS!,
    description: 'Adds recipe costing, GP% and advanced compliance.',
    features: ['Everything in Core', 'Recipe costing & GP%', 'Invoice AI scanner', 'EHO inspection mode', 'HACCP & probe calibration', 'Incident reporting'],
  },
  multi: {
    name: 'mise Multi-site',
    price: 129_00,
    stripePriceId: process.env.STRIPE_PRICE_MULTI!,
    description: 'Everything in Plus across up to 5 venues.',
    features: ['Everything in Plus', 'Up to 5 venues', 'Centralised reporting', 'Priority support'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) return key as PlanKey
  }
  return null
}
