import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ALLERGENS } from '@/lib/constants/allergens'
import { ChevronLeft } from 'lucide-react'
import { PrintButton } from './PrintButton'

interface Props { params: { id: string } }

const CATEGORY_ORDER = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Snacks', 'Specials', 'Other']

export default async function AllergenMatrixPage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }

  const { data: restaurant } = profile?.restaurant_id
    ? await supabase.from('restaurants').select('name').eq('id', profile.restaurant_id).single()
    : { data: null }

  const { data: menu } = await supabase
    .from('menus')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!menu) notFound()

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select(`
      recipes (
        id, name, category, declared_allergens,
        recipe_ingredients (
          ingredients (
            allergen_celery, allergen_cereals_gluten, allergen_crustaceans,
            allergen_eggs, allergen_fish, allergen_lupin, allergen_milk,
            allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts,
            allergen_sesame, allergen_soya, allergen_sulphites
          )
        )
      )
    `)
    .eq('menu_id', params.id)

  const recipes = (menuRecipes ?? [])
    .map(mr => (mr.recipes as any))
    .filter(Boolean)

  function hasAllergen(recipe: any, key: string): boolean {
    const fromIngredients = recipe.recipe_ingredients?.some((ri: any) => ri.ingredients?.[key]) ?? false
    if (fromIngredients) return true
    const hasIngredients = (recipe.recipe_ingredients?.length ?? 0) > 0
    if (!hasIngredients && recipe.declared_allergens?.length > 0) {
      return recipe.declared_allergens.includes(key)
    }
    return false
  }

  // Group by category
  const grouped = recipes.reduce<Record<string, any[]>>((acc, r) => {
    const cat = r.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  const cats = CATEGORY_ORDER.filter(c => grouped[c]?.length)
    .concat(Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c) && grouped[c]?.length))

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const restaurantName = restaurant?.name ?? 'mise'

  return (
    <>
      {/* Screen toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/chef/menus/${params.id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">Allergen matrix — {menu.name}</h1>
        </div>
        <PrintButton />
      </div>

      {/* Printable document */}
      <div className="bg-white print:bg-white" id="allergen-print">

        {/* Branded header */}
        <div className="bg-mise-deep text-white px-8 py-6 print:px-6 print:py-5 rounded-t-2xl print:rounded-none">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-1">{restaurantName}</p>
              <h1 className="text-2xl font-display font-bold text-white leading-tight">{menu.name}</h1>
              <p className="text-sm text-white/70 mt-1">Allergen Information Matrix</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-white/50 uppercase tracking-wide">Printed</p>
              <p className="text-sm font-medium text-white/80">{today}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60">
              UK Food Information Regulations 2014 — 14 Major Allergens
            </p>
          </div>
        </div>

        {/* Legend row */}
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-2.5 print:px-6 flex items-center gap-6 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-amber-500 text-white font-bold text-xs">✓</span>
            <span>Allergen present</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded border border-gray-200 text-gray-300 text-xs">—</span>
            <span>Not detected</span>
          </div>
        </div>

        {/* Matrix table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-mise-deep/20">
                <th className="sticky left-0 bg-gray-50 text-left px-6 py-4 print:px-4 font-semibold text-gray-700 border-r border-gray-200 min-w-[180px] w-[180px]">
                  Dish
                </th>
                {ALLERGENS.map(a => (
                  <th key={a.key} className="px-1.5 py-3 text-center border-r border-gray-100 last:border-r-0 min-w-[44px] w-[44px]">
                    <span
                      className="font-semibold text-gray-600 leading-tight"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', height: '72px', whiteSpace: 'nowrap', fontSize: '10px' }}
                    >
                      {a.shortLabel}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recipes.length === 0 ? (
                <tr>
                  <td colSpan={ALLERGENS.length + 1} className="px-6 py-10 text-center text-gray-400">
                    No dishes on this menu yet.
                  </td>
                </tr>
              ) : cats.map(cat => (
                <>
                  {/* Category header row */}
                  <tr key={`${cat}-hdr`} className="bg-mise-deep/5 print:bg-gray-100">
                    <td
                      colSpan={ALLERGENS.length + 1}
                      className="px-6 py-2 print:px-4 text-xs font-bold text-mise-deep uppercase tracking-widest border-b border-mise-deep/10"
                    >
                      {cat}
                    </td>
                  </tr>
                  {/* Dish rows */}
                  {grouped[cat].map((recipe: any, i: number) => {
                    const allergenCells = ALLERGENS.map(a => hasAllergen(recipe, a.key))
                    const hasAny = allergenCells.some(Boolean)
                    return (
                      <tr
                        key={recipe.id}
                        className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} print:bg-transparent`}
                      >
                        <td className="sticky left-0 bg-inherit px-6 py-3 print:px-4 border-r border-gray-200">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{recipe.name}</p>
                          {!hasAny && (
                            <p className="text-gray-400 text-xs mt-0.5 font-normal">No major allergens</p>
                          )}
                        </td>
                        {allergenCells.map((present, idx) => (
                          <td key={idx} className="px-1 py-3 text-center border-r border-gray-100 last:border-r-0">
                            {present ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-amber-500 text-white font-bold text-xs mx-auto select-none">
                                ✓
                              </span>
                            ) : (
                              <span className="text-gray-200 select-none">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 print:px-6 bg-gray-50 border-t-2 border-gray-200 rounded-b-2xl print:rounded-none space-y-2">
          <p className="text-xs font-semibold text-gray-700">Important information</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            This matrix is based on declared ingredients and is provided for information purposes only.
            Cross-contamination with allergens may occur during preparation and cooking.
            Always inform a member of staff of any allergies or intolerances before ordering.
            This document should be reviewed and updated whenever recipes or ingredients change.
          </p>
          <p className="text-xs text-gray-400 pt-1">
            {restaurantName} · UK Food Information Regulations 2014 · Produced {today}
          </p>
        </div>

      </div>
    </>
  )
}
