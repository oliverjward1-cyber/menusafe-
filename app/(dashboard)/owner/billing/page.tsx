import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import PrintButton from '@/components/ui/PrintButton'
import PlanSelector from './PlanSelector'
import { FileText, Download } from 'lucide-react'

const PLAN_LABELS: Record<string, string> = {
  core: 'Free / Trial',
  compliance: 'Compliance',
  compliance_kitchen: 'Compliance + Kitchen',
}

const PLAN_PRICES: Record<string, string> = {
  compliance: '£79/mo',
  compliance_kitchen: '£129/mo',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing:             { label: 'Trial',             color: 'bg-blue-100 text-blue-700' },
  active:               { label: 'Active',            color: 'bg-green-100 text-green-700' },
  past_due:             { label: 'Past due',          color: 'bg-red-100 text-red-700' },
  canceled:             { label: 'Cancelled',         color: 'bg-gray-100 text-gray-500' },
  unpaid:               { label: 'Unpaid',            color: 'bg-red-100 text-red-700' },
  incomplete:           { label: 'Incomplete',        color: 'bg-amber-100 text-amber-700' },
  incomplete_expired:   { label: 'Expired',           color: 'bg-gray-100 text-gray-500' },
}

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  paid:       { label: 'Paid',    color: 'bg-green-100 text-green-700' },
  open:       { label: 'Open',    color: 'bg-amber-100 text-amber-700' },
  void:       { label: 'Void',    color: 'bg-gray-100 text-gray-500' },
  uncollectible: { label: 'Unpaid', color: 'bg-red-100 text-red-700' },
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
    .from('profiles').select('role, restaurant_id').eq('id', user.id).single()

  const rid = profile?.restaurant_id
  if (!rid) redirect('/onboarding')
  if (profile?.role !== 'owner') redirect('/owner')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('plan, subscription_status, trial_ends_at, subscription_ends_at, stripe_customer_id')
    .eq('id', rid)
    .single()

  const plan = restaurant?.plan ?? 'core'
  const status = restaurant?.subscription_status ?? 'trialing'
  const statusMeta = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }

  // Fetch invoices from Stripe if customer exists
  type InvoiceRow = {
    id: string
    number: string | null
    date: number
    amount: number
    currency: string
    status: string
    pdf: string | null
    hostedUrl: string | null
    periodStart: number
    periodEnd: number
  }

  let invoices: InvoiceRow[] = []
  if (restaurant?.stripe_customer_id) {
    try {
      const stripe = getStripe()
      const list = await stripe.invoices.list({
        customer: restaurant.stripe_customer_id,
        limit: 12,
      })
      invoices = list.data.map(inv => ({
        id: inv.id,
        number: inv.number,
        date: inv.created,
        amount: inv.amount_paid ?? inv.amount_due,
        currency: inv.currency,
        status: inv.status ?? 'unknown',
        pdf: inv.invoice_pdf ?? null,
        hostedUrl: inv.hosted_invoice_url ?? null,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
      }))
    } catch {
      // non-blocking — show page without invoices
    }
  }

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-mise-ink">Billing</h1>
          <p className="text-gray-500 mt-1">Manage your subscription and view invoices.</p>
        </div>
        <PrintButton label="Print" />
      </div>

      {searchParams.checkout === 'success' && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Thanks! Your subscription is being set up — this page will update shortly.
        </div>
      )}
      {searchParams.checkout === 'cancelled' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Checkout was cancelled — no changes were made.
        </div>
      )}

      {/* Current plan */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Current plan</p>
            <p className="text-xl font-semibold text-mise-ink">
              {PLAN_LABELS[plan] ?? plan}
              {PLAN_PRICES[plan] && <span className="ml-2 text-base font-normal text-gray-500">{PLAN_PRICES[plan]}</span>}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          {restaurant?.subscription_ends_at && (
            <p>Next renewal: <span className="font-medium text-mise-ink">{new Date(restaurant.subscription_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          )}
          {restaurant?.trial_ends_at && status === 'trialing' && (
            <p>Trial ends: <span className="font-medium text-mise-ink">{new Date(restaurant.trial_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          )}
        </div>
      </div>

      {/* Invoice history */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-mise-mid" />
          <h2 className="font-semibold text-mise-ink">Invoice history</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            {restaurant?.stripe_customer_id
              ? 'No invoices yet — they will appear here once your first billing cycle completes.'
              : 'No billing account set up yet. Subscribe below to get started.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              <span>Invoice</span>
              <span>Period</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {invoices.map(inv => {
              const invMeta = INVOICE_STATUS[inv.status] ?? { label: inv.status, color: 'bg-gray-100 text-gray-500' }
              return (
                <div key={inv.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-3.5 items-center">
                  <div>
                    <p className="text-sm font-medium text-mise-ink">{inv.number ?? inv.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(inv.date * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="hidden sm:block text-sm text-gray-500">
                    {new Date(inv.periodStart * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(inv.periodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-sm font-semibold text-mise-ink">
                    {formatAmount(inv.amount, inv.currency)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${invMeta.color}`}>
                      {invMeta.label}
                    </span>
                    {inv.pdf && (
                      <a
                        href={inv.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep font-medium no-print"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Change plan */}
      <div className="no-print">
        <h2 className="font-display text-xl font-semibold text-mise-ink mb-4">Change plan</h2>
        <PlanSelector currentPlan={plan === 'core' ? null : plan} />
      </div>
    </div>
  )
}
