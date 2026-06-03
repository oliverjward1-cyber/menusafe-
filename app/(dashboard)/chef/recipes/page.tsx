'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent, calcGpPercent, calcSuggestedPrice } from '@/lib/utils'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { Plus, BookOpen, Pencil, Trash2, Eye, EyeOff, Copy, Loader2 } from 'lucide-react'

interface IngRow {
  cost_per_unit: number
  unit_type: string
  kcal_per_100g?: number | null
  [key: string]: unknown
}

interface RiRow {
  quantity: number
  ingredients: IngRow | null
}

interface RecipeRow {
  id: string
  name: string
  description?: string | null
  category?: string | null
  sell_price?: number | null
  status: string
  is_active: boolean
  recipe_ingredients: RiRow[]
  [key: string]: unknown
}

export default function RecipesPage() {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [targetGp, setTargetGp] = useState(70)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()
    const restaurantId = profile?.restaurant_id ?? ''

    const [recipeRes, restRes] = await Promise.all([
      supabase
        .from('recipes')
        .select(`*, recipe_ingredients(quantity, ingredients(cost_per_unit, unit_type, kcal_per_100g, allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites))`)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false }),
      supabase.from('restaurants').select('target_gp').eq('id', restaurantId).single(),
    ])
    setRecipes((recipeRes.data ?? []) as RecipeRow[])
    setTargetGp((restRes.data?.target_gp as number) ?? 70)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function calcFoodCost(recipe: RecipeRow): number {
    return (recipe.recipe_ingredients ?? []).reduce((sum, ri) => {
      const ing = ri.ingredients
      if (!ing) return sum
      let costPerG: number
      switch (ing.unit_type) {
        case 'kg': costPerG = ing.cost_per_unit / 1000; break
        case 'litre': costPerG = ing.cost_per_unit / 1000; break
        case 'each': return sum + ri.quantity * ing.cost_per_unit
        default: costPerG = ing.cost_per_unit
      }
      return sum + ri.quantity * costPerG
    }, 0)
  }

  async function toggleActive(id: string, current: boolean) {
    setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !current } : r))
    await supabase.from('recipes').update({ is_active: !current }).eq('id', id)
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    await supabase.from('recipes').delete().eq('id', id)
  }

  const [duplicating, setDuplicating] = useState<string | null>(null)

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    const res = await fetch('/api/duplicate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: id }),
    })
    const data = await res.json()
    setDuplicating(null)
    if (data.id) {
      // Reload recipes to show the duplicate
      load()
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-sm text-gray-400">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500 mt-1">Target GP: {targetGp}%</p>
        </div>
        <Link
          href="/chef/recipes/new"
          className="inline-flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No recipes yet</h3>
          <p className="text-sm text-gray-500 mb-6">Build your first recipe from your ingredients.</p>
          <Link href="/chef/recipes/new"
            className="inline-flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4" /> Add recipe
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const id = recipe.id
            const name = recipe.name
            const isActive = recipe.is_active
            const category = recipe.category
            const foodCost = calcFoodCost(recipe)
            const sellPrice = recipe.sell_price ?? 0
            const gp = sellPrice > 0 ? calcGpPercent(foodCost, sellPrice) : null
            const suggested = calcSuggestedPrice(foodCost, targetGp)
            const recipeAllergens = ALLERGENS.filter((a) =>
              recipe.recipe_ingredients?.some((ri) => ri.ingredients?.[a.key])
            )

            return (
              <Card key={id} className={isActive ? '' : 'opacity-60'}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{name}</h3>
                      {category && <Badge variant="gray">{category}</Badge>}
                      <Badge variant={recipe.status === 'approved' ? 'green' : recipe.status === 'rejected' ? 'red' : 'yellow'}>
                        {recipe.status}
                      </Badge>
                      {!isActive && <Badge variant="gray">Inactive</Badge>}
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                    )}
                    {recipeAllergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipeAllergens.map((a) => <AllergenBadge key={a.key} allergenKey={a.key} size="sm" />)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex gap-5 text-right shrink-0">
                      <div>
                        <p className="text-xs text-gray-500">Food cost</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(foodCost)}</p>
                      </div>
                      {sellPrice > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">GP</p>
                          <p className={`font-semibold ${gp !== null && gp >= targetGp ? 'text-green-700' : 'text-red-600'}`}>
                            {gp !== null ? formatPercent(gp) : '—'}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Suggested</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(suggested)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        onClick={() => toggleActive(id, isActive)}
                        title={isActive ? 'Mark inactive' : 'Mark active'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDuplicate(id)}
                        title="Duplicate recipe"
                        disabled={duplicating === id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                      >
                        {duplicating === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <Link href={`/chef/recipes/${id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(id, name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
