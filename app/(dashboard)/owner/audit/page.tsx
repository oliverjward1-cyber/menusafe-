import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardCheck, CheckCircle2, AlertTriangle, XCircle, ChevronRight, TrendingUp } from 'lucide-react'

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

export default async function OwnerAuditPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id ?? ''

  const { data: audits } = await supabase
    .from('kitchen_audits')
    .select('id, completed_by, score, total, status, completed_at, notes')
    .eq('restaurant_id', rid)
    .order('completed_at', { ascending: false })

  const allAudits = audits ?? []
  const last4 = allAudits.slice(0, 4)
  const avgPct = last4.length
    ? Math.round(last4.reduce((s, a) => s + (a.total > 0 ? (a.score / a.total) * 100 : 100), 0) / last4.length)
    : null
  const redCount = allAudits.filter(a => a.status === 'red').length
  const lastAudit = allAudits[0]
  const daysSinceLast = lastAudit
    ? Math.floor((Date.now() - new Date(lastAudit.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-900">Kitchen Audits</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">EHO-readiness compliance record</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total audits</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{allAudits.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg score (last 4)</p>
          <p className={`text-3xl font-bold mt-1 ${avgPct == null ? 'text-gray-300' : avgPct >= 90 ? 'text-green-700' : avgPct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
            {avgPct != null ? `${avgPct}%` : '—'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed audits</p>
          <p className={`text-3xl font-bold mt-1 ${redCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>{redCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days since last</p>
          <p className={`text-3xl font-bold mt-1 ${daysSinceLast == null ? 'text-gray-300' : daysSinceLast > 7 ? 'text-amber-600' : 'text-green-700'}`}>
            {daysSinceLast != null ? daysSinceLast : '—'}
          </p>
          {daysSinceLast != null && daysSinceLast > 7 && (
            <p className="text-xs text-amber-600 mt-1">Audit overdue</p>
          )}
        </div>
      </div>

      {/* Audit list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Audit history</h2>
        </div>

        {allAudits.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No audits yet</p>
            <p className="text-xs text-gray-400 mt-1">Ask kitchen staff to complete the weekly audit from their dashboard</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allAudits.map(audit => {
              const pct = audit.total > 0 ? Math.round((audit.score / audit.total) * 100) : 100
              return (
                <Link key={audit.id} href={`/chef/audit/${audit.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      audit.status === 'green' ? 'bg-green-100 text-green-700' :
                      audit.status === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {pct}%
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{audit.completed_by}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(audit.completed_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{audit.score}/{audit.total} passed
                      </p>
                      {audit.notes && <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{audit.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={audit.status} />
                    <ChevronRight className="h-4 w-4 text-gray-300" />
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
