'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AllergenSelector } from '@/components/allergen/AllergenSelector'
import { ALLERGENS, UNIT_TYPES, type AllergenKey, type UnitType } from '@/lib/constants/allergens'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type AllergenState = Record<AllergenKey, boolean>

function emptyAllergens(): AllergenState {
  return Object.fromEntries(ALLERGENS.map((a) => [a.key, false])) as AllergenState
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
        <h1 className="text-2xl font-display font-semibold text-mise-ink">Add ingredient</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-mise-ink mb-4">Basic details</h2>
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
            <Input
              label="Kcal per 100g (optional)"
              type="number"
              step="1"
              min="0"
              value={kcalPer100g}
              onChange={(e) => setKcalPer100g(e.target.value)}
              placeholder="e.g. 364"
            />
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
