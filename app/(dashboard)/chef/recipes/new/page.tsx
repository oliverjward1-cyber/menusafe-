'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, calcSuggestedPrice } from '@/lib/utils'
import { RECIPE_CATEGORIES, UNIT_TYPES, type UnitType } from '@/lib/constants/allergens'
import type { Ingredient } from '@/types/database'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'

interface LineItem {
  ingredientId: string
  quantity: string
  unitType: UnitType
}

export default function NewRecipePage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [portionSize, setPortionSize] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { ingredientId: '', quantity: '', unitType: 'kg' },
  ])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [targetGp, setTargetGp] = useState(70)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()

      const [ingredientsRes, restaurantRes] = await Promise.all([
        supabase
          .from('ingredients')
          .select('*')
          .eq('restaurant_id', profile?.restaurant_id ?? '')
          .order('name'),
        supabase
          .from('restaurants')
          .select('target_gp')
          .eq('id', profile?.restaurant_id ?? '')
          .single(),
      ])

      setIngredients(ingredientsRes.data ?? [])
      setTargetGp(restaurantRes.data?.target_gp ?? 70)
    }
    load()
  }, [supabase])

  function addLineItem() {
    setLineItems((prev) => [...prev, { ingredientId: '', quantity: '', unitType: 'kg' }])
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      // Auto-set unit from ingredient
      if (field === 'ingredientId') {
        const ing = ingredients.find((i) => i.id === value)
        if (ing) updated[index].unitType = ing.unit_type as UnitType
      }
      return updated
    })
  }

  function calcFoodCost(): number {
    return lineItems.reduce((sum, li) => {
      if (!li.ingredientId || !li.quantity) return sum
      const ing = ingredients.find((i) => i.id === li.ingredientId)
      if (!ing) return sum
      return sum + parseFloat(li.quantity) * ing.cost_per_unit
    }, 0)
  }

  const foodCost = calcFoodCost()
  const suggestedPrice = calcSuggestedPrice(foodCost, targetGp)
  const currentGp = sellPrice
    ? ((parseFloat(sellPrice) - foodCost) / parseFloat(sellPrice)) * 100
    : null

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

    const validLineItems = lineItems.filter((li) => li.ingredientId && li.quantity)

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        restaurant_id: profile?.restaurant_id,
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
        portion_size: portionSize.trim() || null,
        sell_price: sellPrice ? parseFloat(sellPrice) : null,
        status: 'draft',
        created_by: user.id,
      })
      .select('id')
      .single()

    if (recipeError || !recipe) {
      setError(recipeError?.message ?? 'Failed to save recipe')
      setLoading(false)
      return
    }

    if (validLineItems.length > 0) {
      const { error: riError } = await supabase.from('recipe_ingredients').insert(
        validLineItems.map((li) => ({
          recipe_id: recipe.id,
          ingredient_id: li.ingredientId,
          quantity: parseFloat(li.quantity),
          unit_type: li.unitType,
        }))
      )
      if (riError) {
        setError(riError.message)
        setLoading(false)
        return
      }
    }

    router.push('/chef/recipes')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/chef/recipes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recipe details</h2>
          <div className="space-y-4">
            <Input
              label="Recipe name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Chicken Caesar"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select category</option>
                  {RECIPE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Portion size"
                value={portionSize}
                onChange={(e) => setPortionSize(e.target.value)}
                placeholder="e.g. 280g or 1 portion"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description for the menu..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Input
              label="Sell price (£)"
              type="number"
              step="0.01"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              hint="Optional — set a selling price to calculate GP"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Ingredients</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" /> Add row
            </button>
          </div>

          {ingredients.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-4">
              No ingredients found.{' '}
              <Link href="/chef/ingredients/new" className="font-medium underline">
                Add some first.
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {lineItems.map((li, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ingredient</label>
                  <select
                    value={li.ingredientId}
                    onChange={(e) => updateLineItem(i, 'ingredientId', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required={i === 0}
                  >
                    <option value="">Select…</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qty ({li.unitType})</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={li.quantity}
                    onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required={!!li.ingredientId}
                  />
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    className="mb-0.5 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* GP calculator summary */}
        <Card className="bg-gray-50 border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Cost summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Food cost</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(foodCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Suggested price ({targetGp}% GP)</p>
              <p className="text-xl font-bold text-brand-700 mt-1">{formatCurrency(suggestedPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current GP</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  currentGp === null
                    ? 'text-gray-400'
                    : currentGp >= targetGp
                    ? 'text-green-700'
                    : 'text-red-600'
                }`}
              >
                {currentGp !== null ? `${currentGp.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">
            Save recipe
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.push('/chef/recipes')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
