'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Globe, GlobeLock, Plus, X, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

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
  isPublished: boolean
  allRecipes: Recipe[]
  initialSelectedIds: string[]
  menuUrl: string | null
}

export function MenuEditor({
  menuId, menuName, menuDescription, menuDaypart, isPublished,
  allRecipes, initialSelectedIds, menuUrl,
}: Props) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [name, setName] = useState(menuName)
  const [description, setDescription] = useState(menuDescription ?? '')
  const [daypart, setDaypart] = useState(menuDaypart)
  const [published, setPublished] = useState(isPublished)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const byCategory = allRecipes.reduce<Record<string, Recipe[]>>((acc, r) => {
    const cat = r.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  const selectedRecipes = allRecipes.filter(r => selectedIds.has(r.id))

  // GP summary
  const recipesWithPrice = selectedRecipes.filter(r => r.sell_price)
  const avgGp = recipesWithPrice.length
    ? recipesWithPrice.reduce((sum, r) => sum + (gpPct(r) ?? 0), 0) / recipesWithPrice.length
    : null
  const totalMenuRevenue = selectedRecipes.reduce((s, r) => s + (r.sell_price ?? 0), 0)
  const totalMenuCost = selectedRecipes.reduce((s, r) => s + foodCost(r), 0)

  function toggle(id: string) {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    setSaved(false)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Menu name is required'); return }
    setSaving(true)
    setError('')

    await supabase.from('menus').update({
      name: name.trim(),
      description: description.trim() || null,
      daypart,
      updated_at: new Date().toISOString(),
    }).eq('id', menuId)

    // Replace all menu_recipes
    await supabase.from('menu_recipes').delete().eq('menu_id', menuId)
    if (selectedIds.size > 0) {
      await supabase.from('menu_recipes').insert(
        Array.from(selectedIds).map(recipe_id => ({ menu_id: menuId, recipe_id }))
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
    // Fire email notification when publishing (not unpublishing)
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

  const filtered = search.trim()
    ? allRecipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div className="space-y-5">
      {/* Menu details */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Menu details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input value={name} onChange={e => { setName(e.target.value); setSaved(false) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
            <select value={daypart} onChange={e => { setDaypart(e.target.value); setSaved(false) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
              {DAYPARTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <input value={description} onChange={e => { setDescription(e.target.value); setSaved(false) }}
            placeholder="Optional — shown on the customer menu"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        </div>
      </div>

      {/* GP Summary */}
      {selectedRecipes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-green-700" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Menu GP summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-xs text-gray-500">Dishes</p>
              <p className="text-2xl font-bold text-gray-900">{selectedRecipes.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg GP%</p>
              <p className={`text-2xl font-bold ${avgGp == null ? 'text-gray-300' : avgGp >= 65 ? 'text-green-700' : avgGp >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                {avgGp != null ? `${avgGp.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total food cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMenuCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total menu revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMenuRevenue)}</p>
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
              {selectedRecipes.map(r => {
                const cost = foodCost(r)
                const gp = gpPct(r)
                return (
                  <tr key={r.id}>
                    <td className="py-2 text-gray-900">{r.name}</td>
                    <td className="py-2 text-right text-gray-500">{formatCurrency(cost)}</td>
                    <td className="py-2 text-right text-gray-500">{r.sell_price ? formatCurrency(r.sell_price) : '—'}</td>
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

      {/* Recipe picker */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dishes on this menu</h2>
          <p className="text-xs text-gray-400 mt-0.5">{selectedIds.size} selected — only approved recipes are shown</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {(filtered ?? allRecipes).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No approved recipes yet.{' '}
              <a href="/chef/recipes" className="text-green-700 underline">Add recipes first →</a>
            </div>
          ) : (
            Object.entries(
              (filtered ?? allRecipes).reduce<Record<string, Recipe[]>>((acc, r) => {
                const cat = r.category ?? 'Other'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(r)
                return acc
              }, {})
            ).map(([cat, recipes]) => (
              <div key={cat}>
                <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">{cat}</p>
                {recipes.map(r => {
                  const on = selectedIds.has(r.id)
                  const gp = gpPct(r)
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggle(r.id)}
                      className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors ${on ? 'bg-green-50/40' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${on ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                          {on && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {r.sell_price && <span>{formatCurrency(r.sell_price)}</span>}
                        {gp != null && (
                          <span className={`font-medium ${gp >= 65 ? 'text-green-700' : gp >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                            {gp.toFixed(0)}% GP
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

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
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
