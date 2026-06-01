'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcSuggestedPrice } from '@/lib/utils'
import { RECIPE_CATEGORIES } from '@/lib/constants/allergens'
import { ChevronLeft, Search, X, AlertTriangle } from 'lucide-react'

// Maps Open Food Facts allergen keys to DB column names
const ALLERGEN_MAP = [
  { offKey: 'gluten',                          dbKey: 'allergen_cereals_gluten', label: 'Gluten' },
  { offKey: 'crustaceans',                     dbKey: 'allergen_crustaceans',   label: 'Crustaceans' },
  { offKey: 'eggs',                            dbKey: 'allergen_eggs',          label: 'Eggs' },
  { offKey: 'fish',                            dbKey: 'allergen_fish',          label: 'Fish' },
  { offKey: 'peanuts',                         dbKey: 'allergen_peanuts',       label: 'Peanuts' },
  { offKey: 'soybeans',                        dbKey: 'allergen_soya',          label: 'Soy' },
  { offKey: 'milk',                            dbKey: 'allergen_milk',          label: 'Milk' },
  { offKey: 'nuts',                            dbKey: 'allergen_nuts',          label: 'Tree nuts' },
  { offKey: 'celery',                          dbKey: 'allergen_celery',        label: 'Celery' },
  { offKey: 'mustard',                         dbKey: 'allergen_mustard',       label: 'Mustard' },
  { offKey: 'sesame',                          dbKey: 'allergen_sesame',        label: 'Sesame' },
  { offKey: 'sulphur-dioxide-and-sulphites',   dbKey: 'allergen_sulphites',     label: 'Sulphites' },
  { offKey: 'sulphur-dioxide',                 dbKey: 'allergen_sulphites',     label: 'Sulphites' },
  { offKey: 'lupin',                           dbKey: 'allergen_lupin',         label: 'Lupin' },
  { offKey: 'molluscs',                        dbKey: 'allergen_molluscs',      label: 'Molluscs' },
]

function allergenLabel(dbKey: string) {
  return ALLERGEN_MAP.find((a) => a.dbKey === dbKey)?.label ?? dbKey
}

function detectAllergensFromOFF(product: any): string[] {
  const tags = (product.allergens_tags ?? []).map((t: string) =>
    t.toLowerCase().replace('en:', '')
  )
  const text = ((product.allergens ?? '') + ' ' + (product.ingredients_text ?? '')).toLowerCase()
  const found = new Set<string>()
  ALLERGEN_MAP.forEach(({ offKey, dbKey }) => {
    if (tags.some((t: string) => t.includes(offKey)) || text.includes(offKey)) {
      found.add(dbKey)
    }
  })
  return Array.from(found)
}

function allergensFromLibraryRow(row: any): string[] {
  return ALLERGEN_MAP.filter(({ dbKey }) => row[dbKey]).map(({ dbKey }) => dbKey)
}

function costPerGram(ing: any): number {
  switch (ing.unit_type) {
    case 'kg':    return ing.cost_per_unit / 1000
    case 'g':     return ing.cost_per_unit
    case 'litre': return ing.cost_per_unit / 1000
    case 'ml':    return ing.cost_per_unit / 1000
    default:      return 0
  }
}

interface SearchResult {
  type: 'library' | 'off'
  name: string
  brand?: string
  kcal?: number | null
  allergens: string[]
  ingredient?: any   // library row
  product?: any      // OFF product
}

interface LineItem {
  uid: number
  name: string
  brand?: string
  source: 'library' | 'off'
  ingredientId?: string
  product?: any
  qtyG: number
  kcalPer100g?: number | null
  allergenDbKeys: string[]
  cpg: number  // cost per gram
}

let uid = 0

export default function NewRecipePage() {
  const router = useRouter()
  const supabase = createClient()

  const [recipeName, setRecipeName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [portionSize, setPortionSize] = useState('')
  const [sellPrice, setSellPrice] = useState('')

  const [library, setLibrary] = useState<any[]>([])
  const [targetGp, setTargetGp] = useState(70)
  const [restaurantId, setRestaurantId] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [pendingResult, setPendingResult] = useState<SearchResult | null>(null)
  const [qtyInput, setQtyInput] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) return
      setRestaurantId(profile.restaurant_id)
      const [ingRes, restRes] = await Promise.all([
        supabase.from('ingredients').select('*').eq('restaurant_id', profile.restaurant_id).order('name'),
        supabase.from('restaurants').select('target_gp').eq('id', profile.restaurant_id).single(),
      ])
      setLibrary(ingRes.data ?? [])
      setTargetGp(restRes.data?.target_gp ?? 70)
    }
    load()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDrop(false); return }
    setSearching(true)
    setShowDrop(true)

    const libraryHits: SearchResult[] = library
      .filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 4)
      .map((i) => ({
        type: 'library' as const,
        name: i.name,
        allergens: allergensFromLibraryRow(i),
        ingredient: i,
      }))

    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=6&fields=product_name,brands,nutriments,allergens_tags,allergens,ingredients_text&lc=en&cc=gb`
      const res = await fetch(url)
      const data = await res.json()
      const offHits: SearchResult[] = (data.products ?? [])
        .filter((p: any) => p.product_name)
        .slice(0, 5)
        .map((p: any) => ({
          type: 'off' as const,
          name: p.product_name,
          brand: p.brands ? p.brands.split(',')[0].trim() : undefined,
          kcal: p.nutriments?.['energy-kcal_100g'] ? Math.round(p.nutriments['energy-kcal_100g']) : null,
          allergens: detectAllergensFromOFF(p),
          product: p,
        }))
      setResults([...libraryHits, ...offHits])
    } catch {
      setResults(libraryHits)
    }
    setSearching(false)
  }, [library])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (!query.trim()) { setResults([]); setShowDrop(false); return }
    searchTimer.current = setTimeout(() => doSearch(query.trim()), 400)
  }, [query, doSearch])

  function selectResult(r: SearchResult) {
    setPendingResult(r)
    setQuery(r.name)
    setShowDrop(false)
    setQtyInput('')
  }

  function addLine() {
    if (!pendingResult || !qtyInput) return
    const qty = parseFloat(qtyInput)
    if (!qty || qty <= 0) return

    let item: LineItem
    if (pendingResult.type === 'library') {
      const ing = pendingResult.ingredient
      item = {
        uid: uid++,
        name: ing.name,
        source: 'library',
        ingredientId: ing.id,
        qtyG: qty,
        allergenDbKeys: allergensFromLibraryRow(ing),
        cpg: costPerGram(ing),
      }
    } else {
      item = {
        uid: uid++,
        name: pendingResult.name,
        brand: pendingResult.brand,
        source: 'off',
        product: pendingResult.product,
        qtyG: qty,
        kcalPer100g: pendingResult.kcal,
        allergenDbKeys: pendingResult.allergens,
        cpg: 0,
      }
    }

    setLineItems((prev) => [...prev, item])
    setQuery('')
    setPendingResult(null)
    setQtyInput('')
  }

  const foodCost = lineItems.reduce((sum, li) => sum + li.qtyG * li.cpg, 0)
  const suggestedPrice = calcSuggestedPrice(foodCost, targetGp)
  const currentGp =
    sellPrice && foodCost > 0
      ? ((parseFloat(sellPrice) - foodCost) / parseFloat(sellPrice)) * 100
      : null
  const totalKcal = lineItems.reduce(
    (sum, li) => (li.kcalPer100g ? sum + Math.round((li.kcalPer100g * li.qtyG) / 100) : sum),
    0
  )
  const allAllergens = [...new Set(lineItems.flatMap((li) => li.allergenDbKeys))]
  const hasOff = lineItems.some((li) => li.source === 'off')

  async function handleSave() {
    if (!recipeName.trim()) { setError('Recipe name is required'); return }
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Resolve or create ingredients for OFF items
      const resolved: { lineItem: LineItem; ingredientId: string }[] = []
      for (const li of lineItems) {
        if (li.source === 'library' && li.ingredientId) {
          resolved.push({ lineItem: li, ingredientId: li.ingredientId })
          continue
        }
        // Check if already in library by name
        const existing = library.find((i) => i.name.toLowerCase() === li.name.toLowerCase())
        if (existing) {
          resolved.push({ lineItem: li, ingredientId: existing.id })
          continue
        }
        // Create new ingredient from OFF data
        const allergenFields: Record<string, boolean> = {}
        ALLERGEN_MAP.forEach(({ dbKey }) => { allergenFields[dbKey] = li.allergenDbKeys.includes(dbKey) })
        const { data: newIng, error: ingErr } = await supabase
          .from('ingredients')
          .insert({ restaurant_id: restaurantId, name: li.name, cost_per_unit: 0, unit_type: 'g', ...allergenFields })
          .select('id')
          .single()
        if (ingErr || !newIng) throw new Error('Failed to save ingredient: ' + li.name)
        resolved.push({ lineItem: li, ingredientId: newIng.id })
      }

      // Create recipe
      const { data: recipe, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          restaurant_id: restaurantId,
          name: recipeName.trim(),
          description: description.trim() || null,
          category: category || null,
          portion_size: portionSize.trim() || null,
          sell_price: sellPrice ? parseFloat(sellPrice) : null,
          status: 'draft',
          created_by: user.id,
        })
        .select('id')
        .single()

      if (recipeErr || !recipe) throw new Error(recipeErr?.message ?? 'Failed to save recipe')

      if (resolved.length > 0) {
        const { error: riErr } = await supabase.from('recipe_ingredients').insert(
          resolved.map(({ lineItem, ingredientId }) => ({
            recipe_id: recipe.id,
            ingredient_id: ingredientId,
            quantity: lineItem.qtyG,
            unit_type: 'g',
          }))
        )
        if (riErr) throw new Error(riErr.message)
      }

      router.push('/chef/recipes')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/chef/recipes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add recipe</h1>
      </div>

      {/* Recipe details */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Recipe details</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Recipe name</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g. Grilled Chicken Caesar"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
              >
                <option value="">Select category</option>
                {RECIPE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Portion size</label>
              <input
                type="text"
                value={portionSize}
                onChange={(e) => setPortionSize(e.target.value)}
                placeholder="e.g. 280g"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description for the menu..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Sell price (£)</label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Ingredients</h2>
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Allergens auto-detected via Open Food Facts
          </span>
        </div>

        {lineItems.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No ingredients added yet — search below to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Ingredient</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Kcal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Allergens</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((li) => {
                  const itemKcal = li.kcalPer100g ? Math.round((li.kcalPer100g * li.qtyG) / 100) : null
                  return (
                    <tr key={li.uid} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{li.name}</div>
                        {li.brand && <div className="text-xs text-gray-400">{li.brand}</div>}
                        {li.source === 'library' && (
                          <div className="text-xs text-green-600 mt-0.5">From your library</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{li.qtyG}g</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {itemKcal !== null ? `${itemKcal} kcal` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {li.allergenDbKeys.length > 0
                            ? li.allergenDbKeys.map((k) => (
                                <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                                  {allergenLabel(k)}
                                </span>
                              ))
                            : <span className="text-xs text-gray-400">None detected</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setLineItems((prev) => prev.filter((i) => i.uid !== li.uid))}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Search + add row */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Search ingredient
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPendingResult(null) }}
                onFocus={() => query && results.length > 0 && setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder="e.g. chicken breast, cheddar..."
                className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:border-green-600 focus:outline-none"
              />
              {showDrop && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                  {searching && <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>}
                  {!searching && results.length === 0 && query.length > 1 && (
                    <div className="px-3 py-2 text-xs text-gray-400">No results found</div>
                  )}
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onMouseDown={() => selectResult(r)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        {r.type === 'library'
                          ? <span className="text-green-600">In your library</span>
                          : <>
                              {r.brand && <span>{r.brand}</span>}
                              {r.kcal && <span>{r.kcal} kcal/100g</span>}
                              {r.allergens.length > 0 && (
                                <span className="text-amber-600">
                                  {r.allergens.length} allergen{r.allergens.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </>
                        }
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Qty (g)</label>
            <input
              type="number"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              onKeyDown={(e) => e.key === 'Enter' && addLine()}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            />
          </div>
          <button
            onClick={addLine}
            disabled={!pendingResult || !qtyInput}
            className="h-[38px] px-4 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Recipe summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Food cost</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{formatCurrency(foodCost)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Suggested ({targetGp}% GP)</p>
            <p className="text-xl font-semibold text-green-700 mt-1">{formatCurrency(suggestedPrice)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Current GP</p>
            <p className={`text-xl font-semibold mt-1 ${
              currentGp === null ? 'text-gray-300'
              : currentGp >= targetGp ? 'text-green-700'
              : 'text-red-600'
            }`}>
              {currentGp !== null ? `${currentGp.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total kcal</p>
            <p className="text-xl font-semibold text-amber-700 mt-1">
              {totalKcal > 0 ? totalKcal : '—'}
            </p>
          </div>
        </div>
        {allAllergens.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Allergens in this recipe</p>
            <div className="flex flex-wrap gap-1.5">
              {allAllergens.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                  {allergenLabel(k)}
                </span>
              ))}
            </div>
          </div>
        )}
        {hasOff && (
          <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/50">
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Allergens auto-detected from Open Food Facts. Always verify before publishing.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push('/chef/recipes')}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !recipeName.trim()}
          className="px-5 py-2.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save recipe'}
        </button>
      </div>
    </div>
  )
}
