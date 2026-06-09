'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPES = [
  { value: 'allergen_reaction', label: '⚠️ Allergen reaction' },
  { value: 'injury', label: '🩹 Injury' },
  { value: 'near_miss', label: '🔶 Near miss' },
  { value: 'contamination', label: '🧪 Contamination' },
  { value: 'pest', label: '🐀 Pest sighting' },
  { value: 'equipment', label: '🔧 Equipment failure' },
  { value: 'other', label: '📋 Other' },
]

export default function IncidentForm({ restaurantId, reportedBy }: { restaurantId: string; reportedBy: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState('allergen_reaction')
  const [severity, setSeverity] = useState('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [affectedPerson, setAffectedPerson] = useState('')
  const [actionTaken, setActionTaken] = useState('')
  const [reporter, setReporter] = useState(reportedBy)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setSaving(true)
    const res = await fetch('/api/compliance/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, type, severity, title, description, affectedPerson, actionTaken, reportedBy: reporter }),
    })
    setSaving(false)
    if (res.ok) {
      setTitle('')
      setDescription('')
      setAffectedPerson('')
      setActionTaken('')
      setSeverity('medium')
      setType('allergen_reaction')
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)}
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Reported by</label>
          <input value={reporter} onChange={e => setReporter(e.target.value)} required
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Incident title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required
          placeholder="e.g. Customer reported nut allergy reaction"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
          placeholder="Describe what happened, when, and where…"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Person affected (optional)</label>
          <input value={affectedPerson} onChange={e => setAffectedPerson(e.target.value)}
            placeholder="Name or description"
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Immediate action taken (optional)</label>
          <input value={actionTaken} onChange={e => setActionTaken(e.target.value)}
            placeholder="e.g. Called 999, removed from service"
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
        </div>
      </div>

      <button type="submit" disabled={saving || !title.trim() || !description.trim()}
        className="bg-red-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
        {saving ? 'Reporting…' : 'Report incident'}
      </button>
    </form>
  )
}
