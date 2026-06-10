'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TempLogForm({ restaurantId, staffName }: { restaurantId: string; staffName: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [checkType, setCheckType] = useState<'cooking' | 'hot_holding'>('cooking')
  const [item, setItem] = useState('')
  const [temperature, setTemperature] = useState('')
  const [recordedBy, setRecordedBy] = useState(staffName.split('@')[0] ?? '')
  const [notes, setNotes] = useState('')
  const [correctiveAction, setCorrectiveAction] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!temperature || !item) return
    setSaving(true)
    const res = await fetch('/api/compliance/temperature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        location: item,
        temperature: parseFloat(temperature),
        checkType,
        recordedBy,
        notes,
        correctiveAction,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setItem('')
      setTemperature('')
      setNotes('')
      setCorrectiveAction('')
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Check type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCheckType('cooking')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors
            ${checkType === 'cooking' ? 'bg-hospopilot-deep text-white border-hospopilot-deep' : 'border-black/[0.08] text-hospopilot-ink/50 hover:bg-gray-50'}`}
        >
          Cooking temperature
        </button>
        <button
          type="button"
          onClick={() => setCheckType('hot_holding')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors
            ${checkType === 'hot_holding' ? 'bg-hospopilot-deep text-white border-hospopilot-deep' : 'border-black/[0.08] text-hospopilot-ink/50 hover:bg-gray-50'}`}
        >
          Hot holding
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">
            {checkType === 'cooking' ? 'Dish / item cooked' : 'Hot hold unit / dish'}
          </label>
          <input
            value={item}
            onChange={e => setItem(e.target.value)}
            placeholder={checkType === 'cooking' ? 'e.g. Chicken breast' : 'e.g. Bain marie — curry'}
            required
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            value={temperature}
            onChange={e => setTemperature(e.target.value)}
            placeholder={checkType === 'cooking' ? 'e.g. 75' : 'e.g. 65'}
            required
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Recorded by</label>
          <input
            value={recordedBy}
            onChange={e => setRecordedBy(e.target.value)}
            placeholder="Name"
            required
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any observations"
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-widest mb-1.5">Corrective action (if reading failed)</label>
          <input
            value={correctiveAction}
            onChange={e => setCorrectiveAction(e.target.value)}
            placeholder="e.g. returned to cook, binned"
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30"
          />
        </div>

        <div className="col-span-2 md:col-span-1 flex items-end">
          <button
            type="submit"
            disabled={saving || !temperature || !item}
            className="w-full bg-hospopilot-deep text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-hospopilot-deep/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Log temperature'}
          </button>
        </div>
      </div>
    </form>
  )
}
