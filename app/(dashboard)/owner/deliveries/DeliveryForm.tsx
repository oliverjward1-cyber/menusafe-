'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeliveryForm({ restaurantId, staffName }: { restaurantId: string; staffName: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState('')
  const [temperature, setTemperature] = useState('')
  const [happy, setHappy] = useState<boolean | null>(null)
  const [batchCodes, setBatchCodes] = useState('')
  const [receivedBy, setReceivedBy] = useState(staffName)
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  function handlePhoto(file: File) {
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setPhotoFile(file)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplier.trim() || !items.trim()) return
    setSaving(true)

    let photoUrl: string | null = null
    if (photoFile) {
      const supabase = createClient()
      const path = `${restaurantId}/${Date.now()}.${photoFile.name.split('.').pop() ?? 'jpg'}`
      const { error: upErr } = await supabase.storage.from('delivery-photos').upload(path, photoFile, { upsert: true })
      if (!upErr) {
        const { data } = supabase.storage.from('delivery-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }
    }

    const condition = happy === true ? 'acceptable' : happy === false ? 'rejected' : 'acceptable'

    const res = await fetch('/api/compliance/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId, supplier, items,
        temperature: temperature ? parseFloat(temperature) : null,
        tempAcceptable: temperature ? parseFloat(temperature) <= 8 : null,
        condition,
        happy,
        batchCodes: batchCodes || null,
        receivedBy,
        notes: notes || null,
        photoUrl,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSupplier(''); setItems(''); setTemperature('')
      setBatchCodes(''); setNotes(''); setHappy(null)
      setPhotoFile(null); setPhotoPreview(null)
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Received by</label>
          <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} required placeholder="Name"
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Batch/use-by codes</label>
          <input value={batchCodes} onChange={e => setBatchCodes(e.target.value)} placeholder="Optional"
            className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
        </div>
      </div>

      {/* Happy / Issue */}
      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Delivery condition</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setHappy(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors
              ${happy === true ? 'bg-green-500 text-white border-green-500' : 'border-black/[0.08] text-mise-ink/60 hover:bg-green-50'}`}>
            ✓ Happy with delivery
          </button>
          <button type="button" onClick={() => setHappy(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors
              ${happy === false ? 'bg-red-500 text-white border-red-500' : 'border-black/[0.08] text-mise-ink/60 hover:bg-red-50'}`}>
            ✗ Issue with delivery
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any issues, corrective actions…"
          className="w-full border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-mise-ink bg-white focus:outline-none focus:ring-2 focus:ring-mise-mid/30" />
      </div>

      {/* Invoice photo */}
      <div>
        <label className="block text-xs font-semibold text-mise-ink/50 uppercase tracking-widest mb-1.5">Invoice photo</label>
        <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }} />
        {photoPreview ? (
          <div className="relative inline-block">
            <img src={photoPreview} alt="invoice" className="h-28 rounded-xl object-cover border border-gray-200" />
            <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => photoRef.current?.click()}
            className="flex items-center gap-2 border-2 border-dashed border-black/[0.08] rounded-xl px-4 py-3 text-sm text-mise-ink/40 hover:border-mise-mid/30 hover:text-mise-mid transition-colors">
            <Camera className="h-4 w-4" /> Take photo of invoice
          </button>
        )}
      </div>

      <button type="submit" disabled={saving || !supplier.trim() || !items.trim()}
        className="w-full bg-mise-deep text-white rounded-xl py-3 text-sm font-semibold hover:bg-mise-deep/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Log delivery'}
      </button>
    </form>
  )
}
