'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle2, Circle, Flag, ChevronDown, ChevronUp,
  ClipboardList, FileText, Loader2, AlertTriangle, Send,
  BookOpen, Users, ShieldAlert, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ChecklistItem = { id: string; label: string; required: boolean }

type Task = {
  id: string
  title: string
  task_type: 'checklist' | 'custom' | 'allergen_check' | 'menu_check'
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
  custom: FileText,
  allergen_check: ShieldAlert,
  menu_check: BookOpen,
}

const TYPE_COLOR: Record<string, string> = {
  checklist: 'bg-blue-100 text-blue-600',
  custom: 'bg-gray-100 text-gray-500',
  allergen_check: 'bg-red-100 text-red-600',
  menu_check: 'bg-amber-100 text-amber-600',
}

function fmt(time: string | null) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
}

function TaskCard({ task, staffName, onDone }: {
  task: Task; staffName: string; onDone: (id: string, status: 'done' | 'flagged') => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)

  const isDone = task.status === 'done'
  const isFlagged = task.status === 'flagged'
  const isComplete = isDone || isFlagged

  const Icon = TYPE_ICON[task.task_type] ?? FileText
  const iconClass = TYPE_COLOR[task.task_type] ?? TYPE_COLOR.custom

  const requiredItems = (task.checklist_items ?? []).filter(i => i.required)
  const allRequiredChecked = requiredItems.every(i => checks[i.id])
  const calibrationReady = true

  async function complete(status: 'done' | 'flagged') {
    setSaving(true)
    const supabase = createClient()
    const payload: any = {
      status,
      completed_by: staffName || 'Unknown',
      completed_at: new Date().toISOString(),
      notes: notes || null,
    }
    if (status === 'flagged') payload.flag_reason = flagReason
    if (task.checklist_items?.length) {
      payload.data = { checked_items: Object.keys(checks).filter(k => checks[k]) }
    }
    await supabase.from('ops_task_logs').update(payload).eq('id', task.id)
    onDone(task.id, status)
    setSaving(false)
    setOpen(false)
    setFlagging(false)
  }

  return (
    <div className={`rounded-xl border transition-all ${isComplete ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={() => !isComplete && setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        disabled={isComplete}
      >
        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg shrink-0 ${isComplete ? 'bg-gray-100 text-gray-400' : iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isComplete ? 'text-gray-400 line-through' : 'text-hospopilot-ink'}`}>{task.title}</p>
          {task.scheduled_time && (
            <p className="text-xs text-gray-400">{fmt(task.scheduled_time)}</p>
          )}
        </div>
        {isDone && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
        {isFlagged && <Flag className="h-5 w-5 text-amber-500 shrink-0" />}
        {!isComplete && (open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />)}
      </button>

      {open && !isComplete && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
          {task.description && (
            <p className="text-sm text-gray-500">{task.description}</p>
          )}

          {task.checklist_items && task.checklist_items.length > 0 && (
            <div className="space-y-2">
              {task.checklist_items.map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checks[item.id]}
                    onChange={e => setChecks(p => ({ ...p, [item.id]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-hospopilot-mid"
                  />
                  <span className="text-sm text-gray-700">
                    {item.label}
                    {item.required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </label>
              ))}
            </div>
          )}

          {!flagging ? (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-hospopilot-mid"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => complete('done')}
                  disabled={saving || !allRequiredChecked || !calibrationReady}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-hospopilot-mid text-white text-sm font-semibold disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark done
                </button>
                <button
                  onClick={() => setFlagging(true)}
                  className="px-4 py-2.5 rounded-lg border border-amber-300 text-amber-600 text-sm font-semibold hover:bg-amber-50"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 border border-amber-200 bg-amber-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />Flag issue</p>
                <button onClick={() => setFlagging(false)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <textarea
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                placeholder="Describe the issue…"
                rows={3}
                className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
              />
              <button
                onClick={() => complete('flagged')}
                disabled={saving || !flagReason.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit flag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FohTrailClient({
  restaurantId,
  staffName,
}: {
  restaurantId: string
  staffName: string
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/kitchen/trail?restaurantId=${restaurantId}&team=foh`)
    const json = await res.json()
    setTasks(json.tasks ?? [])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => { load() }, [load])

  function handleDone(id: string, status: 'done' | 'flagged') {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const done = tasks.filter(t => t.status === 'done').length
  const flagged = tasks.filter(t => t.status === 'flagged').length
  const total = tasks.length
  const pct = total > 0 ? Math.round(((done + flagged) / total) * 100) : 0

  const pending = tasks.filter(t => t.status === 'pending')
  const completed = tasks.filter(t => t.status !== 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-hospopilot-mid" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-hospopilot-ink">{done + flagged} of {total} complete</span>
          <span className="text-gray-400">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-hospopilot-mid rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {flagged > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <Flag className="h-3 w-3" />{flagged} issue{flagged > 1 ? 's' : ''} flagged
          </p>
        )}
      </div>

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map(task => (
            <TaskCard key={task.id} task={task} staffName={staffName} onDone={handleDone} />
          ))}
        </div>
      )}

      {pending.length === 0 && total > 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-hospopilot-ink">All FOH checks complete!</p>
          <p className="text-xs text-gray-400 mt-1">Great work — everything is signed off for today.</p>
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No FOH checks set up yet.</p>
          <p className="text-xs mt-1">Ask your manager to add FOH tasks in Trail Settings.</p>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Completed</p>
          {completed.map(task => (
            <TaskCard key={task.id} task={task} staffName={staffName} onDone={handleDone} />
          ))}
        </div>
      )}
    </div>
  )
}
