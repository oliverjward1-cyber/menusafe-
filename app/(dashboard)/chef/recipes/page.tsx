'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent, calcGpPercent, calcSuggestedPrice } from '@/lib/utils'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { Plus, BookOpen, Pencil, Archive, ArchiveRestore, Copy, Loader2, ChevronDown, ChevronRight, Radio } from 'lucide-react'

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
  archived_at?: string | null
  updated_at: string
  created_at: string
  recipe_ingredients: RiRow[]
  [key: string]: unknown
}

export default function RecipesPage() {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [targetGp, setTargetGp] = useState(70)
  const [loading, setLoading] = useState(true)
  const [liveRecipeIds, setLiveRecipeIds] = useState<Set<string>>(new Set())
  const [showArchived, setShowArchived] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()
    const restaurantId = profile?.restaurant_id ?? ''

    const [recipeRes, restRes, liveRes] = await Promise.all([
      supabase
        .from('recipes')
        .select(`*, recipe_ingredients(quantity, ingredients(cost_per_unit, unit_type, kcal_per_100g, allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites))`)
        .eq('restaurant_id', restaurantId)
        .order('updated_at', { ascending: false }),
      supabase.from('restaurants').select('target_gp').eq('id', restaurantId).single(),
      // Fetch recipe IDs that are on at least one published menu
      supabase
        .from('menu_recipes')
        .select('recipe_id, menus!inner(is_published, restaurant_id)')
        .eq('menus.restaurant_id', restaurantId)
        .eq('menus.is_published', true),
    ])

    setRecipes((recipeRes.data ?? []) as RecipeRow[])
    setTargetGp((restRes.data?.target_gp as number) ?? 70)
    const ids = new Set((liveRes.data ?? []).map((r: any) => r.recipe_id as string))
    setLiveRecipeIds(ids)
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

  async function handleArchive(id: string, currentlyArchived: boolean) {
    const archived_at = currentlyArchived ? null : new Date().toISOString()
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, archived_at } : r))
    await supabase.from('recipes').update({ archived_at }).eq('id', id)
  }

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    const res = await fetch('/api/duplicate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId: id }),
    })
    const data = await res.json()
    setDuplicating(null)
    if (data.id) load()
  }

  const COURSE_GROUPS = [
    { key: 'Starters', label: 'Starters' },
    { key: 'Mains', label: 'Mains' },
    { key: 'Sides', label: 'Sides' },
    { key: 'Desserts', label: 'Desserts' },
    { key: 'Drinks', label: 'Drinks' },
    { key: 'Snacks', label: 'Snacks' },
    { key: 'Specials', label: 'Specials' },
    { key: 'Events', label: 'Events' },
    { key: 'other', label: 'Other' },
  ]
  const KNOWN_COURSES = COURSE_GROUPS.map(g => g.key).filter(k => k !== 'other')

  const activeRecipes = recipes.filter(r => !r.archived_at)
  const archivedRecipes = recipes.filter(r => !!r.archived_at)

  const grouped = Object.fromEntries(
    COURSE_GROUPS.map(g => [
      g.key,
      activeRecipes.filter(r => {
        const cat = r.category ?? ''
        if (g.key === 'other') return !KNOWN_COURSES.includes(cat)
        return cat === g.key
      })
    ])
  )

  function formatRelativeDate(iso: string) {
    const date = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined })
  }

  function RecipeCard({ recipe, archived = false }: { recipe: RecipeRow; archived?: boolean }) {
    const id = recipe.id
    const name = recipe.name
    const isLive = liveRecipeIds.has(id)
    const foodCost = calcFoodCost(recipe)
    const sellPrice = recipe.sell_price ?? 0
    const gp = sellPrice > 0 ? calcGpPercent(foodCost, sellPrice) : null
    const suggested = calcSuggestedPrice(foodCost, targetGp)
    const recipeAllergens = ALLERGENS.filter(a =>
      recipe.recipe_ingredients?.some(ri => ri.ingredients?.[a.key])
    )

    return (
      <Card className={`transition-all ${archived ? 'opacity-60' : isLive ? 'ring-1 ring-green-300 bg-green-50/30' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{name}</h3>
              {isLive && !archived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                  <Radio className="h-2.5 w-2.5" /> Live
                </span>
              )}
              <Badge variant={recipe.status === 'approved' ? 'green' : recipe.status === 'rejected' ? 'red' : 'yellow'}>
                {recipe.status}
              </Badge>
              {archived && <Badge variant="gray">Archived</Badge>}
            </div>
            {recipe.description && (
              <p className="text-sm text-mise-ink/50 mt-1">{recipe.description}</p>
            )}
            {recipeAllergens.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recipeAllergens.map(a => <AllergenBadge key={a.key} allergenKey={a.key} size="sm" />)}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Last updated {formatRelativeDate(recipe.updated_at)}
              {recipe.created_at !== recipe.updated_at
                ? ` · Created ${formatRelativeDate(recipe.created_at)}`
                : ''}
            </p>
          </div>

          <div className="flex items-start gap-4">
            {!archived && (
              <div className="flex gap-5 text-right shrink-0">
                <div>
                  <p className="text-xs text-mise-ink/50">Food cost</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(foodCost)}</p>
                </div>
                {sellPrice > 0 && (
                  <div>
                    <p className="text-xs text-mise-ink/50">GP</p>
                    <p className={`font-semibold ${gp !== null && gp >= targetGp ? 'text-green-700' : 'text-red-600'}`}>
                      {gp !== null ? formatPercent(gp) : '—'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-mise-ink/50">Suggested</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(suggested)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {!archived && (
                <>
                  <button
                    onClick={() => handleDuplicate(id)}
                    title="Duplicate recipe"
                    disabled={duplicating === id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    {duplicating === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <Link
                    href={`/chef/recipes/${id}/edit`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </>
              )}
              <button
                onClick={() => handleArchive(id, archived)}
                title={archived ? 'Restore recipe' : 'Archive recipe'}
                className={`p-1.5 rounded-lg transition-colors ${
                  archived
                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return <div className="py-24 text-center text-sm text-mise-ink/40">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">Recipes</h1>
          <p className="text-mise-ink/50 mt-1">Target GP: {targetGp}%</p>
        </div>
        <Link
          href="/chef/recipes/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add recipe
        </Link>
      </div>

      {activeRecipes.length === 0 && archivedRecipes.length === 0 ? (
        <Card className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No recipes yet</h3>
          <p className="text-sm text-gray-500 mb-6">Build your first recipe from your ingredients.</p>
          <Link
            href="/chef/recipes/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add recipe
          </Link>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active recipes grouped by course */}
          {COURSE_GROUPS.map(({ key, label }) => {
            const items = grouped[key]
            if (!items || items.length === 0) return null
            return (
              <div key={key}>
                <h2 className="text-sm font-semibold text-mise-ink/50 uppercase tracking-widest mb-3">{label}</h2>
                <div className="space-y-3">
                  {items.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
                </div>
              </div>
            )
          })}

          {/* Archived section */}
          {archivedRecipes.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived(o => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-widest mb-3 transition-colors"
              >
                {showArchived ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Archive className="h-3.5 w-3.5" />
                Archived ({archivedRecipes.length})
              </button>
              {showArchived && (
                <div className="space-y-3">
                  {archivedRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} archived />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
