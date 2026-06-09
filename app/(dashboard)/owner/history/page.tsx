import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PrintButton from '@/components/ui/PrintButton'
import { History, Thermometer, Sparkles, Truck, AlertOctagon, ClipboardCheck, Flag } from 'lucide-react'

type HistoryEntry = {
  id: string
  type: 'temp' | 'cleaning' | 'delivery' | 'incident' | 'audit' | 'trail_flag'
  title: string
  detail: string
  by: string | null
  at: string
}

const TYPE_META: Record<HistoryEntry['type'], { label: string; icon: any; color: string }> = {
  temp: { label: 'Temperature check', icon: Thermometer, color: 'text-blue-600 bg-blue-50' },
  cleaning: { label: 'Cleaning', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
  delivery: { label: 'Delivery', icon: Truck, color: 'text-amber-600 bg-amber-50' },
  incident: { label: 'Incident', icon: AlertOctagon, color: 'text-red-600 bg-red-50' },
  audit: { label: 'Kitchen audit', icon: ClipboardCheck, color: 'text-mise-mid bg-mise-mid/10' },
  trail_flag: { label: 'Trail flag', icon: Flag, color: 'text-amber-600 bg-amber-50' },
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single()

  const rid = profile?.restaurant_id
  if (!rid) redirect('/onboarding')
  if (profile?.role === 'foh' || profile?.role === 'chef') redirect('/owner')

  const [{ data: temps }, { data: cleans }, { data: deliveries }, { data: incidents }, { data: audits }, { data: trailFlags }] =
    await Promise.all([
      supabase.from('temperature_logs').select('id, location, temperature, unit, check_type, recorded_by, logged_at').eq('restaurant_id', rid).order('logged_at', { ascending: false }).limit(100),
      supabase.from('cleaning_logs').select('id, task_name, signed_by, notes, completed_at').eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(100),
      supabase.from('delivery_records').select('id, supplier, condition, received_by, delivered_at').eq('restaurant_id', rid).order('delivered_at', { ascending: false }).limit(100),
      supabase.from('incidents').select('id, type, severity, title, reported_by, occurred_at').eq('restaurant_id', rid).order('occurred_at', { ascending: false }).limit(100),
      supabase.from('kitchen_audits').select('id, completed_by, score, total, status, completed_at').eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(100),
      supabase.from('ops_task_logs').select('id, title, flag_reason, completed_by, completed_at').eq('restaurant_id', rid).eq('status', 'flagged').order('completed_at', { ascending: false }).limit(100),
    ])

  const entries: HistoryEntry[] = [
    ...(temps ?? []).map((t): HistoryEntry => ({
      id: `temp-${t.id}`,
      type: 'temp',
      title: t.location,
      detail: `${t.temperature}°${t.unit ?? 'C'} · ${t.check_type ?? 'check'}`,
      by: t.recorded_by,
      at: t.logged_at,
    })),
    ...(cleans ?? []).map((c): HistoryEntry => ({
      id: `clean-${c.id}`,
      type: 'cleaning',
      title: c.task_name,
      detail: c.notes ?? 'Completed',
      by: c.signed_by,
      at: c.completed_at,
    })),
    ...(deliveries ?? []).map((d): HistoryEntry => ({
      id: `delivery-${d.id}`,
      type: 'delivery',
      title: d.supplier,
      detail: `Condition: ${d.condition}`,
      by: d.received_by,
      at: d.delivered_at,
    })),
    ...(incidents ?? []).map((i): HistoryEntry => ({
      id: `incident-${i.id}`,
      type: 'incident',
      title: i.title,
      detail: `${i.type} · ${i.severity}`,
      by: i.reported_by,
      at: i.occurred_at,
    })),
    ...(audits ?? []).map((a): HistoryEntry => ({
      id: `audit-${a.id}`,
      type: 'audit',
      title: 'Kitchen audit',
      detail: `${a.score}/${a.total} · ${a.status}`,
      by: a.completed_by,
      at: a.completed_at,
    })),
    ...(trailFlags ?? []).filter(t => t.completed_at).map((t): HistoryEntry => ({
      id: `trail-${t.id}`,
      type: 'trail_flag',
      title: t.title ?? 'Trail task',
      detail: t.flag_reason ?? 'Issue flagged',
      by: t.completed_by,
      at: t.completed_at,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const activeType = searchParams.type
  const filtered = activeType ? entries.filter((e) => e.type === activeType) : entries

  const filters: { key: string; label: string }[] = [
    { key: '', label: 'All' },
    { key: 'temp', label: 'Temperature' },
    { key: 'cleaning', label: 'Cleaning' },
    { key: 'delivery', label: 'Deliveries' },
    { key: 'incident', label: 'Incidents' },
    { key: 'audit', label: 'Audits' },
    { key: 'trail_flag', label: 'Trail flags' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-mise-mid" />
            <h1 className="text-2xl font-display font-semibold text-mise-ink">History</h1>
          </div>
          <p className="text-sm text-mise-ink/50 mt-0.5">Full record of past audits, checks and logs across the kitchen</p>
        </div>
        <PrintButton label="Print" />
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        {filters.map((f) => (
          <a
            key={f.key}
            href={f.key ? `/owner/history?type=${f.key}` : '/owner/history'}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              (activeType ?? '') === f.key
                ? 'bg-mise-mid text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {filtered.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No records found.</p>
        )}
        {filtered.map((entry) => {
          const meta = TYPE_META[entry.type]
          const Icon = meta.icon
          return (
            <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`inline-flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-mise-ink truncate">{entry.title}</p>
                <p className="text-xs text-gray-500 truncate">{meta.label} · {entry.detail}{entry.by ? ` · ${entry.by}` : ''}</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0">
                {new Date(entry.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
