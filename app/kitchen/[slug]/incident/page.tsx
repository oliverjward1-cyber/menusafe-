'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, AlertOctagon } from 'lucide-react'

const TYPES = [
  { value: 'allergen_reaction', label: 'Allergen reaction' },
  { value: 'injury', label: 'Injury' },
  { value: 'near_miss', label: 'Near miss' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'pest', label: 'Pest sighting' },
  { value: 'equipment', label: 'Equipment failure' },
  { value: 'other', label: 'Other' },
]

const SEVERITIES = [
  { value: 'low', label: 'Low', colour: 'bg-green-500' },
  { value: 'medium', label: 'Medium', colour: 'bg-amber-400' },
  { value: 'high', label: 'High', colour: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', colour: 'bg-red-600' },
]

export default function StaffIncident() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [restaurantId, setRestaurantId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [type, setType] = useState('allergen_reaction')
  const [severity, setSeverity] = useState('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [affectedPerson, setAffectedPerson] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const name = sessionStorage.getItem('staff_name')
    if (!rid) { router.replace(`/kitchen/${slug}`); return }
    setRestaurantId(rid)
    setStaffName(name ?? '')
  }, [slug, router])

  async function submit() {
    if (!title || !description) return
    setSaving(true)
    await fetch('/api/compliance/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, type, severity, title, description, affectedPerson, actionTaken, reportedBy: staffName, source: 'staff' }),
    })
    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-xl font-semibold text-hospopilot-ink">Incident reported</h2>
      <p className="text-hospopilot-ink/50 text-sm mt-1">Your manager has been notified</p>
      <button onClick={() => router.push(`/kitchen/${slug}/tasks`)} className="mt-6 bg-hospopilot-deep text-white rounded-xl px-6 py-3 font-semibold text-sm">Back to tasks</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-700 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <p className="text-white font-semibold flex items-center gap-2"><AlertOctagon className="h-4 w-4" /> Report incident</p>
          <p className="text-white/60 text-xs">{staffName}</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Type */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Incident type</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-colors ${type === t.value ? 'bg-hospopilot-deep text-white' : 'bg-gray-50 text-hospopilot-ink/70 border border-black/[0.06]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Severity</label>
          <div className="flex gap-2 mt-2">
            {SEVERITIES.map(s => (
              <button key={s.value} onClick={() => setSeverity(s.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${severity === s.value ? `${s.colour} text-white` : 'bg-gray-50 text-hospopilot-ink/50 border border-black/[0.06]'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">What happened? *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title"
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Full description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe exactly what happened"
              rows={4}
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Person affected (if any)</label>
            <input value={affectedPerson} onChange={e => setAffectedPerson(e.target.value)} placeholder="Name or 'customer'"
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Action taken</label>
            <textarea value={actionTaken} onChange={e => setActionTaken(e.target.value)} placeholder="What did you do immediately?"
              rows={2}
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30 resize-none" />
          </div>
        </div>

        <button onClick={submit} disabled={saving || !title || !description}
          className="w-full bg-red-600 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 transition-opacity shadow-lg">
          {saving ? 'Submitting…' : 'Submit incident report'}
        </button>
      </div>
    </div>
  )
}
