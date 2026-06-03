'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Trash2, AlertTriangle, ArrowRight, ImagePlus } from 'lucide-react'
import { AllergenSheetImport } from './AllergenSheetImport'

interface Dish {
  name: string
  category: string
  price: number | null
  description: string | null
}

interface EditableDish extends Dish {
  id: string
  selected: boolean
}

interface Props {
  restaurantId: string
}

export function MenuPhotoImport({ restaurantId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<'upload' | 'scanning' | 'review' | 'saving' | 'done' | 'allergens'>('upload')
  const [dishes, setDishes] = useState<EditableDish[]>([])
  const [savedRecipes, setSavedRecipes] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError('')
    setPreview(URL.createObjectURL(file))
    setStage('scanning')

    const form = new FormData()
    form.append('image', file)

    const res = await fetch('/api/menu-import', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok || !data.dishes) {
      setError(data.error ?? 'Could not read the menu. Try a clearer photo.')
      setStage('upload')
      return
    }

    const editable: EditableDish[] = data.dishes.map((d: Dish, i: number) => ({
      ...d,
      id: `${i}`,
      selected: true,
    }))
    setDishes(editable)
    setStage('review')
  }

  function updateDish(id: string, field: keyof Dish, value: string | number | null) {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  function toggleDish(id: string) {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d))
  }

  function removeDish(id: string) {
    setDishes(prev => prev.filter(d => d.id !== id))
  }

  async function handleSave() {
    setStage('saving')
    setError('')

    const selected = dishes.filter(d => d.selected)

    const res = await fetch('/api/menu-import/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, dishes: selected }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save dishes')
      setStage('review')
      return
    }

    // Store saved recipes for allergen matching
    setSavedRecipes(data.recipes ?? selected.map((d, i) => ({ id: `unknown-${i}`, name: d.name })))
    setStage('done')
  }

  const selectedCount = dishes.filter(d => d.selected).length

  if (stage === 'upload') {
    return (
      <div className="space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-mise-ink/20 rounded-2xl p-10 text-center cursor-pointer hover:border-mise-gold hover:bg-mise-gold/5 transition-colors group"
        >
          <ImagePlus className="h-10 w-10 text-mise-ink/20 group-hover:text-mise-gold mx-auto mb-3 transition-colors" />
          <p className="text-sm font-semibold text-mise-ink mb-1">Upload a photo of your menu</p>
          <p className="text-xs text-mise-ink/40">JPG, PNG or WEBP · Works with printed menus, PDFs photographed, or digital screenshots</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
      </div>
    )
  }

  if (stage === 'scanning') {
    return (
      <div className="text-center py-12">
        {preview && (
          <img src={preview} alt="menu" className="h-32 w-32 object-cover rounded-xl mx-auto mb-6 opacity-50" />
        )}
        <Loader2 className="h-8 w-8 animate-spin text-mise-gold mx-auto mb-3" />
        <p className="text-sm font-semibold text-mise-ink">Reading your menu…</p>
        <p className="text-xs text-mise-ink/40 mt-1">This takes about 10 seconds</p>
      </div>
    )
  }

  if (stage === 'allergens') {
    return (
      <div>
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-mise-ink">Upload your allergen sheet</p>
          <p className="text-xs text-mise-ink/40 mt-1">
            We&apos;ll match the allergens to the {savedRecipes.length} dishes you just added
          </p>
        </div>
        <AllergenSheetImport
          recipes={savedRecipes}
          onDone={() => router.push('/chef/recipes')}
        />
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-12 w-12 text-mise-fresh mx-auto mb-4" />
        <p className="text-xl font-display font-semibold text-mise-ink mb-1">
          {selectedCount} dish{selectedCount !== 1 ? 'es' : ''} added
        </p>
        <p className="text-sm text-mise-ink/50 mb-6">
          Do you have an existing allergen sheet? Upload it now and we&apos;ll pre-fill allergens for every dish.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setStage('allergens')}
            className="w-full py-3 bg-mise-gold hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Yes — upload my allergen sheet
          </button>
          <button
            onClick={() => router.push('/chef/recipes')}
            className="w-full py-2.5 text-sm text-mise-ink/40 hover:text-mise-ink/60 transition-colors"
          >
            Skip — go to my recipes <ArrowRight className="h-3.5 w-3.5 inline" />
          </button>
        </div>
      </div>
    )
  }

  // Group by category for review
  const categories = Array.from(new Set(dishes.map(d => d.category)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-mise-ink">{dishes.length} dishes found</p>
          <p className="text-xs text-mise-ink/40 mt-0.5">Deselect any you don&apos;t want, then save</p>
        </div>
        <button
          onClick={() => { setStage('upload'); setPreview(null); setDishes([]) }}
          className="text-xs text-mise-ink/40 hover:text-mise-ink underline"
        >
          Try another photo
        </button>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest mb-2 px-1">{cat}</p>
            <div className="space-y-2">
              {dishes.filter(d => d.category === cat).map(dish => (
                <div
                  key={dish.id}
                  className={`bg-white rounded-xl border p-3 transition-colors ${dish.selected ? 'border-black/[0.06]' : 'border-black/[0.03] opacity-40'}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={dish.selected}
                      onChange={() => toggleDish(dish.id)}
                      className="mt-0.5 h-4 w-4 rounded accent-mise-gold cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        value={dish.name}
                        onChange={e => updateDish(dish.id, 'name', e.target.value)}
                        className="w-full text-sm font-semibold text-mise-ink bg-transparent border-b border-transparent hover:border-mise-ink/10 focus:border-mise-gold focus:outline-none pb-0.5"
                      />
                      {dish.description && (
                        <input
                          value={dish.description ?? ''}
                          onChange={e => updateDish(dish.id, 'description', e.target.value)}
                          className="w-full text-xs text-mise-ink/50 bg-transparent border-b border-transparent hover:border-mise-ink/10 focus:border-mise-gold focus:outline-none pb-0.5"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-mise-ink/40">£</span>
                      <input
                        type="number"
                        step="0.01"
                        value={dish.price ?? ''}
                        onChange={e => updateDish(dish.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="—"
                        className="w-14 text-sm font-semibold text-right text-mise-ink bg-transparent border-b border-transparent hover:border-mise-ink/10 focus:border-mise-gold focus:outline-none pb-0.5"
                      />
                    </div>
                    <button onClick={() => removeDish(dish.id)} className="text-mise-ink/20 hover:text-red-400 transition-colors mt-0.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={stage === 'saving' || selectedCount === 0}
        className="w-full py-3 bg-mise-gold hover:bg-yellow-600 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {stage === 'saving'
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          : `Save ${selectedCount} dish${selectedCount !== 1 ? 'es' : ''} to my recipes`}
      </button>
    </div>
  )
}
