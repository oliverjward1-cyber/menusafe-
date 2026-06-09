'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcSuggestedPrice } from '@/lib/utils'
import { RECIPE_CATEGORIES } from '@/lib/constants/allergens'
import { ChevronLeft, Search, X, AlertTriangle } from 'lucide-react'

const ALLERGEN_MAP = [
  { offKey: 'gluten',                        dbKey: 'allergen_cereals_gluten', label: 'Gluten' },
  { offKey: 'crustaceans',                   dbKey: 'allergen_crustaceans',   label: 'Crustaceans' },
  { offKey: 'eggs',                          dbKey: 'allergen_eggs',          label: 'Eggs' },
  { offKey: 'fish',                          dbKey: 'allergen_fish',          label: 'Fish' },
  { offKey: 'peanuts',                       dbKey: 'allergen_peanuts',       label: 'Peanuts' },
  { offKey: 'soybeans',                      dbKey: 'allergen_soya',          label: 'Soy' },
  { offKey: 'milk',                          dbKey: 'allergen_milk',          label: 'Milk' },
  { offKey: 'nuts',                          dbKey: 'allergen_nuts',          label: 'Tree nuts' },
  { offKey: 'celery',                        dbKey: 'allergen_celery',        label: 'Celery' },
  { offKey: 'mustard',                       dbKey: 'allergen_mustard',       label: 'Mustard' },
  { offKey: 'sesame',                        dbKey: 'allergen_sesame',        label: 'Sesame' },
  { offKey: 'sulphur-dioxide-and-sulphites', dbKey: 'allergen_sulphites',     label: 'Sulphites' },
  { offKey: 'sulphur-dioxide',               dbKey: 'allergen_sulphites',     label: 'Sulphites' },
  { offKey: 'lupin',                         dbKey: 'allergen_lupin',         label: 'Lupin' },
  { offKey: 'molluscs',                      dbKey: 'allergen_molluscs',      label: 'Molluscs' },
]

function allergenLabel(dbKey: string) {
  return ALLERGEN_MAP.find((a) => a.dbKey === dbKey)?.label ?? dbKey
}

function detectAllergensFromName(name: string): string[] {
  const n = name.toLowerCase()
  const found = new Set<string>()
  const checks: [string[], string][] = [
    [['milk', 'cream', 'butter', 'cheese', 'yogurt', 'dairy', 'whey', 'lactose', 'cheddar', 'mozzarella', 'parmesan'], 'allergen_milk'],
    [['egg'], 'allergen_eggs'],
    [['wheat', 'flour', 'bread', 'gluten', 'barley', 'rye', 'oat', 'pasta', 'noodle', 'semolina', 'spelt'], 'allergen_cereals_gluten'],
    [['peanut', 'groundnut'], 'allergen_peanuts'],
    [['almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'brazil nut', 'pine nut'], 'allergen_nuts'],
    [['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh'], 'allergen_soya'],
    [['fish', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'sardine', 'anchovy', 'bass', 'halibut', 'tilapia', 'mackerel', 'herring'], 'allergen_fish'],
    [['prawn', 'shrimp', 'crab', 'lobster', 'crayfish', 'langoustine', 'scampi'], 'allergen_crustaceans'],
    [['mussel', 'oyster', 'scallop', 'squid', 'octopus', 'clam', 'mollusc'], 'allergen_molluscs'],
    [['celery', 'celeriac'], 'allergen_celery'],
    [['mustard'], 'allergen_mustard'],
    [['sesame', 'tahini'], 'allergen_sesame'],
    [['lupin'], 'allergen_lupin'],
    [['sulphite', 'sulfite', 'wine', 'vinegar', 'dried fruit'], 'allergen_sulphites'],
  ]
  checks.forEach(([keywords, dbKey]) => {
    if (keywords.some((k) => n.includes(k))) found.add(dbKey)
  })
  return Array.from(found)
}

function detectAllergensFromOFF(product: Record<string, unknown>): string[] {
  const tags = ((product.allergens_tags as string[]) ?? []).map((t) =>
    t.toLowerCase().replace('en:', '')
  )
  const text = (
    ((product.allergens as string) ?? '') +
    ' ' +
    ((product.ingredients_text as string) ?? '')
  ).toLowerCase()
  const found = new Set<string>()
  ALLERGEN_MAP.forEach(({ offKey, dbKey }) => {
    if (tags.some((t) => t.includes(offKey)) || text.includes(offKey)) found.add(dbKey)
  })
  return Array.from(found)
}

function allergensFromRow(row: Record<string, unknown>): string[] {
  return ALLERGEN_MAP.filter(({ dbKey }) => row[dbKey]).map(({ dbKey }) => dbKey)
}

function costPerGram(ing: Record<string, unknown>): number {
  const cpu = ing.cost_per_unit as number
  switch (ing.unit_type) {
    case 'kg':    return cpu / 1000
    case 'g':     return cpu
    case 'litre': return cpu / 1000
    case 'ml':    return cpu / 1000
    default:      return 0
  }
}

interface Result {
  type: 'library' | 'off'
  name: string
  brand?: string
  kcal?: number
  allergens: string[]
  row?: Record<string, unknown>
  product?: Record<string, unknown>
}

interface Line {
  uid: number
  name: string
  brand?: string
  source: 'library' | 'off'
  ingredientId?: string
  product?: Record<string, unknown>
  qtyG: number
  kcalPer100?: number
  allergenDbKeys: string[]
  cpg: number
  costPerKg?: number
}

let uidCounter = 0

export default function EditRecipePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [loading, setLoading] = useState(true)
  const [recipeName, setRecipeName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [portionSize, setPortionSize] = useState('')
  const [sellPrice, setSellPrice] = useState('')

  const [library, setLibrary] = useState<Record<string, unknown>[]>([])
  const [targetGp, setTargetGp] = useState(70)
  const [restaurantId, setRestaurantId] = useState('')
  const [lines, setLines] = useState<Line[]>([])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [pending, setPending] = useState<Result | null>(null)
  const [qtyInput, setQtyInput] = useState('')
  const [costInput, setCostInput] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null)

  const updateDropRect = useCallback(() => {
    if (searchInputRef.current) {
      const r = searchInputRef.current.getBoundingClientRect()
      setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
  }, [])

  useEffect(() => {
    if (showDrop) updateDropRect()
  }, [showDrop, updateDropRect])

  const [mayContain, setMayContain] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Load profile, library, restaurant settings, and the recipe to edit
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) return
      setRestaurantId(profile.restaurant_id)

      const [ingRes, restRes, recipeRes] = await Promise.all([
        supabase.from('ingredients').select('*').eq('restaurant_id', profile.restaurant_id).order('name'),
        supabase.from('restaurants').select('target_gp').eq('id', profile.restaurant_id).single(),
        supabase
          .from('recipes')
          .select('*, recipe_ingredients(*, ingredients(*))')
          .eq('id', params.id)
          .single(),
      ])

      setLibrary((ingRes.data ?? []) as Record<string, unknown>[])
      setTargetGp((restRes.data?.target_gp as number) ?? 70)

      const recipe = recipeRes.data
      if (!recipe) {
        setError('Recipe not found')
        setLoading(false)
        return
      }

      setRecipeName(recipe.name ?? '')
      setDescription(recipe.description ?? '')
      setCategory(recipe.category ?? '')
      setPortionSize(recipe.portion_size ?? '')
      setSellPrice(recipe.sell_price != null ? String(recipe.sell_price) : '')
      setMayContain(recipe.may_contain_allergens ?? [])

      const loadedLines: Line[] = (recipe.recipe_ingredients ?? []).map(
        (ri: Record<string, unknown>) => {
          const ing = ri.ingredients as Record<string, unknown>
          const cpg = costPerGram(ing)
          return {
            uid: uidCounter++,
            source: 'library' as const,
            ingredientId: ri.ingredient_id as string,
            name: ing.name as string,
            qtyG: ri.quantity as number,
            allergenDbKeys: allergensFromRow(ing),
            cpg,
            costPerKg: cpg * 1000,
            kcalPer100: (ing.kcal_per_100g as number | undefined) ?? undefined,
          }
        }
      )
      setLines(loadedLines)
      setLoading(false)
    }
    load()
  }, [supabase, params.id, router])

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setShowDrop(false)
      return
    }
    timer.current = setTimeout(() => search(query.trim()), 400)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  async function search(q: string) {
    setSearching(true)
    updateDropRect()
    setShowDrop(true)

    const libHits: Result[] = library
      .filter((i) => (i.name as string).toLowerCase().includes(q.toLowerCase()))
      .slice(0, 4)
      .map((i) => ({
        type: 'library' as const,
        name: i.name as string,
        allergens: allergensFromRow(i),
        row: i,
      }))

    try {
      const url =
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}` +
        `&dataType=Foundation,SR%20Legacy&pageSize=8&api_key=DEMO_KEY`
      const res = await fetch(url)
      const data = await res.json() as { foods?: Record<string, unknown>[] }
      const usdaHits: Result[] = (data.foods ?? [])
        .filter((f) => f.description)
        .slice(0, 6)
        .map((f) => {
          const nutrients = (f.foodNutrients as Record<string, unknown>[] | undefined) ?? []
          const kcalEntry = nutrients.find(
            (n) => (n.nutrientName as string)?.toLowerCase().includes('energy') && (n.unitName as string) === 'kcal'
          )
          const kcal = kcalEntry?.value ? Math.round(kcalEntry.value as number) : undefined
          const name = (f.description as string)
            .toLowerCase()
            .replace(/,\s*raw$/i, '')
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim()
          return {
            type: 'off' as const,
            name,
            kcal,
            allergens: detectAllergensFromName(name),
            product: f,
          }
        })
      setResults([...libHits, ...usdaHits])
    } catch {
      setResults(libHits)
    }
    setSearching(false)
  }

  function selectResult(r: Result) {
    setPending(r)
    setQuery(r.name)
    setShowDrop(false)
    setQtyInput('')
    if (r.type === 'library' && r.row) {
      const cpg = costPerGram(r.row)
      setCostInput(cpg > 0 ? (cpg * 1000).toFixed(2) : '')
    } else {
      setCostInput('')
    }
  }

  function addLine() {
    if (!pending || !qtyInput) return
    const qty = parseFloat(qtyInput)
    if (!qty || qty <= 0) return

    let line: Line
    if (pending.type === 'library' && pending.row) {
      const cpg = costPerGram(pending.row)
      line = {
        uid: uidCounter++,
        name: pending.name,
        source: 'library',
        ingredientId: pending.row.id as string,
        qtyG: qty,
        kcalPer100: (pending.row.kcal_per_100g as number | undefined) ?? pending.kcal,
        allergenDbKeys: allergensFromRow(pending.row),
        cpg,
        costPerKg: cpg * 1000,
      }
    } else {
      const costPerKg = costInput ? parseFloat(costInput) : 0
      line = {
        uid: uidCounter++,
        name: pending.name,
        brand: pending.brand,
        source: 'off',
        product: pending.product,
        qtyG: qty,
        kcalPer100: pending.kcal,
        allergenDbKeys: pending.allergens,
        cpg: costPerKg / 1000,
        costPerKg,
      }
    }

    setLines((prev) => [...prev, line])
    setQuery('')
    setPending(null)
    setQtyInput('')
    setCostInput('')
  }

  const foodCost = lines.reduce((s, l) => s + l.qtyG * l.cpg, 0)
  const suggestedPrice = calcSuggestedPrice(foodCost, targetGp)
  const sellNum = parseFloat(sellPrice)
  const currentGp =
    sellPrice && foodCost > 0 ? ((sellNum - foodCost) / sellNum) * 100 : null
  const totalKcal = lines.reduce(
    (s, l) => (l.kcalPer100 ? s + Math.round((l.kcalPer100 * l.qtyG) / 100) : s),
    0
  )
  const allAllergens = Array.from(new Set(lines.flatMap((l) => l.allergenDbKeys)))
  const hasOff = lines.some((l) => l.source === 'off')

  async function handleSave() {
    if (!recipeName.trim()) { setError('Recipe name is required'); return }
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Resolve ingredient IDs (same logic as new page)
      const resolved: { line: Line; ingredientId: string }[] = []
      for (const line of lines) {
        if (line.source === 'library' && line.ingredientId) {
          resolved.push({ line, ingredientId: line.ingredientId })
          continue
        }
        const existing = library.find(
          (i) => (i.name as string).toLowerCase() === line.name.toLowerCase()
        )
        if (existing) {
          resolved.push({ line, ingredientId: existing.id as string })
          continue
        }
        const allergenFields: Record<string, boolean> = {}
        ALLERGEN_MAP.forEach(({ dbKey }) => {
          allergenFields[dbKey] = line.allergenDbKeys.includes(dbKey)
        })
        const { data: newIng, error: ingErr } = await supabase
          .from('ingredients')
          .insert({
            restaurant_id: restaurantId,
            name: line.name,
            cost_per_unit: 0,
            unit_type: 'g',
            ...allergenFields,
          })
          .select('id')
          .single()
        if (ingErr || !newIng) throw new Error('Failed to save ingredient: ' + line.name)
        resolved.push({ line, ingredientId: newIng.id as string })
      }

      // Update the recipe row
      const { error: recipeErr } = await supabase
        .from('recipes')
        .update({
          name: recipeName.trim(),
          description: description.trim() || null,
          category: category || null,
          portion_size: portionSize.trim() || null,
          sell_price: sellPrice ? parseFloat(sellPrice) : null,
          may_contain_allergens: mayContain,
        })
        .eq('id', params.id)

      if (recipeErr) throw new Error(recipeErr.message)

      // Delete existing recipe_ingredients then re-insert
      const { error: delErr } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', params.id)

      if (delErr) throw new Error(delErr.message)

      if (resolved.length > 0) {
        const { error: riErr } = await supabase.from('recipe_ingredients').insert(
          resolved.map(({ line, ingredientId }) => ({
            recipe_id: params.id,
            ingredient_id: ingredientId,
            quantity: line.qtyG,
            unit_type: 'g',
          }))
        )
        if (riErr) throw new Error(riErr.message)
      }

      router.push('/chef/recipes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    setDeleting(true)
    setError('')
    try {
      const { error: err } = await supabase.from('recipes').delete().eq('id', params.id)
      if (err) throw new Error(err.message)
      router.push('/chef/recipes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe')
      setDeleting(false)
    }
  }

  const dropdownEl = showDrop && dropRect ? (
    <div
      style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
    >
      {searching && <div className="px-3 py-2 text-xs text-hospopilot-ink/40">Searching…</div>}
      {!searching && results.length === 0 && (
        <div className="px-3 py-2 text-xs text-hospopilot-ink/40">No results found</div>
      )}
      {results.map((r, i) => (
        <button key={i} onMouseDown={() => selectResult(r)}
          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-hospopilot-ink">{r.name}</span>
            {r.type === 'library' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Library</span>
            )}
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
            {r.type === 'library'
              ? <span className="text-green-600">Cost from your library</span>
              : <>
                  {r.brand && <span>{r.brand}</span>}
                  {r.kcal != null && <span className="text-amber-600 font-medium">{r.kcal} kcal/100g</span>}
                  {r.allergens.length > 0 && (
                    <span className="text-red-500">{r.allergens.length} allergen{r.allergens.length !== 1 ? 's' : ''}</span>
                  )}
                </>}
          </div>
        </button>
      ))}
    </div>
  ) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-hospopilot-ink/40">Loading recipe…</p>
      </div>
    )
  }

  return (
    <>
    {dropdownEl}
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/chef/recipes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-display font-semibold text-hospopilot-ink">Edit recipe</h1>
      </div>

      {/* Recipe details */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Recipe details</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Recipe name</label>
            <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g. Grilled Chicken Caesar"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-hospopilot-gold/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none">
                <option value="">Select category</option>
                {RECIPE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Portion size</label>
              <input type="text" value={portionSize} onChange={(e) => setPortionSize(e.target.value)}
                placeholder="e.g. 280g"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Brief description for the menu..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Sell price (£)</label>
            <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00" step="0.01" min="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none" />
            <p className="mt-1 text-xs text-hospopilot-ink/40">Used to calculate gross profit % in the summary below.</p>
          </div>
        </div>
      </div>

      {/* May contain allergens */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-1">May contain</h2>
        <p className="text-xs text-gray-400 mb-4">
          Tick any allergens that may be present due to kitchen cross-contamination — even if not in the recipe ingredients.
          These appear as a separate "may contain" warning on the customer menu.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALLERGEN_MAP.filter((a, i, arr) => arr.findIndex(b => b.dbKey === a.dbKey) === i).map((a) => {
            const checked = mayContain.includes(a.dbKey)
            return (
              <label key={a.dbKey} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setMayContain(prev => e.target.checked ? [...prev, a.dbKey] : prev.filter(k => k !== a.dbKey))
                  }}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <span className="text-sm text-gray-700">{a.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-xl">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Ingredients</h2>
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Allergens auto-detected
          </span>
        </div>

        {lines.length === 0 ? (
          <div className="py-10 text-center text-sm text-hospopilot-ink/40">
            No ingredients yet — search below to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Ingredient</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Kcal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Cost</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Allergens</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lines.map((l) => {
                  const itemKcal = l.kcalPer100 ? Math.round((l.kcalPer100 * l.qtyG) / 100) : null
                  const itemCost = l.cpg * l.qtyG
                  return (
                    <tr key={l.uid} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{l.name}</div>
                        {l.brand && <div className="text-xs text-hospopilot-ink/40">{l.brand}</div>}
                        {l.source === 'library'
                          ? <div className="text-xs text-green-600 mt-0.5">From your library</div>
                          : l.kcalPer100 && <div className="text-xs text-gray-400 mt-0.5">{l.kcalPer100} kcal/100g</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.qtyG}g</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {itemKcal !== null ? `${itemKcal} kcal` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {itemCost > 0 ? formatCurrency(itemCost) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {l.allergenDbKeys.length > 0
                            ? l.allergenDbKeys.map((k) => (
                                <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                                  {allergenLabel(k)}
                                </span>
                              ))
                            : <span className="text-xs text-hospopilot-ink/40">None detected</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setLines((prev) => prev.filter((i) => i.uid !== l.uid))}
                          className="text-gray-300 hover:text-red-500 transition-colors">
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

        {/* Search row */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3 rounded-b-xl">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_130px_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Search ingredient</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input ref={searchInputRef} type="text" value={query}
                  onChange={(e) => { setQuery(e.target.value); setPending(null) }}
                  onFocus={() => { if (results.length > 0) { updateDropRect(); setShowDrop(true) } }}
                  onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                  placeholder="e.g. chicken breast, cheddar..."
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:border-green-600 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">Qty (g)</label>
              <input type="number" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)}
                placeholder="0" min="0" step="1"
                onKeyDown={(e) => e.key === 'Enter' && addLine()}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-hospopilot-ink/40 uppercase tracking-widest mb-1.5">
                Cost (£/kg)
                {pending?.type === 'library' && <span className="ml-1 text-green-600 normal-case font-normal">auto</span>}
              </label>
              <input
                type="number"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                placeholder="e.g. 3.50"
                step="0.01" min="0"
                disabled={pending?.type === 'library'}
                onKeyDown={(e) => e.key === 'Enter' && addLine()}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>
            <button onClick={addLine} disabled={!pending || !qtyInput}
              className="h-[38px] px-4 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
              + Add
            </button>
          </div>
          {pending?.type === 'off' && (
            <p className="text-xs text-hospopilot-ink/40">
              Enter cost price per kg so food cost and GP can be calculated accurately.
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Recipe summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Food cost</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{formatCurrency(foodCost)}</p>
            {foodCost === 0 && lines.length > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">Add cost prices above</p>
            )}
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Suggested ({targetGp}% GP)</p>
            <p className="text-xl font-semibold text-green-700 mt-1">{formatCurrency(suggestedPrice)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Current GP</p>
            <p className={`text-xl font-semibold mt-1 ${currentGp === null ? 'text-gray-300' : currentGp >= targetGp ? 'text-green-700' : 'text-red-600'}`}>
              {currentGp !== null ? `${currentGp.toFixed(1)}%` : '—'}
            </p>
            {currentGp !== null && (
              <p className={`text-xs mt-0.5 ${currentGp >= targetGp ? 'text-green-600' : 'text-red-500'}`}>
                {currentGp >= targetGp ? `↑ ${(currentGp - targetGp).toFixed(1)}% above target` : `↓ ${(targetGp - currentGp).toFixed(1)}% below target`}
              </p>
            )}
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total kcal</p>
            <p className="text-xl font-semibold text-amber-700 mt-1">{totalKcal > 0 ? totalKcal : '—'}</p>
            {totalKcal > 0 && <p className="text-xs text-gray-400 mt-0.5">per portion</p>}
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
              Allergens auto-detected from Open Food Facts — verify before publishing.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="px-5 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {deleting ? 'Deleting…' : 'Delete recipe'}
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/chef/recipes')}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !recipeName.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
