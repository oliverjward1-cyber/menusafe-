'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Truck } from 'lucide-react'

export default function StaffDelivery() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [restaurantId, setRestaurantId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState('')
  const [temperature, setTemperature] = useState('')
  const [condition, setCondition] = useState<'acceptable' | 'borderline' | 'rejected'>('acceptable')
  const [batchCodes, setBatchCodes] = useState('')
  const [notes, setNotes] = useState('')
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
    if (!supplier || !items) return
    setSaving(true)
    await fetch('/api/compliance/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        supplier,
        items,
        temperature: temperature ? parseFloat(temperature) : null,
        tempAcceptable: condition !== 'rejected',
        condition,
        batchCodes,
        receivedBy: staffName,
        notes,
        source: 'staff',
      }),
    })
    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-xl font-semibold text-hospopilot-ink">Delivery logged!</h2>
      <p className="text-hospopilot-ink/50 text-sm mt-1">Record saved for {supplier}</p>
      <button onClick={() => router.push(`/kitchen/${slug}/tasks`)} className="mt-6 bg-hospopilot-deep text-white rounded-xl px-6 py-3 font-semibold text-sm">Back to tasks</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-hospopilot-ink px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <p className="text-white font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Log a delivery</p>
          <p className="text-white/40 text-xs">{staffName}</p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Supplier *</label>
            <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Brakes, Bidfood, local farm"
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Items delivered *</label>
            <textarea value={items} onChange={e => setItems(e.target.value)} placeholder="List items or describe delivery"
              rows={3}
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30 resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Temperature (°C)</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)}
                placeholder="Optional"
                className="flex-1 border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
              <span className="text-hospopilot-ink/40 text-sm font-medium">°C</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Condition</label>
            <div className="flex gap-2 mt-1">
              {(['acceptable', 'borderline', 'rejected'] as const).map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${condition === c
                    ? c === 'acceptable' ? 'bg-green-500 text-white' : c === 'borderline' ? 'bg-amber-400 text-white' : 'bg-red-500 text-white'
                    : 'bg-gray-100 text-hospopilot-ink/50'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Batch / lot codes</label>
            <input value={batchCodes} onChange={e => setBatchCodes(e.target.value)} placeholder="Optional"
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-hospopilot-ink/50 uppercase tracking-wide">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any issues or comments"
              className="mt-1 w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-hospopilot-ink bg-white focus:outline-none focus:ring-2 focus:ring-hospopilot-mid/30" />
          </div>
        </div>

        <button onClick={submit} disabled={saving || !supplier || !items}
          className="w-full bg-hospopilot-deep text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 transition-opacity shadow-lg">
          {saving ? 'Saving…' : 'Submit delivery record'}
        </button>
      </div>
    </div>
  )
}
