import Link from 'next/link'
import {
  CheckCircle2, XCircle, AlertTriangle, Thermometer,
  Sparkles, AlertOctagon, Users, ShieldCheck, ArrowRight,
} from 'lucide-react'

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export default function ManagerView({ data }: { data: any }) {
  const {
    tempStatus, cleaningDue, openIncidents, criticalIncidents,
    allAttempts, lastAudit, profiles, now,
  } = data

  const latestByStaff = new Map<string, any>()
  for (const a of allAttempts) {
    if (a.passed && !latestByStaff.has(a.staff_name)) latestByStaff.set(a.staff_name, a)
  }
  const trainedStaff = Array.from(latestByStaff.values())
  const expiredStaff = trainedStaff.filter(s => addMonths(new Date(s.completed_at), 6) < now)
  const validStaff = trainedStaff.filter(s => addMonths(new Date(s.completed_at), 6) >= now)

  const auditPct = lastAudit ? Math.round((lastAudit.score / lastAudit.total) * 100) : null
  const nextAuditDue = lastAudit ? addMonths(new Date(lastAudit.completed_at), 1) : null
  const auditOverdue = !lastAudit || (nextAuditDue && nextAuditDue < now)

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 font-medium">
        📋 Manager view — compliance & team oversight
      </div>

      {/* Today's compliance status */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-4 ${tempStatus?.amDone ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className={`h-4 w-4 ${tempStatus?.amDone ? 'text-green-600' : 'text-red-500'}`} />
            <p className="text-xs font-semibold text-mise-ink/60 uppercase tracking-wide">AM Temp</p>
          </div>
          {tempStatus?.amDone
            ? <p className="text-sm font-semibold text-green-700 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Logged</p>
            : <p className="text-sm font-semibold text-red-600 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Missing</p>}
        </div>
        <div className={`rounded-2xl border p-4 ${tempStatus?.pmDone ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className={`h-4 w-4 ${tempStatus?.pmDone ? 'text-green-600' : 'text-amber-500'}`} />
            <p className="text-xs font-semibold text-mise-ink/60 uppercase tracking-wide">PM Temp</p>
          </div>
          {tempStatus?.pmDone
            ? <p className="text-sm font-semibold text-green-700 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Logged</p>
            : <p className="text-sm font-semibold text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Pending</p>}
        </div>
        <div className={`rounded-2xl border p-4 ${cleaningDue === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`h-4 w-4 ${cleaningDue === 0 ? 'text-green-600' : 'text-amber-500'}`} />
            <p className="text-xs font-semibold text-mise-ink/60 uppercase tracking-wide">Cleaning</p>
          </div>
          <p className={`text-sm font-semibold ${cleaningDue === 0 ? 'text-green-700' : 'text-amber-700'}`}>
            {cleaningDue === 0 ? 'All done' : `${cleaningDue} task${cleaningDue !== 1 ? 's' : ''} outstanding`}
          </p>
        </div>
        <div className={`rounded-2xl border p-4 ${openIncidents.length === 0 ? 'bg-green-50 border-green-200' : criticalIncidents.length > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertOctagon className={`h-4 w-4 ${openIncidents.length === 0 ? 'text-green-600' : criticalIncidents.length > 0 ? 'text-red-500' : 'text-amber-500'}`} />
            <p className="text-xs font-semibold text-mise-ink/60 uppercase tracking-wide">Incidents</p>
          </div>
          <p className={`text-sm font-semibold ${openIncidents.length === 0 ? 'text-green-700' : criticalIncidents.length > 0 ? 'text-red-600' : 'text-amber-700'}`}>
            {openIncidents.length === 0 ? 'None open' : `${openIncidents.length} open${criticalIncidents.length > 0 ? ` (${criticalIncidents.length} critical)` : ''}`}
          </p>
        </div>
      </div>

      {/* Kitchen audit */}
      <div className={`rounded-2xl border p-4 ${auditOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-black/[0.06]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-4 w-4 ${auditOverdue ? 'text-red-500' : 'text-mise-mid'}`} />
            <p className="text-sm font-semibold text-mise-ink">Kitchen Audit</p>
          </div>
          <Link href="/chef/audit" className="text-xs text-mise-mid font-semibold hover:underline flex items-center gap-1">
            Run audit <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className={`text-xs mt-1 ${auditOverdue ? 'text-red-600' : 'text-mise-ink/50'}`}>
          {lastAudit
            ? `Last: ${auditPct}% on ${new Date(lastAudit.completed_at).toLocaleDateString('en-GB')}${auditOverdue ? ' — overdue' : ''}`
            : 'No audit on record'}
        </p>
      </div>

      {/* Staff training */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-semibold text-mise-ink">Staff Allergen Training</p>
          </div>
          <Link href="/owner/staff-quiz" className="text-xs text-mise-mid font-semibold hover:underline">View all</Link>
        </div>
        <div className="flex gap-4 text-center mb-3">
          <div>
            <p className="text-2xl font-bold text-green-600">{validStaff.length}</p>
            <p className="text-xs text-mise-ink/40">Valid</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${expiredStaff.length > 0 ? 'text-red-500' : 'text-mise-ink/20'}`}>{expiredStaff.length}</p>
            <p className="text-xs text-mise-ink/40">Expired</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-mise-ink/30">{profiles.length - trainedStaff.length > 0 ? profiles.length - trainedStaff.length : 0}</p>
            <p className="text-xs text-mise-ink/40">Not done</p>
          </div>
        </div>
        {expiredStaff.length > 0 && (
          <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">
            ⚠️ {expiredStaff.map(s => s.staff_name).join(', ')} — certification expired
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/owner/incidents', label: 'Incident log', icon: AlertOctagon },
          { href: '/owner/temperature-logs', label: 'Temp logs', icon: Thermometer },
          { href: '/owner/cleaning', label: 'Cleaning', icon: Sparkles },
          { href: '/owner/eho', label: 'EHO Mode', icon: ShieldCheck },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-xl px-3 py-3 text-sm font-medium text-mise-ink/70 hover:text-mise-ink hover:border-mise-mid/30 transition-all">
            <Icon className="h-4 w-4 text-mise-mid" /> {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
