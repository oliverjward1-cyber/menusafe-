import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  if (status === 'green') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Pass
    </span>
  )
  if (status === 'amber') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      <AlertTriangle className="h-3.5 w-3.5" /> Advisory
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
      <XCircle className="h-3.5 w-3.5" /> Action required
    </span>
  )
}

export default async function AuditListPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const restaurantId = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value
  if (!restaurantId) redirect('/onboarding')

  const { data: audits } = await supabase
    .from('kitchen_audits')
    .select('id, completed_by, score, total, status, completed_at')
    .eq('restaurant_id', restaurantId)
    .order('completed_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-700" />
            <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Kitchen Audits</h1>
          </div>
          <p className="text-sm text-hospopilot-ink/50 mt-0.5">Weekly EHO-readiness checklist</p>
        </div>
        <Link
          href="/chef/audit/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-hospopilot-gold hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" /> Start audit
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        {!audits || audits.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-hospopilot-ink/50">No audits completed yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete your first weekly kitchen audit to start building your compliance record</p>
            <Link href="/chef/audit/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-hospopilot-mid hover:text-hospopilot-deep mt-3">
              Start first audit →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {audits.map(audit => {
              const pct = audit.total > 0 ? Math.round((audit.score / audit.total) * 100) : 100
              return (
                <Link key={audit.id} href={`/chef/audit/${audit.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      audit.status === 'green' ? 'bg-green-100 text-green-700' :
                      audit.status === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {pct}%
                    </div>
                    <div>
                      <p className="text-sm font-medium text-hospopilot-ink">{audit.completed_by}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(audit.completed_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{audit.score}/{audit.total} passed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={audit.status} />
                    <ChevronRight className="h-4 w-4 text-hospopilot-ink/20" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
