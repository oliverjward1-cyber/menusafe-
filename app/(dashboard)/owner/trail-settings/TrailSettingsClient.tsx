'use client'
import { useState, useCallback } from 'react'
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, Thermometer, ClipboardList,
  Sparkles, Truck, FileText, Eye, EyeOff, Save, X,
} from 'lucide-react'

type ChecklistItem = { id: string; label: string; required: boolean }

type Template = {
  id: string
  title: string
  description: string | null
  task_type: string
  schedule_type: string
  schedule_days: number[] | null
  scheduled_time: string | null
  checklist_items: ChecklistItem[] | null
  is_active: boolean
  sort_order: number
}

const TASK_TYPES = [
  { value: 'checklist', label: 'Checklist', icon: ClipboardList, desc: 'List of items to tick off' },
  { value: 'temperature', label: 'Temperature', icon: Thermometer, desc: 'Record temperature readings' },
  { value: 'cleaning', label: 'Cleaning', icon: Sparkles, desc: 'Cleaning sign-off' },
  { value: 'delivery', label: 'Delivery', icon: Truck, desc: 'Log a delivery' },
  { value: 'custom', label: 'Custom', icon: FileText, desc: 'Freetext task' },
]

const SCHEDULE_TYPES = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Specific days' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_ICON: Record<string, any> = {
  checklist: ClipboardList, temperature: Thermometer,
  cleaning: Sparkles, delivery: Truck, custom: FileText,
}
const TYPE_COLOR: Record<string, string> = {
  checklist: 'bg-blue-100 text-blue-600',
  temperature: 'bg-orange-100 text-orange-600',
  cleaning: 'bg-green-100 text-green-600',
  delivery: 'bg-purple-100 text-purple-600',
  custom: 'bg-gray-100 text-gray-500',
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ── Template editor modal ─────────────────────────────────────────────────────

function TemplateEditor({
  initial, onSave, onCancel,
}: {
  initial?: Partial<Template>
  onSave: (t: Partial<Template>) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [taskType, setTaskType] = useState(initial?.task_type ?? 'checklist')
  const [scheduleType, setScheduleType] = useState(initial?.schedule_type ?? 'daily')
  const [scheduleDays, setScheduleDays] = useState<number[]>(initial?.schedule_type === 'weekly' ? [] : [])
  const [scheduledTime, setScheduledTime] = useState(initial?.scheduled_time ?? '')
  const [items, setItems] = useState<ChecklistItem[]>(initial?.checklist_items ?? [])
  const [saving, setSaving] = useState(false)

  function toggleDay(d: number) {
    setScheduleDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  function addItem() {
    setItems(p => [...p, { id: uid(), label: '', required: true }])
  }

  function updateItem(id: string, field: keyof ChecklistItem, val: any) {
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  function removeItem(id: string) {
    setItems(p => p.filter(i => i.id !== id))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      task_type: taskType,
      schedule_type: scheduleType,
      schedule_days: scheduleType === 'weekly' ? scheduleDays : null,
      scheduled_time: scheduledTime || null,
      checklist_items: taskType === 'checklist' && items.length > 0 ? items : null,
    })
    setSaving(false)
  }

  const isValid = title.trim().length > 0 && (scheduleType !== 'weekly' || scheduleDays.length > 0)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-black/[0.06] px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-hospopilot-ink">{initial?.id ? 'Edit task' : 'New task'}</h2>
          <button onClick={onCancel} className="text-hospopilot-ink/30 hover:text-hospopilot-ink transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Task name</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Opening Checks"
              className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief instruction for staff"
              className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
            />
          </div>

          {/* Task type */}
          <div>
            <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TASK_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTaskType(t.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors
                    ${taskType === t.value ? 'border-hospopilot-mid bg-hospopilot-mid/5' : 'border-black/[0.08] hover:bg-gray-50'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[t.value]}`}>
                    <t.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-hospopilot-ink">{t.label}</p>
                    <p className="text-[10px] text-hospopilot-ink/40">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Schedule</label>
            <div className="flex gap-2 mb-3">
              {SCHEDULE_TYPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setScheduleType(s.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                    ${scheduleType === s.value ? 'border-hospopilot-mid bg-hospopilot-mid text-white' : 'border-black/[0.08] text-hospopilot-ink/60 hover:bg-gray-50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {scheduleType === 'weekly' && (
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                      ${scheduleDays.includes(i) ? 'bg-hospopilot-mid text-white border-hospopilot-mid' : 'border-black/[0.08] text-hospopilot-ink/60 hover:bg-gray-50'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Scheduled time (optional)</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
            />
          </div>

          {/* Checklist items */}
          {taskType === 'checklist' && (
            <div>
              <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Checklist items</label>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      value={item.label}
                      onChange={e => updateItem(item.id, 'label', e.target.value)}
                      placeholder="Item label…"
                      className="flex-1 border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
                    />
                    <button
                      onClick={() => updateItem(item.id, 'required', !item.required)}
                      title={item.required ? 'Required' : 'Optional'}
                      className={`flex-shrink-0 text-xs px-2 py-1.5 rounded-lg border font-medium transition-colors
                        ${item.required ? 'border-hospopilot-mid text-hospopilot-mid bg-hospopilot-mid/5' : 'border-black/[0.08] text-hospopilot-ink/30'}`}
                    >
                      {item.required ? 'Req' : 'Opt'}
                    </button>
                    <button onClick={() => removeItem(item.id)}
                      className="flex-shrink-0 text-hospopilot-ink/20 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="w-full border-2 border-dashed border-black/[0.08] rounded-xl py-2.5 text-sm text-hospopilot-ink/40 hover:border-hospopilot-mid/30 hover:text-hospopilot-mid transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add item
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-black/[0.06] px-5 py-4 flex gap-2 rounded-b-2xl">
          <button onClick={onCancel}
            className="px-4 py-2.5 border border-black/[0.08] rounded-xl text-sm text-hospopilot-ink/50 hover:text-hospopilot-ink transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="flex-1 bg-hospopilot-deep text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {initial?.id ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Template row card ─────────────────────────────────────────────────────────

function TemplateRow({
  template, onEdit, onToggle, onDelete,
}: {
  template: Template
  onEdit: (t: Template) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  const Icon = TYPE_ICON[template.task_type] ?? FileText
  const iconClass = TYPE_COLOR[template.task_type] ?? TYPE_COLOR.custom

  function fmt(time: string | null) {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
  }

  return (
    <div className={`flex items-center gap-3 bg-white border rounded-2xl p-4 shadow-sm transition-opacity
      ${template.is_active ? 'border-black/[0.06]' : 'border-black/[0.04] opacity-50'}`}>
      <div className="text-hospopilot-ink/20 cursor-grab flex-shrink-0">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-hospopilot-ink text-sm">{template.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {template.scheduled_time && (
            <span className="text-xs text-hospopilot-ink/40">{fmt(template.scheduled_time)}</span>
          )}
          <span className="text-xs text-hospopilot-ink/30 capitalize">
            {template.schedule_type === 'daily' ? 'Every day' : 'Weekly'}
          </span>
          {template.checklist_items && (
            <span className="text-xs text-hospopilot-ink/30">{template.checklist_items.length} items</span>
          )}
          {!template.is_active && (
            <span className="text-xs text-gray-400 italic">inactive</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggle(template.id, !template.is_active)}
          title={template.is_active ? 'Deactivate' : 'Activate'}
          className="p-2 rounded-lg text-hospopilot-ink/30 hover:text-hospopilot-ink hover:bg-gray-100 transition-colors"
        >
          {template.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onEdit(template)}
          className="p-2 rounded-lg text-hospopilot-ink/30 hover:text-hospopilot-mid hover:bg-hospopilot-mid/5 transition-colors text-xs font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="p-2 rounded-lg text-hospopilot-ink/20 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TrailSettingsClient({
  initialTemplates,
}: {
  initialTemplates: Template[]
}) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  function flash(id: string) {
    setSaved(id)
    setTimeout(() => setSaved(null), 2000)
  }

  async function handleCreate(data: Partial<Template>) {
    const res = await fetch('/api/owner/trail-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.template) {
      setTemplates(p => [...p, json.template])
      flash(json.template.id)
    }
    setCreating(false)
  }

  async function handleEdit(data: Partial<Template>) {
    if (!editing) return
    const res = await fetch(`/api/owner/trail-templates/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.template) {
      setTemplates(p => p.map(t => t.id === editing.id ? json.template : t))
      flash(editing.id)
    }
    setEditing(null)
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/owner/trail-templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    })
    setTemplates(p => p.map(t => t.id === id ? { ...t, is_active: active } : t))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task template? This won\'t affect past logs.')) return
    await fetch(`/api/owner/trail-templates/${id}`, { method: 'DELETE' })
    setTemplates(p => p.filter(t => t.id !== id))
  }

  const active = templates.filter(t => t.is_active)
  const inactive = templates.filter(t => !t.is_active)

  return (
    <>
      {(editing || creating) && (
        <TemplateEditor
          initial={editing ?? {}}
          onSave={editing ? handleEdit : handleCreate}
          onCancel={() => { setEditing(null); setCreating(false) }}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-hospopilot-ink">Trail Settings</h1>
            <p className="text-hospopilot-ink/50 text-sm mt-0.5">Manage your daily task templates</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-hospopilot-mid text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-hospopilot-deep transition-colors"
          >
            <Plus className="h-4 w-4" /> Add task
          </button>
        </div>

        <p className="text-xs text-hospopilot-ink/40 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
          Changes take effect immediately — today&apos;s trail will regenerate next time it&apos;s opened.
        </p>

        {templates.length === 0 && (
          <div className="text-center py-16 text-hospopilot-ink/40">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks yet. Add your first task above.</p>
          </div>
        )}

        {active.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Active ({active.length})</p>
            {active.map(t => (
              <div key={t.id} className="relative">
                {saved === t.id && (
                  <div className="absolute -top-1 -right-1 z-10 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Saved
                  </div>
                )}
                <TemplateRow
                  template={t}
                  onEdit={setEditing}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        {inactive.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Inactive ({inactive.length})</p>
            {inactive.map(t => (
              <TemplateRow
                key={t.id}
                template={t}
                onEdit={setEditing}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
