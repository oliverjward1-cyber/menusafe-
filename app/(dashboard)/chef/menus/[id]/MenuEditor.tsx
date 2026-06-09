'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Globe, GlobeLock, Loader2, TrendingUp, AlertTriangle, CheckCircle2, GripVertical, X, Search, ChevronDown, ChevronRight } from 'lucide-react'

type Recipe = {
  id: string
  name: string
  category: string | null
  sell_price: number | null
  status: string
  is_active: boolean
  recipe_ingredients: {
    quantity: number
    unit_type: string
    ingredients: { cost_per_unit: number; unit_type: string } | null
  }[]
}

const DAYPARTS = [
  { value: 'all-day', label: 'All day' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'specials', label: 'Specials' },
]

function foodCost(recipe: Recipe): number {
  return recipe.recipe_ingredients.reduce((sum, ri) => {
    const ing = ri.ingredients
    if (!ing) return sum
    const qty = ri.quantity
    switch (ing.unit_type) {
      case 'kg': return sum + (qty / 1000) * ing.cost_per_unit
      case 'g': return sum + qty * ing.cost_per_unit
      case 'litre': return sum + (qty / 1000) * ing.cost_per_unit
      case 'ml': return sum + (qty / 1000) * ing.cost_per_unit
      case 'each': return sum + qty * ing.cost_per_unit
      default: return sum
    }
  }, 0)
}

function gpPct(recipe: Recipe): number | null {
  if (!recipe.sell_price) return null
  const cost = foodCost(recipe)
  return ((recipe.sell_price - cost) / recipe.sell_price) * 100
}

interface Props {
  menuId: string
  menuName: string
  menuDescription: string | null
  menuDaypart: string
  menuServiceStart: string | null
  menuServiceEnd: string | null
  isPublished: boolean
  allRecipes: Recipe[]
  initialSelectedIds: string[]
  menuUrl: string | null
}

export function MenuEditor({
  menuId, menuName, menuDescription, menuDaypart, menuServiceStart, menuServiceEnd, isPublished,
  allRecipes, initialSelectedIds, menuUrl,
}: Props) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [name, setName] = useState(menuName)
  const [description, setDescription] = useState(menuDescription ?? '')
  const [daypart, setDaypart] = useState(menuDaypart)
  const [serviceStart, setServiceStart] = useState(menuServiceStart ?? '')
  const [serviceEnd, setServiceEnd] = useState(menuServiceEnd ?? '')
  const [published, setPublished] = useState(isPublished)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())

  // Ordered list of selected recipe ids for the menu
  const [menuOrder, setMenuOrder] = useState<string[]>(() =>
    initialSelectedIds.filter(id => allRecipes.some(r => r.id === id))
  )

  // Drag state
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  const selectedSet = new Set(menuOrder)
  const menuRecipes = menuOrder.map(id => allRecipes.find(r => r.id === id)).filter(Boolean) as Recipe[]

  const available = allRecipes.filter(r => !selectedSet.has(r.id))
  const filtered = search.trim()
    ? available.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : available

  const byCategory = filtered.reduce<Record<string, Recipe[]>>((acc, r) => {
    const cat = r.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  const categories = ['Starters', 'Mains', 'Desserts', 'Other'].filter(c => byCategory[c]?.length)
    .concat(Object.keys(byCategory).filter(c => !['Starters', 'Mains', 'Desserts', 'Other'].includes(c)))

  function addToMenu(id: string) {
    setMenuOrder(prev => [...prev, id])
    setSaved(false)
  }

  function removeFromMenu(id: string) {
    setMenuOrder(prev => prev.filter(x => x !== id))
    setSaved(false)
  }

  function toggleCategory(cat: string) {
    setCollapsedCats(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  // Drag-to-reorder handlers for the menu list
  function onDragStart(index: number) {
    dragIndex.current = index
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    dragOverIndex.current = index
  }

  function onDrop() {
    if (dragIndex.current === null || dragOverIndex.current === null) return
    if (dragIndex.current === dragOverIndex.current) return
    const reordered = [...menuOrder]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(dragOverIndex.current, 0, moved)
    setMenuOrder(reordered)
    setSaved(false)
    dragIndex.current = null
    dragOverIndex.current = null
  }

  // GP summary
  const recipesWithPrice = menuRecipes.filter(r => r.sell_price)
  const avgGp = recipesWithPrice.length
    ? recipesWithPrice.reduce((sum, r) => sum + (gpPct(r) ?? 0), 0) / recipesWithPrice.length
    : null
  const totalMenuRevenue = menuRecipes.reduce((s, r) => s + (r.sell_price ?? 0), 0)
  const totalMenuCost = menuRecipes.reduce((s, r) => s + foodCost(r), 0)

  async function handleSave() {
    if (!name.trim()) { setError('Menu name is required'); return }
    setSaving(true)
    setError('')

    await supabase.from('menus').update({
      name: name.trim(),
      description: description.trim() || null,
      daypart,
      service_start: serviceStart || null,
      service_end: serviceEnd || null,
      updated_at: new Date().toISOString(),
    }).eq('id', menuId)

    await supabase.from('menu_recipes').delete().eq('menu_id', menuId)
    if (menuOrder.length > 0) {
      await supabase.from('menu_recipes').insert(
        menuOrder.map((recipe_id, position) => ({ menu_id: menuId, recipe_id, position }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  async function handlePublishToggle() {
    setPublishing(true)
    const nowPublished = !published
    await supabase.from('menus').update({ is_published: nowPublished }).eq('id', menuId)
    setPublished(nowPublished)
    if (nowPublished) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()
      const { data: restaurant } = profile?.restaurant_id
        ? await supabase.from('restaurants').select('name').eq('id', profile.restaurant_id).single()
        : { data: null }
      fetch('/api/notify-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuName: name, menuId, restaurantName: restaurant?.name ?? '' }),
      })
    }
    setPublishing(false)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Menu details */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Menu details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input value={name} onChange={e => { setName(e.target.value); setSaved(false) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
            <select value={daypart} onChange={e => { setDaypart(e.target.value); setSaved(false) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent bg-white">
              {DAYPARTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <input value={description} onChange={e => { setDescription(e.target.value); setSaved(false) }}
            placeholder="Optional — shown on the customer menu"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Service times <span className="font-normal text-gray-400">(optional)</span></label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-400 shrink-0">From</span>
              <input
                type="time"
                value={serviceStart}
                onChange={e => { setServiceStart(e.target.value); setSaved(false) }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-400 shrink-0">Until</span>
              <input
                type="time"
                value={serviceEnd}
                onChange={e => { setServiceEnd(e.target.value); setSaved(false) }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent"
              />
            </div>
            {(serviceStart || serviceEnd) && (
              <button
                type="button"
                onClick={() => { setServiceStart(''); setServiceEnd(''); setSaved(false) }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                Clear
              </button>
            )}
          </div>
          {serviceStart && serviceEnd && (
            <p className="text-xs text-gray-400 mt-1.5">
              This menu runs from <span className="font-medium text-mise-ink">{serviceStart}</span> to <span className="font-medium text-mise-ink">{serviceEnd}</span>
            </p>
          )}
        </div>
      </div>

      {/* Two-panel builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: available dishes */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Available dishes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click a dish to add it to your menu</p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mise-ink/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mise-gold focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1" style={{ maxHeight: 420 }}>
            {filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-mise-ink/40">
                {search ? 'No dishes match your search.' : 'All dishes are already on this menu.'}
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-5 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-mise-ink/40">{byCategory[cat]?.length}</span>
                      {collapsedCats.has(cat)
                        ? <ChevronRight className="h-3.5 w-3.5 text-mise-ink/40" />
                        : <ChevronDown className="h-3.5 w-3.5 text-mise-ink/40" />}
                    </div>
                  </button>
                  {!collapsedCats.has(cat) && byCategory[cat]?.map(r => {
                    const gp = gpPct(r)
                    return (
                      <button
                        key={r.id}
                        onClick={() => addToMenu(r.id)}
                        className="w-full flex items-center justify-between px-5 py-3 text-left border-b border-gray-50 hover:bg-green-50 hover:border-green-100 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium text-mise-ink group-hover:text-green-800">{r.name}</p>
                          {r.sell_price && (
                            <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(r.sell_price)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {gp != null && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gp >= 65 ? 'bg-green-100 text-green-700' : gp >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                              {gp.toFixed(0)}% GP
                            </span>
                          )}
                          <span className="text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">+ Add</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: menu order */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">On this menu</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {menuOrder.length === 0 ? 'No dishes added yet' : `${menuOrder.length} dish${menuOrder.length === 1 ? '' : 'es'} — drag to reorder`}
            </p>
          </div>

          <div className="overflow-y-auto flex-1" style={{ maxHeight: 420 }}>
            {menuOrder.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-5">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <GripVertical className="h-5 w-5 text-mise-ink/40" />
                </div>
                <p className="text-sm text-mise-ink/40">Click dishes on the left to add them here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {menuRecipes.map((r, index) => {
                  const gp = gpPct(r)
                  return (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={() => onDragStart(index)}
                      onDragOver={e => onDragOver(e, index)}
                      onDrop={onDrop}
                      className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing active:bg-green-50 active:shadow-sm"
                    >
                      <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-mise-ink truncate">{r.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.category ?? 'Uncategorised'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.sell_price && <span className="text-xs text-mise-ink/50">{formatCurrency(r.sell_price)}</span>}
                        {gp != null && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${gp >= 65 ? 'bg-green-100 text-green-700' : gp >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                            {gp.toFixed(0)}%
                          </span>
                        )}
                        <button
                          onClick={() => removeFromMenu(r.id)}
                          className="h-6 w-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GP Summary */}
      {menuRecipes.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-green-700" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Menu GP summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-xs text-mise-ink/50">Dishes</p>
              <p className="text-2xl font-display font-semibold text-mise-ink">{menuRecipes.length}</p>
            </div>
            <div>
              <p className="text-xs text-mise-ink/50">Avg GP%</p>
              <p className={`text-2xl font-bold ${avgGp == null ? 'text-gray-300' : avgGp >= 65 ? 'text-green-700' : avgGp >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                {avgGp != null ? `${avgGp.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-mise-ink/50">Total food cost</p>
              <p className="text-2xl font-display font-semibold text-mise-ink">{formatCurrency(totalMenuCost)}</p>
            </div>
            <div>
              <p className="text-xs text-mise-ink/50">Total menu revenue</p>
              <p className="text-2xl font-display font-semibold text-mise-ink">{formatCurrency(totalMenuRevenue)}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Dish</th>
                <th className="text-right pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Cost</th>
                <th className="text-right pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Sell</th>
                <th className="text-right pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">GP%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {menuRecipes.map(r => {
                const cost = foodCost(r)
                const gp = gpPct(r)
                return (
                  <tr key={r.id}>
                    <td className="py-2 text-gray-900">{r.name}</td>
                    <td className="py-2 text-right text-mise-ink/50">{formatCurrency(cost)}</td>
                    <td className="py-2 text-right text-mise-ink/50">{r.sell_price ? formatCurrency(r.sell_price) : '—'}</td>
                    <td className={`py-2 text-right font-medium ${gp == null ? 'text-gray-300' : gp >= 65 ? 'text-green-700' : gp >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                      {gp != null ? `${gp.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {avgGp != null && avgGp < 60 && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Average GP is below 60%. Consider reviewing dish pricing or ingredient costs before publishing.</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={handlePublishToggle}
          disabled={publishing}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            published
              ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : published ? <Globe className="h-4 w-4" /> : <GlobeLock className="h-4 w-4" />}
          {published ? 'Published — click to unpublish' : 'Publish to customer menu'}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save menu'}
        </button>
      </div>
    </div>
  )
}
