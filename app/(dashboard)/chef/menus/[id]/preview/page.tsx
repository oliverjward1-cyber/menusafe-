import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { DishCard } from '@/app/menu/[slug]/DishCard'
import { ChevronLeft, Eye } from 'lucide-react'
import PrintButton from './PrintButton'

type AllergenKey = (typeof ALLERGENS)[number]['key']
interface Props { params: { id: string } }

export default async function MenuPreviewPage({ params }: Props) {
  const supabase = createClient()

  const { data: menu } = await supabase
    .from('menus')
    .select('id, name, description, daypart, is_published')
    .eq('id', params.id)
    .single()

  if (!menu) notFound()

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select(`
      recipes (
        id, name, description, category, sell_price, may_contain_allergens,
        recipe_ingredients (
          quantity, unit_type,
          ingredients (
            name, kcal_per_100g, allergen_celery, allergen_cereals_gluten,
            allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin,
            allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts,
            allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites
          )
        )
      )
    `)
    .eq('menu_id', params.id)

  const recipes = (menuRecipes ?? []).map(mr => mr.recipes as any).filter(Boolean)

  const byCategory: Record<string, any[]> = {}
  for (const r of recipes) {
    const cat = r.category ?? 'Menu'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(r)
  }

  function getDishAllergens(recipe: any): AllergenKey[] {
    return ALLERGENS.filter(a => recipe.recipe_ingredients?.some((ri: any) => ri.ingredients?.[a.key])).map(a => a.key)
  }

  function getIngredients(recipe: any) {
    return (recipe.recipe_ingredients ?? []).map((ri: any) => {
      const ing = ri.ingredients
      if (!ing) return null
      const allergens = ALLERGENS.filter(a => ing[a.key]).map(a => a.key as AllergenKey)
      const kcal = ing.kcal_per_100g && ri.unit_type !== 'each'
        ? Math.round((ri.quantity / 100) * ing.kcal_per_100g)
        : null
      return { name: ing.name as string, allergens, kcal }
    }).filter(Boolean)
  }

  function getKcal(recipe: any): number | null {
    const total = (recipe.recipe_ingredients ?? []).reduce((sum: number, ri: any) => {
      const ing = ri.ingredients
      if (!ing?.kcal_per_100g || ri.unit_type === 'each') return sum
      return sum + (ri.quantity / 100) * ing.kcal_per_100g
    }, 0)
    return total > 0 ? Math.round(total) : null
  }

  return (
    <div className="space-y-4">
      {/* Preview banner */}
      <div className="print:hidden bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Preview mode</p>
            <p className="text-xs text-amber-700">This is exactly what customers will see. {!menu.is_published && 'This menu is not yet published.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Link href={`/chef/menus/${params.id}`}
            className="shrink-0 text-xs font-medium text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" /> Back to editor
          </Link>
        </div>
      </div>

      {/* Customer-facing view */}
      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-sm">
        <div className="bg-gray-900 text-white px-6 py-8">
          <h1 className="text-3xl font-bold">{menu.name}</h1>
          {menu.description && <p className="text-gray-400 mt-1 text-sm">{menu.description}</p>}
          <p className="text-gray-400 mt-1 text-sm">Tap any dish to see full ingredients and allergen information</p>
        </div>

        <div className="px-4 py-8 space-y-10">
          {Object.keys(byCategory).length === 0 ? (
            <div className="text-center py-10 text-hospopilot-ink/40">
              <p>No dishes on this menu yet.</p>
              <Link href={`/chef/menus/${params.id}`} className="mt-3 inline-flex items-center gap-1 text-sm text-hospopilot-mid hover:text-hospopilot-deep font-medium">
                <ChevronLeft className="h-4 w-4" /> Back to editor
              </Link>
            </div>
          ) : (
            Object.entries(byCategory).map(([cat, dishes]) => (
              <section key={cat}>
                <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200 mb-4">{cat}</h2>
                <div className="space-y-4">
                  {dishes.map((dish: any) => (
                    <DishCard
                      key={dish.id}
                      id={dish.id}
                      name={dish.name}
                      description={dish.description}
                      sellPrice={dish.sell_price}
                      dishAllergens={getDishAllergens(dish)}
                      ingredients={getIngredients(dish)}
                      kcalPerPortion={getKcal(dish)}
                      mayContain={(dish.may_contain_allergens ?? []) as AllergenKey[]}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="bg-amber-50 border-t border-amber-200 px-4 py-5">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              Always inform staff of any allergy or dietary requirement before ordering.
              <strong> Do not rely solely on this menu if you have a severe allergy.</strong>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-6">
          <p className="text-xs font-semibold text-gray-700 mb-3">Allergen key (UK Food Information Regulations 2014)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {ALLERGENS.map((a) => (
              <div key={a.key} className="flex items-center gap-2 text-xs text-gray-600">
                <AllergenBadge allergenKey={a.key} size="sm" />
                <span>{a.shortLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
