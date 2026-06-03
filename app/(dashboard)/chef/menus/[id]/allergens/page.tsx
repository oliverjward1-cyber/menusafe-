import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ALLERGENS } from '@/lib/constants/allergens'
import { ChevronLeft } from 'lucide-react'
import { PrintButton } from './PrintButton'

interface Props { params: { id: string } }

export default async function AllergenMatrixPage({ params }: Props) {
  const supabase = createClient()

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
    .sort((a: any, b: any) => (a.category ?? '').localeCompare(b.category ?? ''))

  function hasAllergen(recipe: any, key: string): boolean {
    const fromIngredients = recipe.recipe_ingredients?.some((ri: any) => ri.ingredients?.[key]) ?? false
    if (fromIngredients) return true
    // Fall back to declared_allergens when no ingredients are linked yet
    const hasIngredients = (recipe.recipe_ingredients?.length ?? 0) > 0
    if (!hasIngredients && recipe.declared_allergens?.length > 0) {
      return recipe.declared_allergens.includes(key)
    }
    return false
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/chef/menus/${params.id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">Allergen matrix — {menu.name}</h1>
        </div>
        <PrintButton />
      </div>

      {/* Printable matrix */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        <div className="px-5 py-4 border-b border-gray-200 print:border-gray-300">
          <h2 className="text-base font-bold text-gray-900">{menu.name} — Allergen Information Matrix</h2>
          <p className="text-xs text-mise-ink/50 mt-0.5">
            UK Food Information Regulations 2014 — 14 Major Allergens · Printed {today}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 text-xs font-semibold text-gray-700 border-b border-r border-gray-200 min-w-[160px]">
                  Dish
                </th>
                {ALLERGENS.map(a => (
                  <th key={a.key} className="px-2 py-3 text-center border-b border-gray-200 min-w-[52px]">
                    <span className="font-semibold text-gray-700 leading-tight text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', height: '80px', whiteSpace: 'nowrap' }}>
                      {a.shortLabel}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipes.length === 0 ? (
                <tr>
                  <td colSpan={ALLERGENS.length + 1} className="px-4 py-8 text-center text-mise-ink/40">
                    No dishes on this menu yet.
                  </td>
                </tr>
              ) : (
                recipes.map((recipe: any) => (
                  <tr key={recipe.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-gray-900 border-r border-gray-100">
                      <div>{recipe.name}</div>
                      {recipe.category && <div className="text-gray-400 font-normal">{recipe.category}</div>}
                    </td>
                    {ALLERGENS.map(a => {
                      const present = hasAllergen(recipe, a.key)
                      return (
                        <td key={a.key} className="px-2 py-3 text-center">
                          {present ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 mx-auto">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 print:bg-white">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> This matrix is provided for information purposes. Allergen information is based on
            declared ingredients. Cross-contamination may occur during preparation. Always inform staff of allergies before ordering.
            This document should be reviewed and updated whenever recipes or ingredients change.
          </p>
        </div>
      </div>
    </div>
  )
}
