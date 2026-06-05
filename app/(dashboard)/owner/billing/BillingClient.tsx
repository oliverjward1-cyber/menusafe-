'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanKey } from '@/lib/stripe'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing:   { label: 'Free trial',  color: 'text-blue-400' },
  active:     { label: 'Active',      color: 'text-green-400' },
  past_due:   { label: 'Past due',    color: 'text-yellow-400' },
  canceled:   { label: 'Canceled',    color: 'text-red-400' },
  paused:     { label: 'Paused',      color: 'text-gray-400' },
  incomplete: { label: 'Incomplete',  color: 'text-orange-400' },
}

type Plan = {
  name: string
  price: number
  description: string
  features: readonly string[]
}

type Props = {
  status: string
  currentPlan: PlanKey
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  hasCustomer: boolean
  plans: Record<string, Plan>
  success: boolean
  canceled: boolean
}

export default function BillingClient({
  status,
  currentPlan,
  trialEndsAt,
  currentPeriodEnd,
  hasCustomer,
  plans,
  success,
  canceled,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const statusMeta = STATUS_LABELS[status] ?? { label: status, color: 'text-gray-400' }

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  async function handleCheckout(plan: PlanKey) {
    setLoading(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  async function handlePortal() {
    setLoading('portal')
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  const isActive = status === 'active' || status === 'trialing'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your mise subscription</p>
      </div>

      {success && (
        <div className="rounded-lg bg-green-900/40 border border-green-700/40 px-4 py-3 text-green-300 text-sm">
          Subscription activated — welcome to mise!
        </div>
      )}
      {canceled && (
        <div className="rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-gray-300 text-sm">
          Checkout canceled. Your plan has not changed.
        </div>
      )}

      {/* Current plan summary */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current plan</p>
            <p className="text-xl font-semibold text-white">{plans[currentPlan]?.name ?? currentPlan}</p>
          </div>
          <span className={`text-sm font-medium ${statusMeta.color}`}>{statusMeta.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {trialEndsAt && status === 'trialing' && (
            <div>
              <p className="text-gray-500">Trial ends</p>
              <p className="text-white">{fmt(trialEndsAt)}</p>
            </div>
          )}
          {currentPeriodEnd && status !== 'trialing' && (
            <div>
              <p className="text-gray-500">Next billing date</p>
              <p className="text-white">{fmt(currentPeriodEnd)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Monthly cost</p>
            <p className="text-white">£{((plans[currentPlan]?.price ?? 0) / 100).toFixed(2)}</p>
          </div>
        </div>

        {hasCustomer && (
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
          >
            {loading === 'portal' ? 'Opening…' : 'Manage billing & invoices →'}
          </button>
        )}
      </div>

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.entries(plans) as [PlanKey, Plan][]).map(([key, plan]) => {
            const isCurrent = key === currentPlan && isActive
            return (
              <div
                key={key}
                className={`rounded-xl border p-5 flex flex-col gap-4 ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-950/40'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-white">{plan.name}</p>
                    {isCurrent && (
                      <span className="text-xs bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    £{(plan.price / 100).toFixed(0)}
                    <span className="text-sm font-normal text-gray-400">/mo</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-1 text-xs text-gray-300 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(key)}
                  disabled={isCurrent || !!loading}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-gray-800 text-gray-500 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'
                  }`}
                >
                  {loading === key
                    ? 'Loading…'
                    : isCurrent
                    ? 'Current plan'
                    : status === 'trialing'
                    ? 'Start with this plan'
                    : 'Switch to this plan'}
                </button>
              </div>
            )
          })}
        </div>
        {status === 'trialing' && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            14-day free trial included · No card required during trial
          </p>
        )}
      </div>
    </div>
  )
}
