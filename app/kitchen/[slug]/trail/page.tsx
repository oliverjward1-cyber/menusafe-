'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  CheckCircle2, Circle, Flag, ChevronDown, ChevronUp,
  Thermometer, ClipboardList, Sparkles, Truck, FileText,
  LogOut, Loader2, AlertTriangle, Plus, Minus,
} from 'lucide-react'

type ChecklistItem = { id: string; label: string; required: boolean }

type Task = {
  id: string
  title: string
  task_type: 'checklist' | 'temperature' | 'cleaning' | 'delivery' | 'custom'
  scheduled_time: string | null
  sort_order: number
  status: 'pending' | 'done' | 'flagged' | 'skipped'
  completed_by: string | null
  completed_at: string | null
  checklist_items: ChecklistItem[] | null
  description: string | null
  data: any
  notes: string | null
  flag_reason: string | null
}

const TYPE_ICON: Record<string, any> = {
  checklist: ClipboardList,
  temperature: Thermometer,
  cleaning: Sparkles,
  delivery: Truck,
  custom: FileText,
}

const TYPE_COLOR: Record<string, string> = {
  checklist: 'bg-blue-100 text-blue-600',
  temperature: 'bg-orange-100 text-orange-600',
  cleaning: 'bg-green-100 text-green-600',
  delivery: 'bg-purple-100 text-purple-600',
  custom: 'bg-gray-100 text-gray-500',
}

function fmt(time: string | null) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
}

// ── individual task card ──────────────────────────────────────────────────────

function TaskCard({
  task, staffName, restaurantId, onDone,
}: {
  task: Task; staffName: string; restaurantId: string; onDone: (id: string, status: 'done' | 'flagged') => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [temps, setTemps] = useState<{ location: string; temperature: string }[]>([
    { location: 'Walk-in fridge', temperature: '' },
    { location: 'Fridge 1', temperature: '' },
    { location: 'Fridge 2', temperature: '' },
    { location: 'Freezer 1', temperature: '' },
    { location: 'Freezer 2', temperature: '' },
  ])
  const [notes, setNotes] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)

  const isDone = task.status === 'done'
  const isFlagged = task.status === 'flagged'
  const isComplete = isDone || isFlagged

  const Icon = TYPE_ICON[task.task_type] ?? FileText
  const iconClass = TYPE_COLOR[task.task_type] ?? TYPE_COLOR.custom

  async function complete(status: 'done' | 'flagged') {
    setSaving(true)
    let data: any = undefined

    if (task.task_type === 'checklist') {
      data = { checks }
    } else if (task.task_type === 'temperature') {
      data = { readings: temps.filter(r => r.temperature !== '') }
    }

    await fetch(`/api/kitchen/trail/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        completed_by: staffName,
        data,
        notes: notes || undefined,
        flag_reason: status === 'flagged' ? (flagReason || 'Issue flagged by staff') : undefined,
      }),
    })
    setSaving(false)
    onDone(task.id, status)
    setOpen(false)
  }

  const checklistReady = task.checklist_items
    ? task.checklist_items.filter(i => i.required).every(i => checks[i.id])
    : true
  const tempReady = task.task_type === 'temperature'
    ? temps.some(r => r.temperature !== '')
    : true

  return (
    <div className={`rounded-2xl border shadow-sm transition-colors overflow-hidden
      ${isDone ? 'border-green-200 bg-green-50' : isFlagged ? 'border-amber-200 bg-amber-50' : 'border-black/[0.06] bg-white'}`}>
      {/* Header row */}
      <button
        onClick={() => !isComplete && setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm ${isDone ? 'text-green-700' : isFlagged ? 'text-amber-700' : 'text-mise-ink'}`}>
              {task.title}
            </p>
            {task.scheduled_time && (
              <span className="text-[11px] text-mise-ink/30 font-medium">{fmt(task.scheduled_time)}</span>
            )}
          </div>
          {task.description && !open && (
            <p className="text-xs text-mise-ink/40 mt-0.5 truncate">{task.description}</p>
          )}
          {isDone && (
            <p className="text-xs text-green-600 mt-0.5">✓ Done by {task.completed_by}</p>
          )}
          {isFlagged && (
            <p className="text-xs text-amber-600 mt-0.5">⚑ Flagged · {task.flag_reason}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {isDone ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : isFlagged ? (
            <Flag className="h-5 w-5 text-amber-500 fill-amber-500" />
          ) : open ? (
            <ChevronUp className="h-5 w-5 text-mise-ink/20" />
          ) : (
            <ChevronDown className="h-5 w-5 text-mise-ink/20" />
          )}
        </div>
      </button>

      {/* Expanded form */}
      {open && !isComplete && (
        <div className="px-4 pb-4 space-y-4 border-t border-black/[0.04] pt-3">
          {task.description && (
            <p className="text-xs text-mise-ink/50">{task.description}</p>
          )}

          {/* Checklist */}
          {task.task_type === 'checklist' && task.checklist_items && (
            <div className="space-y-2">
              {task.checklist_items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setChecks(c => ({ ...c, [item.id]: !c[item.id] }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors
                    ${checks[item.id] ? 'border-green-200 bg-green-50' : 'border-black/[0.06] bg-gray-50'}`}
                >
                  {checks[item.id]
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    : <Circle className="h-5 w-5 text-mise-ink/20 flex-shrink-0" />
                  }
                  <span className={`text-sm ${checks[item.id] ? 'text-green-700' : 'text-mise-ink'}`}>
                    {item.label}
                    {item.required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Temperature */}
          {task.task_type === 'temperature' && (
            <div className="space-y-2">
              {temps.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={row.location}
                    onChange={e => setTemps(p => p.map((r, idx) => idx === i ? { ...r, location: e.target.value } : r))}
                    placeholder="Location"
                    className="flex-1 border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={row.temperature}
                      onChange={e => setTemps(p => p.map((r, idx) => idx === i ? { ...r, temperature: e.target.value } : r))}
                      placeholder="°C"
                      className="w-20 border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
                    />
                    {i > 0 && (
                      <button onClick={() => setTemps(p => p.filter((_, idx) => idx !== i))}
                        className="text-mise-ink/30 hover:text-red-500">
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setTemps(p => [...p, { location: '', temperature: '' }])}
                className="text-xs text-mise-ink/40 hover:text-mise-mid flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add location
              </button>
            </div>
          )}

          {/* Delivery */}
          {task.task_type === 'delivery' && (
            <p className="text-sm text-mise-ink/50 italic">Add notes below and mark done, or flag if there is a delivery issue.</p>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
          />

          {/* Flag section */}
          {flagging && (
            <div className="space-y-2">
              <textarea
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                placeholder="Describe the issue…"
                rows={2}
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm bg-amber-50 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300/40"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => complete('done')}
              disabled={saving || !checklistReady || !tempReady}
              className="flex-1 bg-mise-deep text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark done
            </button>
            {flagging ? (
              <button
                onClick={() => complete('flagged')}
                disabled={saving}
                className="flex-1 bg-amber-500 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Flag className="h-4 w-4" /> Submit flag
              </button>
            ) : (
              <button
                onClick={() => setFlagging(true)}
                className="px-4 border border-amber-300 text-amber-600 rounded-xl py-3 text-sm font-medium hover:bg-amber-50 transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="h-4 w-4" /> Flag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function DailyTrail() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [staffName, setStaffName] = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const name = sessionStorage.getItem('staff_name')
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const rname = sessionStorage.getItem('staff_restaurant_name')
    if (!name || !rid) { router.replace(`/kitchen/${slug}`); return }
    setStaffName(name)
    setRestaurantId(rid)
    setRestaurantName(rname ?? '')

    fetch(`/api/kitchen/trail?restaurantId=${rid}`)
      .then(r => r.json())
      .then(d => { setTasks(d.tasks ?? []); setLoading(false) })
  }, [slug, router])

  const handleDone = useCallback((id: string, status: 'done' | 'flagged') => {
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t, status,
      completed_by: staffName,
      completed_at: new Date().toISOString(),
    } : t))
  }, [staffName])

  const done = tasks.filter(t => t.status === 'done' || t.status === 'flagged').length
  const total = tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const now = new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-mise-ink px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{restaurantName}</p>
            <p className="text-white/50 text-sm">Hi {staffName.split(' ')[0]} 👋</p>
          </div>
          <button
            onClick={() => { sessionStorage.clear(); router.push(`/kitchen/${slug}`) }}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        {/* Progress bar */}
        {!loading && total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/50 mb-1.5">
              <span>{done} of {total} tasks complete</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-mise-mid rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-3 max-w-lg mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 text-mise-mid animate-spin" />
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="text-center py-12 text-mise-ink/40">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks scheduled for today.</p>
          </div>
        )}

        {!loading && tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            staffName={staffName}
            restaurantId={restaurantId}
            onDone={handleDone}
          />
        ))}

        {!loading && pct === 100 && total > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mt-2">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-700">All tasks complete!</p>
            <p className="text-sm text-green-600/70 mt-0.5">Great work today.</p>
          </div>
        )}
      </div>
    </div>
  )
}
