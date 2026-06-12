'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Camera, Upload, Loader2, CheckCircle2, AlertTriangle, X, Pencil } from 'lucide-react'
import { ALLERGENS } from '@/lib/constants/allergens'
import type { InvoiceItem } from '@/app/api/invoice/route'

type EditableItem = InvoiceItem & { id: number; selected: boolean; saving?: boolean; saved?: boolean }

const UNIT_TYPES = ['kg', 'g', 'litre', 'ml', 'each'] as const

export default function ScanInvoicePage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [items, setItems] = useState<EditableItem[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [done, setDone] = useState(false)
  const [allergensVerified, setAllergensVerified] = useState(false)

  async function compressImage(file: File): Promise<File> {
    if (file.type === 'application/pdf') return file

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = dataUrl
    })

    const maxDim = 1800
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setError('')
    setItems([])
    setDone(false)

    const compressed = await compressImage(file)

    // Show image preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(compressed)

    // Send to API
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('invoice', compressed)
      const res = await fetch('/api/invoice', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Scan failed'); setScanning(false); return }
      if (data.items.length === 0) {
        setError('No ingredients found. Try a clearer photo or different angle.')
        setScanning(false)
        return
      }
      setAllergensVerified(false)
      setItems(data.items.map((item: InvoiceItem, i: number) => ({ ...item, id: i, selected: true })))
    } catch {
      setError('Network error — please try again')
    }
    setScanning(false)
  }

  function updateItem(id: number, field: keyof EditableItem, value: unknown) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    const selected = items.filter((i) => i.selected)
    if (selected.length === 0) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()

    // Cookie fallback for testing
    const rid = profile?.restaurant_id
      ?? document.cookie.split('; ').find((r) => r.startsWith('msafe_rid='))?.split('=')[1]

    if (!rid) { setError('No restaurant found'); setSaving(false); return }

    const allergenDefaults = Object.fromEntries(ALLERGENS.map((a) => [a.key, false]))
    const { data: existing } = await supabase
      .from('ingredients').select('id, name').eq('restaurant_id', rid)
    const existingMap = new Map((existing ?? []).map((i) => [i.name.toLowerCase(), i.id]))

    let count = 0
    for (const item of selected) {
      const name = item.name.trim()
      const allergenData = {
        allergen_cereals_gluten: item.allergenCerealsGluten ?? false,
        allergen_crustaceans: item.allergenCrustaceans ?? false,
        allergen_eggs: item.allergenEggs ?? false,
        allergen_fish: item.allergenFish ?? false,
        allergen_peanuts: item.allergenPeanuts ?? false,
        allergen_nuts: item.allergenNuts ?? false,
        allergen_soya: item.allergenSoya ?? false,
        allergen_milk: item.allergenMilk ?? false,
        allergen_celery: item.allergenCelery ?? false,
        allergen_mustard: item.allergenMustard ?? false,
        allergen_sesame: item.allergenSesame ?? false,
        allergen_sulphites: item.allergenSulphites ?? false,
        allergen_lupin: item.allergenLupin ?? false,
        allergen_molluscs: item.allergenMolluscs ?? false,
      }
      const existingId = existingMap.get(name.toLowerCase())
      if (existingId) {
        await supabase.from('ingredients').update({
          cost_per_unit: item.unitPrice,
          unit_type: item.unitType,
          kcal_per_100g: item.kcalPer100g ?? null,
          ...allergenData,
        }).eq('id', existingId)
      } else {
        await supabase.from('ingredients').insert({
          restaurant_id: rid,
          name,
          cost_per_unit: item.unitPrice,
          unit_type: item.unitType,
          kcal_per_100g: item.kcalPer100g ?? null,
          ...allergenDefaults,
          ...allergenData,
        })
      }
      count++
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, saved: true } : i))
    }

    setSavedCount(count)
    setSaving(false)
    setDone(true)
  }

  const selectedCount = items.filter((i) => i.selected).length

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/chef/ingredients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Scan invoice</h1>
      </div>

      {/* Upload area */}
      {!scanning && items.length === 0 && !done && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Upload your invoice</h2>
            <p className="text-xs text-gray-400 mt-0.5">Photo, scan or screenshot of any supplier invoice — Brakes, Bidfood, local suppliers, handwritten notes.</p>
          </div>
          <div className="p-5 space-y-3">
            {/* Camera button — mobile primary */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-green-200 bg-green-50 text-green-800 font-medium hover:bg-green-100 transition-colors"
            >
              <Camera className="h-5 w-5" />
              Take a photo of your invoice
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-hospopilot-ink/40">or</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            {/* File upload */}
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload image or PDF
            </button>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

            <p className="text-xs text-center text-hospopilot-ink/40">
              Supports JPG, PNG, WebP. AI reads the invoice and extracts all ingredient prices automatically.
            </p>
          </div>
        </div>
      )}

      {/* Scanning state */}
      {scanning && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-10 text-center">
          {preview && (
            <img src={preview} alt="Invoice" className="max-h-48 mx-auto rounded-lg object-contain mb-6 border border-gray-100" />
          )}
          <Loader2 className="h-8 w-8 text-green-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-hospopilot-ink">Reading your invoice…</p>
          <p className="text-xs text-gray-400 mt-1">Claude AI is extracting ingredient names, prices, allergens and calories</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button onClick={() => { setError(''); setPreview(null); setFileName('') }}
              className="text-xs text-red-600 underline mt-1">Try again</button>
          </div>
        </div>
      )}

      {/* Results */}
      {items.length > 0 && !done && (
        <>
          {/* AI allergen warning */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Review AI-suggested allergens before saving</p>
              <p className="text-xs text-amber-700 mt-1">
                Allergen and calorie data below has been estimated by AI based on ingredient names.
                It may not be accurate. You are legally responsible for the allergen information
                displayed to customers. Please check each ingredient carefully and correct any errors
                before saving.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Extracted ingredients</h2>
                <p className="text-xs text-gray-400 mt-0.5">{items.length} items found from {fileName}. Edit anything that looks wrong, then save.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: true })))}
                  className="text-xs text-hospopilot-mid hover:underline">Select all</button>
                <button onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: false })))}
                  className="text-xs text-gray-400 hover:underline">Deselect all</button>
              </div>
            </div>

            {/* Invoice preview thumbnail */}
            {preview && (
              <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                <img src={preview} alt="Invoice" className="h-14 w-14 rounded-lg object-cover border border-gray-200 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-700">{fileName}</p>
                  <button onClick={() => { setPreview(null); setItems([]); setFileName('') }}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 mt-0.5">
                    <X className="h-3 w-3" /> Remove and scan again
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 w-8" />
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Ingredient</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Price / unit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Unit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Qty ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50/50 ${!item.selected ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={item.selected}
                          onChange={(e) => updateItem(item.id, 'selected', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-hospopilot-gold" />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text" value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full rounded-lg border border-transparent hover:border-gray-200 focus:border-green-400 px-2 py-1 text-sm font-medium text-hospopilot-ink focus:outline-none bg-transparent focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-sm">£</span>
                          <input
                            type="number" step="0.01" min="0" value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 rounded-lg border border-transparent hover:border-gray-200 focus:border-green-400 px-2 py-1 text-sm focus:outline-none bg-transparent focus:bg-white"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select value={item.unitType}
                          onChange={(e) => updateItem(item.id, 'unitType', e.target.value)}
                          className="rounded-lg border border-transparent hover:border-gray-200 focus:border-green-400 px-2 py-1 text-sm focus:outline-none bg-transparent focus:bg-white">
                          {UNIT_TYPES.map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification checkbox */}
          <label className="flex items-start gap-3 px-1 cursor-pointer">
            <input
              type="checkbox"
              checked={allergensVerified}
              onChange={(e) => setAllergensVerified(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-hospopilot-gold"
            />
            <span className="text-sm text-gray-700">
              I have reviewed the allergen information above and confirm it is correct to the best of my knowledge.
              I understand that I am legally responsible for the accuracy of allergen data displayed to customers.
            </span>
          </label>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setItems([]); setPreview(null); setFileName(''); setAllergensVerified(false) }}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || selectedCount === 0 || !allergensVerified}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {saving ? 'Saving…' : `Save ${selectedCount} ingredient${selectedCount !== 1 ? 's' : ''} to library`}
            </button>
          </div>
        </>
      )}

      {/* Done */}
      {done && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">{savedCount} ingredient{savedCount !== 1 ? 's' : ''} saved</h2>
          <p className="text-sm text-gray-500 mb-6">
            Prices are now in your ingredient library. Existing ingredients were updated, new ones were added.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setItems([]); setPreview(null); setFileName(''); setDone(false) }}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Scan another invoice
            </button>
            <button onClick={() => router.push('/chef/ingredients')}
              className="px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors">
              View ingredient library →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
