'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AllergenSelector } from '@/components/allergen/AllergenSelector'
import { ALLERGENS, UNIT_TYPES, type AllergenKey, type UnitType } from '@/lib/constants/allergens'
import { ChevronLeft, Sparkles, Loader2, Camera, Upload, X } from 'lucide-react'
import Link from 'next/link'

type AllergenState = Record<AllergenKey, boolean>

function emptyAllergens(): AllergenState {
  return Object.fromEntries(ALLERGENS.map((a) => [a.key, false])) as AllergenState
}

function PhotoSlot({
  label,
  capture,
  preview,
  onSelect,
  onClear,
}: {
  label: string
  capture?: 'environment'
  preview: string | null
  onSelect: (base64: string, mediaType: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [meta, data] = dataUrl.split(',')
      const mediaType = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      onSelect(data, mediaType)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {preview ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200">
          <img src={`data:image/jpeg;base64,${preview}`} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-lg py-6 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-lg py-6 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
          >
            <Camera className="h-4 w-4" /> Take photo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture={capture}
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}
    </div>
  )
}

export default function NewIngredientPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('kg')
  const [kcalPer100g, setKcalPer100g] = useState('')
  const [allergens, setAllergens] = useState<AllergenState>(emptyAllergens())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [kcalLoading, setKcalLoading] = useState(false)

  // Photo scan state
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [frontMediaType, setFrontMediaType] = useState('image/jpeg')
  const [labelImage, setLabelImage] = useState<string | null>(null)
  const [labelMediaType, setLabelMediaType] = useState('image/jpeg')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanNotes, setScanNotes] = useState('')

  async function estimateKcal() {
    if (!name.trim()) return
    setKcalLoading(true)
    try {
      const res = await fetch('/api/ingredients/estimate-kcal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok && data.kcal) setKcalPer100g(String(data.kcal))
    } finally {
      setKcalLoading(false)
    }
  }

  async function handleScan() {
    if (!frontImage && !labelImage) return
    setScanLoading(true)
    setScanError('')
    try {
      const res = await fetch('/api/ingredients/scan-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontImage, frontMediaType, labelImage, labelMediaType }),
      })
      const data = await res.json()
      if (!res.ok) { setScanError(data.error ?? 'Scan failed'); return }

      if (data.name) setName(data.name)
      if (data.kcalPer100g != null) setKcalPer100g(String(data.kcalPer100g))
      if (data.unitType && UNIT_TYPES.includes(data.unitType as UnitType)) setUnitType(data.unitType as UnitType)
      if (Array.isArray(data.allergens)) {
        const updated = emptyAllergens()
        for (const key of data.allergens) {
          if (key in updated) (updated as any)[key] = true
        }
        setAllergens(updated)
      }
      if (data.notes) setScanNotes(data.notes)
    } finally {
      setScanLoading(false)
    }
  }

  function handleAllergenChange(key: AllergenKey, value: boolean) {
    setAllergens((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    const { error: insertError } = await supabase.from('ingredients').insert({
      restaurant_id: profile?.restaurant_id,
      name: name.trim(),
      cost_per_unit: parseFloat(costPerUnit),
      unit_type: unitType,
      kcal_per_100g: kcalPer100g !== '' ? parseFloat(kcalPer100g) : null,
      ...allergens,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/chef/ingredients')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/chef/ingredients"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Add ingredient</h1>
      </div>

      {/* AI Photo Scan */}
      <Card>
        <h2 className="text-base font-semibold text-mise-ink mb-1">Scan product with AI</h2>
        <p className="text-sm text-gray-500 mb-4">Take a photo of the front of the pack and/or the ingredients label — AI will fill in the details below.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <PhotoSlot
            label="Front of pack"
            capture="environment"
            preview={frontImage}
            onSelect={(b64, mt) => { setFrontImage(b64); setFrontMediaType(mt) }}
            onClear={() => setFrontImage(null)}
          />
          <PhotoSlot
            label="Ingredients / allergen label"
            capture="environment"
            preview={labelImage}
            onSelect={(b64, mt) => { setLabelImage(b64); setLabelMediaType(mt) }}
            onClear={() => setLabelImage(null)}
          />
        </div>
        {scanError && (
          <p className="text-sm text-red-600 mb-3">{scanError}</p>
        )}
        {scanNotes && (
          <p className="text-sm text-gray-500 mb-3 italic">{scanNotes}</p>
        )}
        <button
          type="button"
          onClick={handleScan}
          disabled={(!frontImage && !labelImage) || scanLoading}
          className="inline-flex items-center gap-2 bg-mise-mid text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mise-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {scanLoading ? 'Scanning…' : 'Scan with AI'}
        </button>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-hospopilot-ink mb-4">Basic details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Ingredient name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Plain flour"
                required
              />
            </div>
            <Input
              label="Cost per unit (£)"
              type="number"
              step="0.0001"
              min="0"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit type</label>
              <div className="flex flex-wrap gap-2">
                {UNIT_TYPES.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setUnitType(unit)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      unitType === unit
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kcal per 100g (optional)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={kcalPer100g}
                  onChange={(e) => setKcalPer100g(e.target.value)}
                  placeholder="e.g. 364"
                  className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={estimateKcal}
                  disabled={!name.trim() || kcalLoading}
                  title="Estimate with AI"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-mise-mid text-white hover:bg-mise-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {kcalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <AllergenSelector
            selected={allergens}
            onChange={handleAllergenChange}
          />
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">
            Save ingredient
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.push('/chef/ingredients')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
