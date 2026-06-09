'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle2, Circle, Flag, ChevronDown, ChevronUp,
  Thermometer, ClipboardList, Sparkles, Truck, FileText,
  Loader2, AlertTriangle, Plus, Minus, Send, History, Camera, X, Trash2,
  FlaskConical,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ChecklistItem = { id: string; label: string; required: boolean }

type Task = {
  id: string
  title: string
  task_type: 'checklist' | 'temperature' | 'cleaning' | 'delivery' | 'custom' | 'calibration'
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
  calibration: FlaskConical,
}

const TYPE_COLOR: Record<string, string> = {
  checklist: 'bg-blue-100 text-blue-600',
  temperature: 'bg-orange-100 text-orange-600',
  cleaning: 'bg-green-100 text-green-600',
  delivery: 'bg-purple-100 text-purple-600',
  custom: 'bg-gray-100 text-gray-500',
  calibration: 'bg-cyan-100 text-cyan-600',
}

function fmt(time: string | null) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
}

function TaskCard({
  task, staffName, onDone,
}: {
  task: Task; staffName: string; onDone: (id: string, status: 'done' | 'flagged') => void
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

  type DeliveryEntry = {
    id: string; supplier: string; items: string
    temperature: string; cost: string; happy: boolean | null; photoFile: File | null; photoPreview: string | null
  }
  const [deliveries, setDeliveries] = useState<DeliveryEntry[]>([
    { id: uid(), supplier: '', items: '', temperature: '', cost: '', happy: null, photoFile: null, photoPreview: null }
  ])

  function uid() { return Math.random().toString(36).slice(2, 9) }

  function updateDelivery(id: string, field: keyof DeliveryEntry, val: any) {
    setDeliveries(p => p.map(d => d.id === id ? { ...d, [field]: val } : d))
  }
  function addDelivery() {
    setDeliveries(p => [...p, { id: uid(), supplier: '', items: '', temperature: '', cost: '', happy: null, photoFile: null, photoPreview: null }])
  }
  function removeDelivery(id: string) {
    setDeliveries(p => p.filter(d => d.id !== id))
  }
  function handleDeliveryPhoto(id: string, file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      updateDelivery(id, 'photoPreview', e.target?.result as string)
      updateDelivery(id, 'photoFile', file)
    }
    reader.readAsDataURL(file)
  }
  const [icePoint, setIcePoint] = useState('')
  const [boilingPoint, setBoilingPoint] = useState('')
  const [notes, setNotes] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [flagging, setFlagging] = useState(false)

  const calibrationPass =
    icePoint !== '' && boilingPoint !== ''
      ? parseFloat(icePoint) >= -1 && parseFloat(icePoint) <= 1 &&
        parseFloat(boilingPoint) >= 99 && parseFloat(boilingPoint) <= 101
      : null

  const isDone = task.status === 'done'
  const isFlagged = task.status === 'flagged'
  const isComplete = isDone || isFlagged

  const Icon = TYPE_ICON[task.task_type] ?? FileText
  const iconClass = TYPE_COLOR[task.task_type] ?? TYPE_COLOR.custom

  async function complete(status: 'done' | 'flagged') {
    setSaving(true)
    let data: any = undefined
    if (task.task_type === 'checklist') data = { checks }
    else if (task.task_type === 'temperature') data = { readings: temps.filter(r => r.temperature !== '') }
    else if (task.task_type === 'calibration') data = {
      ice_point: icePoint !== '' ? parseFloat(icePoint) : null,
      boiling_point: boilingPoint !== '' ? parseFloat(boilingPoint) : null,
      pass: calibrationPass,
    }
    else if (task.task_type === 'delivery') {
      const supabase = createClient()
      const entries = await Promise.all(deliveries.filter(d => d.supplier || d.items).map(async d => {
        let photoUrl: string | null = null
        if (d.photoFile) {
          const path = `${Date.now()}-${d.id}.${d.photoFile.name.split('.').pop() ?? 'jpg'}`
          const { error: upErr } = await supabase.storage.from('delivery-photos').upload(path, d.photoFile, { upsert: true })
          if (!upErr) {
            const { data: pub } = supabase.storage.from('delivery-photos').getPublicUrl(path)
            photoUrl = pub.publicUrl
          }
        }
        return { supplier: d.supplier, items: d.items, temperature: d.temperature || null, cost: d.cost ? parseFloat(d.cost) : null, happy: d.happy, photoUrl }
      }))
      data = { deliveries: entries }
    }

    await fetch(`/api/kitchen/trail/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status, completed_by: staffName, data,
        notes: notes || undefined,
        flag_reason: status === 'flagged' ? (flagReason || 'Issue flagged') : undefined,
      }),
    })
    setSaving(false)
    onDone(task.id, status)
    setOpen(false)
  }

  const checklistReady = task.checklist_items
    ? task.checklist_items.filter(i => i.required).every(i => checks[i.id])
    : true
  const tempReady = task.task_type === 'temperature' ? temps.some(r => r.temperature !== '') : true
  const calibrationReady = task.task_type === 'calibration' ? (icePoint !== '' && boilingPoint !== '') : true

  return (
    <div className={`rounded-2xl border shadow-sm transition-colors overflow-hidden
      ${isDone ? 'border-green-200 bg-green-50' : isFlagged ? 'border-amber-200 bg-amber-50' : 'border-black/[0.06] bg-white'}`}>
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
          {isDone && <p className="text-xs text-green-600 mt-0.5">✓ Done by {task.completed_by}</p>}
          {isFlagged && <p className="text-xs text-amber-600 mt-0.5">⚑ Flagged · {task.flag_reason}</p>}
        </div>
        <div className="flex-shrink-0">
          {isDone ? <CheckCircle2 className="h-6 w-6 text-green-500" />
            : isFlagged ? <Flag className="h-5 w-5 text-amber-500 fill-amber-500" />
            : open ? <ChevronUp className="h-5 w-5 text-mise-ink/20" />
            : <ChevronDown className="h-5 w-5 text-mise-ink/20" />}
        </div>
      </button>

      {open && !isComplete && (
        <div className="px-4 pb-4 space-y-4 border-t border-black/[0.04] pt-3">
          {task.description && <p className="text-xs text-mise-ink/50">{task.description}</p>}

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
                    : <Circle className="h-5 w-5 text-mise-ink/20 flex-shrink-0" />}
                  <span className={`text-sm ${checks[item.id] ? 'text-green-700' : 'text-mise-ink'}`}>
                    {item.label}
                    {item.required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

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
                      type="number" step="0.1" value={row.temperature}
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

          {task.task_type === 'delivery' && (
            <div className="space-y-3">
              {deliveries.map((d, i) => {
                const photoInputId = `photo-${task.id}-${d.id}`
                return (
                  <div key={d.id} className="border border-black/[0.08] rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-mise-ink/50 uppercase tracking-widest">Delivery {i + 1}</p>
                      {deliveries.length > 1 && (
                        <button onClick={() => removeDelivery(d.id)} className="text-mise-ink/20 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={d.supplier} onChange={e => updateDelivery(d.id, 'supplier', e.target.value)}
                        placeholder="Supplier name"
                        className="col-span-2 border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
                      <input value={d.items} onChange={e => updateDelivery(d.id, 'items', e.target.value)}
                        placeholder="Items delivered"
                        className="border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
                      <div className="flex items-center gap-1">
                        <input type="number" step="0.1" value={d.temperature}
                          onChange={e => updateDelivery(d.id, 'temperature', e.target.value)}
                          placeholder="Temp °C"
                          className="flex-1 border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mise-ink/40 font-medium">£</span>
                        <input type="number" step="0.01" min="0" value={d.cost}
                          onChange={e => updateDelivery(d.id, 'cost', e.target.value)}
                          placeholder="Invoice total"
                          className="w-full border border-black/[0.08] rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
                      </div>
                    </div>
                    {/* Happy / Issue toggle */}
                    <div className="flex gap-2">
                      <button onClick={() => updateDelivery(d.id, 'happy', true)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                          ${d.happy === true ? 'bg-green-500 text-white border-green-500' : 'border-black/[0.08] text-mise-ink/50 hover:bg-green-50'}`}>
                        ✓ Happy with delivery
                      </button>
                      <button onClick={() => updateDelivery(d.id, 'happy', false)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                          ${d.happy === false ? 'bg-red-500 text-white border-red-500' : 'border-black/[0.08] text-mise-ink/50 hover:bg-red-50'}`}>
                        ✗ Issue
                      </button>
                    </div>
                    {/* Invoice photo */}
                    <div>
                      <input type="file" accept="image/*" capture="environment" id={photoInputId} className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleDeliveryPhoto(d.id, f) }} />
                      {d.photoPreview ? (
                        <div className="relative inline-block">
                          <img src={d.photoPreview} alt="invoice" className="h-24 rounded-xl object-cover border border-gray-200" />
                          <button onClick={() => { updateDelivery(d.id, 'photoPreview', null); updateDelivery(d.id, 'photoFile', null) }}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor={photoInputId}
                          className="flex items-center gap-2 text-xs text-mise-ink/40 hover:text-mise-mid cursor-pointer transition-colors">
                          <Camera className="h-4 w-4" /> Photo invoice
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
              <button onClick={addDelivery}
                className="w-full border-2 border-dashed border-black/[0.08] rounded-xl py-2.5 text-sm text-mise-ink/40 hover:border-mise-mid/30 hover:text-mise-mid transition-colors flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4" /> Add another delivery
              </button>
            </div>
          )}

          {task.task_type === 'calibration' && (
            <div className="space-y-3">
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-xs text-cyan-700 space-y-0.5">
                <p className="font-semibold">Probe Calibration Checks</p>
                <p>Ice point: –1 to +1 °C &nbsp;|&nbsp; Boiling point: 99 to 101 °C</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-mise-ink/50 mb-1 font-medium">Ice point reading (°C)</label>
                  <input type="number" step="0.1" value={icePoint} onChange={e => setIcePoint(e.target.value)}
                    placeholder="e.g. 0.2"
                    className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40" />
                </div>
                <div>
                  <label className="block text-xs text-mise-ink/50 mb-1 font-medium">Boiling point reading (°C)</label>
                  <input type="number" step="0.1" value={boilingPoint} onChange={e => setBoilingPoint(e.target.value)}
                    placeholder="e.g. 100.1"
                    className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40" />
                </div>
              </div>
              {calibrationPass !== null && (
                <div className={`rounded-xl p-3 text-sm font-semibold flex items-center gap-2
                  ${calibrationPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {calibrationPass ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {calibrationPass ? 'Probe passed calibration' : 'Probe OUT OF RANGE — flag this task'}
                </div>
              )}
            </div>
          )}

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
          />

          {flagging && (
            <textarea
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              placeholder="Describe the issue…"
              rows={2}
              className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm bg-amber-50 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300/40"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={() => complete('done')}
              disabled={saving || !checklistReady || !tempReady || !calibrationReady}
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

export default function TrailClient({ restaurantId, staffName }: { restaurantId: string; staffName: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitNotes, setSubmitNotes] = useState('')
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  useEffect(() => {
    fetch(`/api/kitchen/trail?restaurantId=${restaurantId}`)
      .then(r => r.json())
      .then(d => { setTasks(d.tasks ?? []); setLoading(false) })
  }, [restaurantId])

  const handleDone = useCallback((id: string, status: 'done' | 'flagged') => {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status, completed_by: staffName, completed_at: new Date().toISOString() }
      : t))
  }, [staffName])

  async function submitTrail() {
    setSubmitting(true)
    await fetch('/api/kitchen/trail/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, submittedBy: staffName, notes: submitNotes || undefined }),
    })
    setSubmitting(false)
    setSubmitted(true)
    setShowSubmitForm(false)
  }

  const done = tasks.filter(t => t.status === 'done' || t.status === 'flagged').length
  const total = tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total
  const now = new Date()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mise-ink">Daily Trail</h1>
          <p className="text-mise-ink/50 text-sm mt-0.5">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/owner/trail-history"
          className="flex items-center gap-1.5 text-sm text-mise-ink/40 hover:text-mise-ink transition-colors">
          <History className="h-4 w-4" /> History
        </Link>
      </div>

      {/* Progress */}
      {!loading && total > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-mise-ink">{done} of {total} tasks complete</span>
            <span className={`font-bold ${pct === 100 ? 'text-green-600' : 'text-mise-mid'}`}>{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-mise-mid rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 text-mise-mid animate-spin" />
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="text-center py-16 text-mise-ink/40">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tasks scheduled for today.</p>
        </div>
      )}

      <div className="space-y-3">
        {!loading && tasks.map(task => (
          <TaskCard key={task.id} task={task} staffName={staffName} onDone={handleDone} />
        ))}
      </div>

      {/* Submit section — appears once tasks exist, regardless of completion */}
      {!loading && total > 0 && !submitted && (
        <div className={`rounded-2xl border p-5 space-y-3 ${allDone ? 'border-green-200 bg-green-50' : 'border-black/[0.06] bg-white'}`}>
          {allDone && (
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              All tasks complete — ready to submit
            </div>
          )}
          {!allDone && (
            <p className="text-sm text-mise-ink/50">
              {total - done} task{total - done !== 1 ? 's' : ''} still pending. You can submit now or complete them first.
            </p>
          )}
          {showSubmitForm ? (
            <div className="space-y-3">
              <textarea
                value={submitNotes}
                onChange={e => setSubmitNotes(e.target.value)}
                placeholder="Any notes for today's trail? (optional)"
                rows={2}
                className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitTrail}
                  disabled={submitting}
                  className="flex-1 bg-mise-deep text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit & save trail
                </button>
                <button onClick={() => setShowSubmitForm(false)}
                  className="px-4 border border-black/[0.08] rounded-xl text-sm text-mise-ink/40 hover:text-mise-ink transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSubmitForm(true)}
              className={`w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors
                ${allDone ? 'bg-mise-deep text-white hover:bg-mise-deep/90' : 'border border-black/[0.08] text-mise-ink/60 hover:bg-gray-50'}`}
            >
              <Send className="h-4 w-4" /> Submit today&apos;s trail
            </button>
          )}
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-green-700">Trail submitted!</p>
          <p className="text-sm text-green-600/70 mt-0.5">Today&apos;s records have been saved.</p>
          <Link href="/owner/trail-history"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-green-700 underline underline-offset-2">
            <History className="h-3.5 w-3.5" /> View history
          </Link>
        </div>
      )}
    </div>
  )
}
