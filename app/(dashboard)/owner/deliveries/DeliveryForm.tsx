'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeliveryForm({ restaurantId, staffName }: { restaurantId: string; staffName: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState('')
  const [temperature, setTemperature] = useState('')
  const [condition, setCondition] = useState('acceptable')
  const [batchCodes, setBatchCodes] = useState('')
  const [receivedBy, setReceivedBy] = useState(staffName)
  const [notes, setNotes] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplier.trim() || !items.trim()) return
    setSaving(true)
    const res = await fetch('/api/compliance/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        supplier,
        items,
        temperature: temperature ? parseFloat(temperature) : null,
        tempAcceptable: temperature ? parseFloat(temperature) <= 8 : null,
        condition,
        batchCodes: batchCodes || null,
        receivedBy,
        notes: notes || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSupplier('')
      setItems('')
      setTemperature('')
      setBatchCodes('')
      setNotes('')
      setCondition('acceptable')
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Supplier</label>
        <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Brakes, Sysco" required
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      <div className="col-span-2 md:col-span-1">
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Items delivered</label>
        <input value={items} onChange={e => setItems(e.target.value)} placeholder="e.g. Chicken breast, mixed salad" required
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Delivery temp (°C)</label>
        <input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="e.g. 4.2"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Condition</label>
        <select value={condition} onChange={e => setCondition(e.target.value)}
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30">
          <option value="acceptable">Acceptable</option>
          <option value="borderline">Borderline</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Received by</label>
        <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} required placeholder="Name"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Batch/use-by codes</label>
        <input value={batchCodes} onChange={e => setBatchCodes(e.target.value)} placeholder="Optional"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any issues, corrective actions…"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      <div className="flex items-end">
        <button type="submit" disabled={saving || !supplier.trim() || !items.trim()}
          className="w-full bg-mise-deep text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-mise-deep/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Log delivery'}
        </button>
      </div>
    </form>
  )
}
