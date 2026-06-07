import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Truck, Plus } from 'lucide-react'
import DeliveryForm from './DeliveryForm'
import PrintButton from '@/components/ui/PrintButton'

const CONDITION_LABELS: Record<string, { label: string; className: string }> = {
  acceptable: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  borderline: { label: 'Borderline', className: 'bg-amber-100 text-amber-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
}

export default async function DeliveriesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id ?? ''

  const { data: records } = await supabase
    .from('delivery_records')
    .select('*')
    .eq('restaurant_id', rid)
    .order('delivered_at', { ascending: false })
    .limit(50)

  const allRecords = records ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner" className="text-mise-ink/40 hover:text-mise-ink transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-semibold text-mise-ink flex items-center gap-2">
              <Truck className="h-6 w-6 text-mise-mid" />
              Delivery Records
            </h1>
            <p className="text-sm text-mise-ink/50 mt-0.5">Log deliveries with temperature, condition and supplier</p>
          </div>
        </div>
        <PrintButton label="Print log" />
      </div>

      {/* New delivery */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm no-print">
        <h2 className="text-base font-semibold text-mise-ink mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-mise-mid" /> Log a delivery
        </h2>
        <DeliveryForm restaurantId={rid} staffName={user.email?.split('@')[0] ?? ''} />
      </div>

      {/* History */}
      {allRecords.length === 0 ? (
        <div className="text-center py-12 text-mise-ink/40 text-sm">
          No deliveries logged yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-black/[0.04]">
            <p className="text-sm font-semibold text-mise-ink">Delivery log</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.04]">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Supplier</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Items</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Temp</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Condition</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">By</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-mise-ink/40 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map(rec => {
                const cond = CONDITION_LABELS[rec.condition] ?? CONDITION_LABELS.acceptable
                return (
                  <tr key={rec.id} className="border-b border-black/[0.04] last:border-0 hover:bg-mise-cream/20">
                    <td className="px-5 py-3 font-medium text-mise-ink">{rec.supplier}</td>
                    <td className="px-5 py-3 text-mise-ink/70 max-w-xs truncate">{rec.items}</td>
                    <td className="px-5 py-3 font-mono text-mise-ink/70">
                      {rec.temperature != null ? `${rec.temperature}°C` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cond.className}`}>
                        {cond.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-mise-ink/60">{rec.received_by}</td>
                    <td className="px-5 py-3 text-mise-ink/40">
                      {new Date(rec.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
