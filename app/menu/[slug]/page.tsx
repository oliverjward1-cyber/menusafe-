import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'
import { UtensilsCrossed } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('slug', params.slug)
    .single()

  return {
    title: restaurant ? `${restaurant.name} — Menu` : 'Menu',
    description: 'View our menu with full allergen information.',
  }
}

export default async function PublicMenuPage({ params }: Props) {
  const supabase = createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) notFound()

  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id, name, description, category, sell_price,
      recipe_ingredients (
        ingredients ( allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites )
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('category')

  // Group by category
  const byCategory: Record<string, typeof recipes> = {}
  for (const recipe of recipes ?? []) {
    const cat = recipe.category ?? 'Menu'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat]!.push(recipe)
  }

  function getDishAllergens(recipe: NonNullable<typeof recipes>[number]) {
    return ALLERGENS.filter((a) =>
      recipe.recipe_ingredients?.some(
        (ri: any) => ri.ingredients?.[a.key]
      )
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="h-5 w-5 text-brand-400" />
            <span className="text-sm font-medium text-brand-400">MenuSafe</span>
          </div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Tap any dish to see full allergen information
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {Object.keys(byCategory).length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No menu items available yet.</p>
          </div>
        ) : (
          Object.entries(byCategory).map(([category, dishes]) => (
            <section key={category}>
              <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200 mb-4">
                {category}
              </h2>
              <div className="space-y-4">
                {dishes?.map((dish) => {
                  const dishAllergens = getDishAllergens(dish)
                  return (
                    <div
                      key={dish.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                          {dish.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{dish.description}</p>
                          )}
                        </div>
                        {dish.sell_price && (
                          <p className="font-semibold text-gray-900 shrink-0">
                            {formatCurrency(dish.sell_price)}
                          </p>
                        )}
                      </div>

                      {dishAllergens.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1.5">Contains:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dishAllergens.map((a) => (
                              <span
                                key={a.key}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200"
                                title={a.description}
                              >
                                {a.shortLabel}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-green-700 mt-2">No regulated allergens</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Footer allergen key */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-gray-700 mb-3">Allergen key (UK FIR 2014)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {ALLERGENS.map((a) => (
              <div key={a.key} className="flex items-center gap-2 text-xs text-gray-600">
                <AllergenBadge allergenKey={a.key} size="sm" />
                <span>{a.shortLabel}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Always inform staff of any allergies before ordering. Dishes may be prepared in an
            environment where allergens are present. This menu is for information only.
          </p>
        </div>
      </div>
    </div>
  )
}
