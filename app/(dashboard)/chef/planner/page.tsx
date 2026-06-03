'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ShoppingCart, ChefHat, Loader2, Minus, Plus, Printer } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  unit_type: string
  cost_per_unit: number
}

interface RecipeIngredient {
  quantity: number
  unit_type: string
  ingredients: Ingredient
}

interface Recipe {
  id: string
  name: string
  category: string | null
  recipe_ingredients: RecipeIngredient[]
}

interface MenuRecipe {
  recipe_id: string
  recipes: Recipe
}

interface Menu {
  id: string
  name: string
  daypart: string
  menu_recipes: MenuRecipe[]
}

// Convert recipe_ingredient quantity (stored in grams) to the ingredient's native unit
function toNativeUnit(grams: number, unitType: string): number {
  switch (unitType) {
    case 'kg': return grams / 1000
    case 'g': return grams
    case 'litre': return grams / 1000
    case 'ml': return grams
    default: return grams // 'each' — stored as count in quantity field
  }
}

// Smart display: show in kg if >= 1000g, otherwise grams; litre if >= 1000ml
function formatAmount(total: number, unitType: string): string {
  if (unitType === 'g' && total >= 1000) {
    return `${(total / 1000).toFixed(2)} kg`
  }
  if (unitType === 'ml' && total >= 1000) {
    return `${(total / 1000).toFixed(2)} L`
  }
  if (unitType === 'kg' || unitType === 'litre') {
    return `${total.toFixed(3)} ${unitType}`
  }
  if (unitType === 'each') {
    return `${Math.ceil(total)} each`
  }
  return `${total % 1 === 0 ? total : total.toFixed(1)} ${unitType}`
}

const DAYPART_LABELS: Record<string, string> = {
  'all-day': 'All day', lunch: 'Lunch', dinner: 'Dinner', brunch: 'Brunch', specials: 'Specials',
}

export default function PlannerPage() {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [portions, setPortions] = useState<Record<string, number>>({})
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles').select('restaurant_id').eq('id', user?.id ?? '').single()
      const rid = profile?.restaurant_id
        ?? document.cookie.split('; ').find((r) => r.startsWith('msafe_rid='))?.split('=')[1]
      if (!rid) { setLoading(false); return }

      const { data } = await supabase
        .from('menus')
        .select(`
          id, name, daypart,
          menu_recipes (
            recipe_id,
            recipes (
              id, name, category,
              recipe_ingredients (
                quantity, unit_type,
                ingredients ( id, name, unit_type, cost_per_unit )
              )
            )
          )
        `)
        .eq('restaurant_id', rid)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setMenus(data as unknown as Menu[])
        setActiveMenuId(data[0].id)
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  function setPortionCount(recipeId: string, count: number) {
    setPortions((prev) => ({ ...prev, [recipeId]: Math.max(0, count) }))
  }

  const activeMenu = menus.find((m) => m.id === activeMenuId)

  // Aggregate ingredients across all recipes with non-zero portions
  const shoppingList = useMemo(() => {
    if (!activeMenu) return []
    const totals = new Map<string, { name: string; unitType: string; totalNative: number; costPerUnit: number }>()

    for (const mr of activeMenu.menu_recipes) {
      const recipe = mr.recipes
      const count = portions[recipe.id] ?? 0
      if (count === 0) continue

      for (const ri of recipe.recipe_ingredients) {
        const ing = ri.ingredients
        // quantities are stored in grams, convert to native unit for display
        const nativeQtyPerPortion = toNativeUnit(ri.quantity, ing.unit_type)
        const existing = totals.get(ing.id)
        if (existing) {
          existing.totalNative += nativeQtyPerPortion * count
        } else {
          totals.set(ing.id, {
            name: ing.name,
            unitType: ing.unit_type,
            totalNative: nativeQtyPerPortion * count,
            costPerUnit: ing.cost_per_unit,
          })
        }
      }
    }

    return Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [activeMenu, portions])

  const totalCost = shoppingList.reduce((sum, item) => sum + item.totalNative * item.costPerUnit, 0)
  const totalPortions = activeMenu
    ? activeMenu.menu_recipes.reduce((sum, mr) => sum + (portions[mr.recipes.id] ?? 0), 0)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/chef" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Menu planner</h1>
      </div>

      {menus.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
          <ChefHat className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No menus yet</p>
          <p className="text-xs text-gray-400 mb-4">Create a menu and add recipes to start planning.</p>
          <Link href="/chef/menus/new"
            className="inline-flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Create your first menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: menu + portion inputs */}
          <div className="lg:col-span-3 space-y-4">
            {/* Menu tabs */}
            {menus.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {menus.map((menu) => (
                  <button key={menu.id}
                    onClick={() => { setActiveMenuId(menu.id); setPortions({}) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      menu.id === activeMenuId
                        ? 'bg-green-800 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {menu.name}
                  </button>
                ))}
              </div>
            )}

            {activeMenu && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    {activeMenu.name}
                    <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                      {DAYPART_LABELS[activeMenu.daypart] ?? activeMenu.daypart}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Enter how many portions of each dish you want to prepare.</p>
                </div>

                {activeMenu.menu_recipes.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-400">No recipes in this menu yet.</p>
                    <Link href={`/chef/menus/${activeMenu.id}`}
                      className="text-xs text-green-700 hover:underline mt-1 inline-block">Add recipes →</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {activeMenu.menu_recipes.map((mr) => {
                      const recipe = mr.recipes
                      const count = portions[recipe.id] ?? 0
                      return (
                        <div key={recipe.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{recipe.name}</p>
                            {recipe.category && (
                              <p className="text-xs text-gray-400">{recipe.category}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setPortionCount(recipe.id, count - 1)}
                              disabled={count === 0}
                              className="h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number" min="0" value={count === 0 ? '' : count}
                              placeholder="0"
                              onChange={(e) => setPortionCount(recipe.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center rounded-lg border border-gray-200 px-2 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-green-400"
                            />
                            <button
                              onClick={() => setPortionCount(recipe.id, count + 1)}
                              className="h-10 w-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-gray-400 hidden sm:inline">portions</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: shopping list */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-700" />
                  <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Shopping list</h2>
                </div>
                {shoppingList.length > 0 && (
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                )}
              </div>

              {totalPortions === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs text-gray-400">Set portion counts on the left to see your shopping list.</p>
                </div>
              ) : shoppingList.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs text-gray-400">No ingredient data found for these recipes.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                    {shoppingList.map((item) => (
                      <div key={item.name} className="px-5 py-2.5 flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-800 truncate">{item.name}</span>
                        <span className="text-sm font-medium text-gray-900 shrink-0 tabular-nums">
                          {formatAmount(item.totalNative, item.unitType)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{totalPortions} portions total · est. cost</span>
                    <span className="text-sm font-semibold text-gray-900">£{totalCost.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
