import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Flag, Clock, Thermometer, ClipboardList, Sparkles, Truck, FileText, FlaskConical } from 'lucide-react'
import PrintButton from '@/components/ui/PrintButton'

const COOKING_TYPE_LABELS: Record<string, string> = {
  cooking: 'Cooking',
  hot_holding: 'Hot holding',
}

const TYPE_LABEL: Record<string, string> = {
  checklist: 'Checklist',
  temperature: 'Temperature',
  cleaning: 'Cleaning',
  delivery: 'Delivery',
  custom: 'Custom',
  calibration: 'Calibration',
}

const TYPE_ICON: Record<string, any> = {
  checklist: ClipboardList,
  temperature: Thermometer,
  cleaning: Sparkles,
  delivery: Truck,
  custom: FileText,
  calibration: FlaskConical,
}

function fmt(time: string | null) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
}

function TaskDetail({ task }: { task: any }) {
  const Icon = TYPE_ICON[task.task_type] ?? FileText
  const isDone = task.status === 'done'
  const isFlagged = task.status === 'flagged'
  const isPending = task.status === 'pending'

  const data = task.data ?? {}

  return (
    <div className={`rounded-2xl border p-4 space-y-3
      ${isDone ? 'border-green-200 bg-green-50' : isFlagged ? 'border-amber-200 bg-amber-50' : 'border-black/[0.06] bg-white'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
          ${isDone ? 'bg-green-100' : isFlagged ? 'bg-amber-100' : 'bg-gray-100'}`}>
          <Icon className={`h-4 w-4 ${isDone ? 'text-green-600' : isFlagged ? 'text-amber-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-hospopilot-ink text-sm">{task.title}</p>
            {task.scheduled_time && (
              <span className="text-[11px] text-hospopilot-ink/30">{fmt(task.scheduled_time)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isDone && <span className="text-xs text-green-600">✓ Done by {task.completed_by}</span>}
            {isFlagged && <span className="text-xs text-amber-600">⚑ Flagged by {task.completed_by}</span>}
            {isPending && <span className="text-xs text-gray-400">Not completed</span>}
            {task.completed_at && (
              <span className="text-xs text-hospopilot-ink/30">
                · {new Date(task.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isDone ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : isFlagged ? <Flag className="h-5 w-5 text-amber-500 fill-amber-500" />
            : <Clock className="h-5 w-5 text-gray-300" />}
        </div>
      </div>

      {/* Temperature readings */}
      {task.task_type === 'temperature' && data.readings && data.readings.length > 0 && (
        <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
          {data.readings.map((r: any, i: number) => {
            const temp = parseFloat(r.temperature)
            const isCold = r.location?.toLowerCase().includes('freezer')
            const outOfRange = isCold ? temp > -18 : temp > 8
            return (
              <div key={i} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-hospopilot-ink">{r.location}</span>
                <span className={`text-sm font-mono font-semibold ${outOfRange ? 'text-red-600' : 'text-green-600'}`}>
                  {r.temperature}°C {outOfRange ? '⚠' : '✓'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Checklist answers */}
      {task.task_type === 'checklist' && data.checks && (
        <div className="space-y-1">
          {Object.entries(data.checks).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {val
                ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                : <Clock className="h-4 w-4 text-gray-300 flex-shrink-0" />}
              <span className={val ? 'text-hospopilot-ink' : 'text-hospopilot-ink/40 line-through'}>{key}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calibration results */}
      {task.task_type === 'calibration' && data.ice_point != null && (
        <div className="bg-white rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
          {[
            { label: 'Ice point', value: data.ice_point, pass: data.ice_point >= -1 && data.ice_point <= 1, unit: '°C (–1 to +1)' },
            { label: 'Boiling point', value: data.boiling_point, pass: data.boiling_point >= 99 && data.boiling_point <= 101, unit: '°C (99 to 101)' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm text-hospopilot-ink">{r.label} <span className="text-xs text-hospopilot-ink/40">{r.unit}</span></span>
              <span className={`text-sm font-mono font-semibold ${r.pass ? 'text-green-600' : 'text-red-600'}`}>
                {r.value}°C {r.pass ? '✓' : '⚠'}
              </span>
            </div>
          ))}
          <div className={`px-3 py-2.5 text-sm font-semibold ${data.pass ? 'text-green-700' : 'text-red-700'}`}>
            {data.pass ? '✓ Probe passed calibration' : '✗ Probe FAILED calibration'}
          </div>
        </div>
      )}

      {/* Flag reason */}
      {isFlagged && task.flag_reason && (
        <div className="bg-amber-100 rounded-xl px-3 py-2 text-sm text-amber-800">
          <span className="font-medium">Issue: </span>{task.flag_reason}
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <p className="text-xs text-hospopilot-ink/50 italic">{task.notes}</p>
      )}
    </div>
  )
}

export default async function TrailDayPage({ params }: { params: { date: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')

  const rid = profile.restaurant_id
  const dateStr = params.date

  const dayStart = `${dateStr}T00:00:00`
  const dayEnd = `${dateStr}T23:59:59.999`

  const [{ data: summary }, { data: tasks }, { data: cookingTemps }, { data: cleaningLogs }] = await Promise.all([
    supabase.from('ops_trail_summaries').select('*').eq('restaurant_id', rid).eq('trail_date', dateStr).single(),
    supabase.from('ops_task_logs').select('*').eq('restaurant_id', rid).eq('scheduled_date', dateStr).order('sort_order'),
    supabase.from('temperature_logs').select('*').eq('restaurant_id', rid).in('check_type', ['cooking', 'hot_holding']).gte('logged_at', dayStart).lte('logged_at', dayEnd).order('logged_at'),
    supabase.from('cleaning_logs').select('*').eq('restaurant_id', rid).gte('completed_at', dayStart).lte('completed_at', dayEnd).order('completed_at'),
  ])

  const date = new Date(dateStr + 'T12:00:00')
  const pct = summary ? Math.round((summary.completed_tasks / summary.total_tasks) * 100) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/owner/trail-history" className="text-hospopilot-ink/40 hover:text-hospopilot-ink transition-colors no-print">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-hospopilot-ink">
              {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
            {summary && (
              <p className="text-hospopilot-ink/50 text-sm">
                Submitted by {summary.submitted_by} · {pct}% complete
                {summary.flagged_tasks > 0 && ` · ${summary.flagged_tasks} flagged`}
              </p>
            )}
            {!summary && (
              <p className="text-amber-600 text-sm">Trail not submitted — showing partial records</p>
            )}
          </div>
        </div>
        <PrintButton label="Print day" />
      </div>

      {summary?.notes && (
        <div className="bg-gray-50 border border-black/[0.06] rounded-2xl px-4 py-3 text-sm text-hospopilot-ink/60 italic">
          {summary.notes}
        </div>
      )}

      {(!tasks || tasks.length === 0) && (
        <div className="text-center py-12 text-hospopilot-ink/40">
          <p className="text-sm">No task records found for this day.</p>
        </div>
      )}

      <div className="space-y-3">
        {tasks?.map(task => <TaskDetail key={task.id} task={task} />)}
      </div>

      {/* Cooking & hot holding temperature checks */}
      {cookingTemps && cookingTemps.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-hospopilot-ink flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-hospopilot-mid" /> Cooking Temp Checks
          </h2>
          <div className="bg-white rounded-2xl border border-black/[0.06] divide-y divide-black/[0.04] overflow-hidden">
            {cookingTemps.map(log => (
              <div key={log.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-hospopilot-ink font-medium">{log.location}</span>
                  <span className="text-hospopilot-ink/40 ml-2 text-xs">{COOKING_TYPE_LABELS[log.check_type] ?? log.check_type} · {log.recorded_by}</span>
                </div>
                <span className="font-mono font-semibold text-hospopilot-ink">{log.temperature}°{log.unit}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cleaning records */}
      {cleaningLogs && cleaningLogs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-hospopilot-ink flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-hospopilot-mid" /> Cleaning Records
          </h2>
          <div className="bg-white rounded-2xl border border-black/[0.06] divide-y divide-black/[0.04] overflow-hidden">
            {cleaningLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-hospopilot-ink font-medium">{log.task_name}</span>
                  <span className="text-hospopilot-ink/40 ml-2 text-xs">{log.signed_by}{log.notes ? ` · ${log.notes}` : ''}</span>
                </div>
                <span className="text-hospopilot-ink/40 text-xs">
                  {new Date(log.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
