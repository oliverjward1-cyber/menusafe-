'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    key: 'compliance',
    name: 'Compliance',
    price: '£79/mo',
    description: 'EHO readiness, allergen management, temp logs, cleaning, incident reporting and more.',
    highlights: ['EHO Inspection Mode', 'Full allergen matrix', 'Staff training & quizzes', 'Printable compliance sheets'],
  },
  {
    key: 'compliance_kitchen',
    name: 'Compliance + Kitchen',
    price: '£129/mo',
    description: 'Everything in Compliance, plus a full recipe and menu management suite with GP costing.',
    highlights: ['Everything in Compliance', 'Recipe builder & GP calculator', 'Menu management', 'Kitchen audit scoring'],
  },
] as const

export default function PlanSelector({ currentPlan }: { currentPlan: string | null }) {
  const [plan, setPlan] = useState<typeof PLANS[number]['key']>(
    currentPlan === 'compliance_kitchen' ? 'compliance_kitchen' : 'compliance'
  )
  const [additionalSites, setAdditionalSites] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, additionalSites }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch (err) {
      setError('Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {PLANS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPlan(p.key)}
            className={cn(
              'text-left p-4 rounded-xl border-2 transition-colors space-y-3',
              plan === p.key ? 'border-mise-mid bg-mise-mid/5' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div>
              <p className="font-display text-lg font-semibold text-mise-ink">{p.name}</p>
              <p className="text-2xl font-bold text-mise-mid mt-1">{p.price}</p>
              <p className="text-sm text-gray-500 mt-2">{p.description}</p>
            </div>
            <ul className="space-y-1">
              {p.highlights.map(h => (
                <li key={h} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-mise-mid shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
            <Link
              href="/owner/billing/plans"
              onClick={e => e.stopPropagation()}
              className="inline-block text-xs font-semibold text-mise-mid hover:text-mise-deep underline underline-offset-2"
            >
              See full feature list →
            </Link>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="additionalSites" className="text-sm font-medium text-mise-ink">
          Additional sites <span className="text-gray-400 font-normal">(+£50/mo each)</span>
        </label>
        <input
          id="additionalSites"
          type="number"
          min={0}
          value={additionalSites}
          onChange={(e) => setAdditionalSites(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={handleCheckout} loading={loading} size="lg">
        {currentPlan ? 'Update subscription' : 'Subscribe'}
      </Button>
    </div>
  )
}
