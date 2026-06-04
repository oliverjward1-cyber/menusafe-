'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LOCATIONS = [
  'Walk-in fridge', 'Fridge 1', 'Fridge 2', 'Freezer 1', 'Freezer 2',
  'Hot hold', 'Display cabinet', 'Delivery bay', 'Other'
]

export default function TempLogForm({ restaurantId, staffName }: { restaurantId: string; staffName: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [location, setLocation] = useState('Walk-in fridge')
  const [customLocation, setCustomLocation] = useState('')
  const [temperature, setTemperature] = useState('')
  const [checkType, setCheckType] = useState('am')
  const [recordedBy, setRecordedBy] = useState(staffName.split('@')[0] ?? '')
  const [notes, setNotes] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!temperature) return
    setSaving(true)
    const res = await fetch('/api/compliance/temperature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        location: location === 'Other' ? customLocation : location,
        temperature: parseFloat(temperature),
        checkType,
        recordedBy,
        notes,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setTemperature('')
      setNotes('')
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="col-span-2 md:col-span-1">
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Location</label>
        <select
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        >
          {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {location === 'Other' && (
          <input
            value={customLocation}
            onChange={e => setCustomLocation(e.target.value)}
            placeholder="Enter location name"
            className="mt-2 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Temperature (°C)</label>
        <input
          type="number"
          step="0.1"
          value={temperature}
          onChange={e => setTemperature(e.target.value)}
          placeholder="e.g. 4.5"
          required
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Check</label>
        <select
          value={checkType}
          onChange={e => setCheckType(e.target.value)}
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        >
          <option value="am">AM check</option>
          <option value="pm">PM check</option>
          <option value="spot">Spot check</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Recorded by</label>
        <input
          value={recordedBy}
          onChange={e => setRecordedBy(e.target.value)}
          placeholder="Name"
          required
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        />
      </div>

      <div className="col-span-2 md:col-span-2">
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Notes (optional)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any concerns or corrective actions taken"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30"
        />
      </div>

      <div className="col-span-2 md:col-span-1 flex items-end">
        <button
          type="submit"
          disabled={saving || !temperature}
          className="w-full bg-mise-deep text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-mise-deep/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Log temperature'}
        </button>
      </div>
    </form>
  )
}
