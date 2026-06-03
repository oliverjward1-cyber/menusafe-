import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ALLERGENS } from '@/lib/constants/allergens'
import { Printer } from 'lucide-react'
import PrintButton from './PrintButton'

export default async function AllergenMatrixPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', profile?.restaurant_id ?? '')
    .single()

  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id, name, category, is_active,
      recipe_ingredients (
        ingredients ( allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites )
      )
    `)
    .eq('restaurant_id', profile?.restaurant_id ?? '')
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('category')

  function dishHasAllergen(recipe: NonNullable<typeof recipes>[number], key: string): boolean {
    return recipe?.recipe_ingredients?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ri: any) => ri.ingredients?.[key]
    ) ?? false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Allergen Matrix</h1>
          <p className="text-gray-500 mt-1">
            UK Food Information Regulations 2014 — approved dishes only
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Print header */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-bold">{restaurant?.name} — Allergen Information</h1>
        <p className="text-sm text-gray-600 mt-1">
          Allergen matrix prepared in accordance with the Food Information Regulations 2014 (UK FIR 2014).
          Contains the 14 regulated allergens. Printed: {new Date().toLocaleDateString('en-GB')}
        </p>
      </div>

      {!recipes || recipes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No approved dishes yet. Approve recipes from the dashboard first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left px-4 py-3 font-medium sticky left-0 bg-gray-800 min-w-[160px]">
                    Dish
                  </th>
                  {ALLERGENS.map((a) => (
                    <th
                      key={a.key}
                      className="px-2 py-3 font-medium text-center min-w-[70px]"
                      title={a.label}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{a.shortLabel}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe, i) => (
                  <tr
                    key={recipe.id}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className={`px-4 py-3 font-medium text-gray-900 sticky left-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-r border-gray-200`}>
                      <div>{recipe.name}</div>
                      {recipe.category && (
                        <div className="text-gray-400 font-normal">{recipe.category}</div>
                      )}
                    </td>
                    {ALLERGENS.map((a) => {
                      const present = dishHasAllergen(recipe, a.key)
                      return (
                        <td key={a.key} className="px-2 py-3 text-center border-r border-gray-100 last:border-r-0">
                          {present ? (
                            <span
                              title={`Contains ${a.label}`}
                              className="inline-flex items-center justify-center w-6 h-6 bg-amber-400 text-amber-900 rounded font-bold text-xs"
                            >
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 no-print">
        <strong>Important:</strong> This matrix is auto-generated from recipe data. Always verify allergen information
        and notify customers of potential cross-contamination risks. UK Food Information Regulations 2014 require
        allergen information to be available for all food sold pre-packed for direct sale and loose food.
      </div>

      <div className="print-only text-xs text-gray-500 mt-8 border-t pt-4">
        <p><strong>Key:</strong> ✓ = allergen present · — = not present</p>
        <p className="mt-1">
          This document is generated by mise. Always verify ingredient information with your suppliers.
          Cross-contamination risks may apply. ✱ Sulphites at concentrations of more than 10mg/kg or 10mg/L expressed as SO2.
        </p>
      </div>
    </div>
  )
}
