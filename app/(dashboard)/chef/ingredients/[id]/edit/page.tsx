'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AllergenSelector } from '@/components/allergen/AllergenSelector'
import { ALLERGENS, UNIT_TYPES, type AllergenKey, type UnitType } from '@/lib/constants/allergens'
import { ChevronLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

type AllergenState = Record<AllergenKey, boolean>

function emptyAllergens(): AllergenState {
  return Object.fromEntries(ALLERGENS.map((a) => [a.key, false])) as AllergenState
}

export default function EditIngredientPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('kg')
  const [allergens, setAllergens] = useState<AllergenState>(emptyAllergens())
  const [originalAllergens, setOriginalAllergens] = useState<AllergenState>(emptyAllergens())
  const [restaurantId, setRestaurantId] = useState('')
  const [kcalPer100g, setKcalPer100g] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadIngredient() {
      const { data, error: fetchError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError || !data) {
        setError('Ingredient not found.')
        setFetching(false)
        return
      }

      setName(data.name ?? '')
      setCostPerUnit(data.cost_per_unit != null ? String(data.cost_per_unit) : '')
      setUnitType((data.unit_type as UnitType) ?? 'kg')
      setKcalPer100g(data.kcal_per_100g != null ? String(data.kcal_per_100g) : '')
      const allergenState = emptyAllergens()
      for (const a of ALLERGENS) {
        if (data[a.key] != null) {
          allergenState[a.key] = Boolean(data[a.key])
        }
      }
      setAllergens(allergenState)
      setOriginalAllergens({ ...allergenState })
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = user ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single() : { data: null }
      const rid = profile?.restaurant_id ?? document.cookie.split('; ').find(r => r.startsWith('msafe_rid='))?.split('=')[1] ?? ''
      setRestaurantId(rid)
      setFetching(false)
    }

    loadIngredient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  function handleAllergenChange(key: AllergenKey, value: boolean) {
    setAllergens((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('ingredients')
      .update({
        name: name.trim(),
        cost_per_unit: parseFloat(costPerUnit),
        unit_type: unitType,
        kcal_per_100g: kcalPer100g !== '' ? parseFloat(kcalPer100g) : null,
        ...allergens,
      })
      .eq('id', params.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Check if any allergens changed and create an alert if so
    const changedAllergens = ALLERGENS.filter(a => allergens[a.key] !== originalAllergens[a.key])
    if (changedAllergens.length > 0 && restaurantId) {
      const changes = changedAllergens.map(a =>
        `${a.shortLabel}: ${originalAllergens[a.key] ? 'removed' : 'added'}`
      ).join(', ')
      await supabase.from('allergen_alerts').insert({
        restaurant_id: restaurantId,
        ingredient_id: params.id,
        ingredient_name: name.trim(),
        changed_allergens: changes,
      })
    }

    router.push('/chef/ingredients')
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This cannot be undone.`
    )
    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.push('/chef/ingredients')
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Loading…
      </div>
    )
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
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Edit ingredient</h1>
      </div>

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
          <AllergenSelector selected={allergens} onChange={handleAllergenChange} />
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <Button type="submit" loading={loading} size="lg">
              Save changes
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

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ingredient
          </Button>
        </div>
      </form>
    </div>
  )
}
