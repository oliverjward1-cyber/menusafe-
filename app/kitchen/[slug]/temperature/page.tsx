'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Thermometer } from 'lucide-react'

const LOCATIONS = ['Walk-in fridge', 'Fridge 1', 'Fridge 2', 'Freezer 1', 'Freezer 2', 'Hot hold', 'Display cabinet', 'Other']

export default function StaffTempLog() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [restaurantId, setRestaurantId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [rows, setRows] = useState([{ location: 'Walk-in fridge', temperature: '' }])
  const [checkType, setCheckType] = useState<'am' | 'pm' | 'spot'>('am')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const rid = sessionStorage.getItem('staff_restaurant_id')
    const name = sessionStorage.getItem('staff_name')
    if (!rid) { router.replace(`/kitchen/${slug}`); return }
    setRestaurantId(rid)
    setStaffName(name ?? '')
    const hour = new Date().getHours()
    setCheckType(hour >= 14 ? 'pm' : 'am')
  }, [slug, router])

  function updateRow(i: number, field: string, val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function addRow() { setRows(prev => [...prev, { location: 'Fridge 1', temperature: '' }]) }

  async function submit() {
    const valid = rows.filter(r => r.temperature !== '')
    if (!valid.length) return
    setSaving(true)
    await Promise.all(valid.map(r =>
      fetch('/api/compliance/temperature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, location: r.location, temperature: parseFloat(r.temperature), checkType, recordedBy: staffName, source: 'staff' }),
      })
    ))
    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-xl font-semibold text-mise-ink">Temperature logged!</h2>
      <p className="text-mise-ink/50 text-sm mt-1">{rows.filter(r => r.temperature).length} reading{rows.filter(r => r.temperature).length !== 1 ? 's' : ''} saved</p>
      <button onClick={() => router.push(`/kitchen/${slug}/tasks`)} className="mt-6 bg-mise-deep text-white rounded-xl px-6 py-3 font-semibold text-sm">Back to tasks</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-mise-ink px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <p className="text-white font-semibold flex items-center gap-2"><Thermometer className="h-4 w-4" /> Temperature check</p>
          <p className="text-white/40 text-xs">{staffName}</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Check type */}
        <div className="flex gap-2">
          {(['am','pm','spot'] as const).map(t => (
            <button key={t} onClick={() => setCheckType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${checkType === t ? 'bg-mise-deep text-white' : 'bg-white border border-black/[0.08] text-mise-ink/60'}`}>
              {t === 'am' ? 'AM check' : t === 'pm' ? 'PM check' : 'Spot check'}
            </button>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm space-y-3">
            <select value={row.location} onChange={e => updateRow(i, 'location', e.target.value)}
              className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30">
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="number" step="0.1" value={row.temperature} onChange={e => updateRow(i, 'temperature', e.target.value)}
                placeholder="Temperature"
                className="flex-1 border border-black/[0.08] rounded-xl px-3 py-3 text-lg font-mono text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
              <span className="text-mise-ink/40 text-lg font-medium">°C</span>
            </div>
          </div>
        ))}

        <button onClick={addRow} className="w-full border-2 border-dashed border-black/[0.08] rounded-2xl py-3 text-sm text-mise-ink/40 hover:text-mise-ink/60 hover:border-mise-mid/30 transition-colors">
          + Add another location
        </button>

        <button onClick={submit} disabled={saving || !rows.some(r => r.temperature)}
          className="w-full bg-mise-deep text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 transition-opacity shadow-lg">
          {saving ? 'Saving…' : 'Submit readings'}
        </button>
      </div>
    </div>
  )
}
