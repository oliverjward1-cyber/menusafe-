'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react'

type Action = {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
  source_type: string
  status: 'open' | 'in_progress' | 'done'
  created_at: string
  completed_at: string | null
}

const STATUS_STYLES = {
  open: 'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  done: 'bg-green-50 text-green-700 border-green-200',
}

const STATUS_ICONS = {
  open: AlertCircle,
  in_progress: Clock,
  done: CheckCircle2,
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'done') return false
  return new Date(dueDate) < new Date()
}

export default function CorrectiveActions({ initial }: { initial: Action[] }) {
  const [actions, setActions] = useState<Action[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const open = actions.filter(a => a.status !== 'done')
  const done = actions.filter(a => a.status === 'done')

  async function updateStatus(id: string, status: Action['status']) {
    const res = await fetch(`/api/compliance/corrective-actions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { action } = await res.json()
      setActions(prev => prev.map(a => a.id === id ? action : a))
    }
  }

  async function createAction(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)
    const res = await fetch('/api/compliance/corrective-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, assignedTo: newAssignedTo, dueDate: newDueDate }),
    })
    if (res.ok) {
      const { action } = await res.json()
      setActions(prev => [action, ...prev])
      setNewTitle('')
      setNewAssignedTo('')
      setNewDueDate('')
      setShowForm(false)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-mise-ink flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Corrective Actions
          {open.length > 0 && (
            <span className="ml-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {open.length} open
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-mise-ink/60 hover:text-mise-ink transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAction} className="mb-4 p-4 bg-mise-cream rounded-xl space-y-3">
          <input
            type="text"
            placeholder="Action title *"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
            className="w-full text-sm rounded-lg border border-black/10 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mise-green/30"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Assigned to"
              value={newAssignedTo}
              onChange={e => setNewAssignedTo(e.target.value)}
              className="flex-1 text-sm rounded-lg border border-black/10 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mise-green/30"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="text-sm rounded-lg border border-black/10 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mise-green/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="text-sm bg-mise-green text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add action'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-mise-ink/50 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {open.length === 0 && !showForm && (
        <p className="text-sm text-mise-ink/40 py-2">No open corrective actions.</p>
      )}

      <div className="space-y-2">
        {open.map(action => {
          const overdue = isOverdue(action.due_date, action.status)
          const Icon = STATUS_ICONS[action.status]
          return (
            <div
              key={action.id}
              className={`rounded-xl border p-4 ${STATUS_STYLES[action.status]} ${overdue ? 'border-red-400' : ''}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug">{action.title}</p>
                  {action.description && (
                    <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{action.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs opacity-70">
                    {action.assigned_to && <span>→ {action.assigned_to}</span>}
                    {action.due_date && (
                      <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                        Due {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {overdue ? ' (overdue)' : ''}
                      </span>
                    )}
                    <span className="opacity-50 capitalize">{action.source_type}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {action.status === 'open' && (
                    <button
                      onClick={() => updateStatus(action.id, 'in_progress')}
                      className="text-xs px-2 py-1 rounded-lg bg-white/60 hover:bg-white transition-colors"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(action.id, 'done')}
                    className="text-xs px-2 py-1 rounded-lg bg-white/60 hover:bg-white transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowDone(v => !v)}
            className="flex items-center gap-1 text-xs text-mise-ink/40 hover:text-mise-ink/60 transition-colors"
          >
            {showDone ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {done.length} completed
          </button>
          {showDone && (
            <div className="mt-2 space-y-1.5">
              {done.map(action => (
                <div key={action.id} className="rounded-xl border border-black/[0.06] p-3 opacity-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <p className="text-sm line-through text-mise-ink/60">{action.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
