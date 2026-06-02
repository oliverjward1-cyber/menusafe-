import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { DishCard } from './DishCard'
import { MenuTabs } from './MenuTabs'
import type { Metadata } from 'next'
import { UtensilsCrossed } from 'lucide-react'

type AllergenKey = (typeof ALLERGENS)[number]['key']

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

  // Get all published menus for this restaurant
  const { data: publishedMenus } = await supabase
    .from('menus')
    .select('id, name, description, daypart')
    .eq('restaurant_id', restaurant.id)
    .eq('is_published', true)
    .order('created_at')

  // For each menu, get its recipes with ingredients
  const menusWithDishes = await Promise.all(
    (publishedMenus ?? []).map(async (menu) => {
      const { data: menuRecipes } = await supabase
        .from('menu_recipes')
        .select(`
          recipes (
            id, name, description, category, sell_price, kcal_per_portion,
            recipe_ingredients (
              ingredients (
                name, kcal_per_100g, allergen_celery, allergen_cereals_gluten,
                allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin,
                allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts,
                allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites
              )
            )
          )
        `)
        .eq('menu_id', menu.id)

      const recipes = (menuRecipes ?? [])
        .map(mr => (mr.recipes as any))
        .filter(Boolean)

      return { ...menu, recipes }
    })
  )

  // Fallback: if no published menus exist, show approved active recipes directly
  const { data: fallbackRecipes } = publishedMenus?.length === 0
    ? await supabase
        .from('recipes')
        .select(`
          id, name, description, category, sell_price,
          recipe_ingredients (
            ingredients (
              name, allergen_celery, allergen_cereals_gluten, allergen_crustaceans,
              allergen_eggs, allergen_fish, allergen_lupin, allergen_milk,
              allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts,
              allergen_sesame, allergen_soya, allergen_sulphites
            )
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('category')
    : { data: null }

  function getDishAllergens(recipe: any): AllergenKey[] {
    return ALLERGENS
      .filter(a => recipe.recipe_ingredients?.some((ri: any) => ri.ingredients?.[a.key]))
      .map(a => a.key)
  }

  function getIngredients(recipe: any) {
    return (recipe.recipe_ingredients ?? []).map((ri: any) => {
      const ing = ri.ingredients
      if (!ing) return null
      return {
        name: ing.name as string,
        allergens: ALLERGENS.filter(a => ing[a.key]).map(a => a.key as AllergenKey),
      }
    }).filter(Boolean) as { name: string; allergens: AllergenKey[] }[]
  }

  function groupByCategory(recipes: any[]) {
    const map: Record<string, any[]> = {}
    for (const r of recipes) {
      const cat = r.category ?? 'Menu'
      if (!map[cat]) map[cat] = []
      map[cat].push(r)
    }
    return map
  }

  const hasMenus = menusWithDishes.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <UtensilsCrossed className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">MenuSafe</span>
          </div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Tap any dish to see full ingredients and allergen information
          </p>
        </div>
      </div>

      {hasMenus ? (
        // Multiple published menus — show tabs
        <MenuTabs menus={menusWithDishes.map(menu => ({
          id: menu.id,
          name: menu.name,
          description: menu.description,
          daypart: menu.daypart,
          categories: Object.entries(groupByCategory(menu.recipes)).map(([cat, dishes]) => ({
            name: cat,
            dishes: dishes.map(dish => ({
              id: dish.id,
              name: dish.name,
              description: dish.description,
              sellPrice: dish.sell_price,
              dishAllergens: getDishAllergens(dish),
              ingredients: getIngredients(dish),
            })),
          })),
        }))} />
      ) : fallbackRecipes ? (
        // No menus configured — show all approved recipes
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
          {fallbackRecipes.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No menu items available yet.</p>
            </div>
          ) : (
            Object.entries(groupByCategory(fallbackRecipes)).map(([category, dishes]) => (
              <section key={category}>
                <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200 mb-4">{category}</h2>
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
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No menu available right now.</p>
        </div>
      )}

      {/* Allergen notice */}
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Important allergen information</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Allergen information is provided by the restaurant and is for guidance only.
              Dishes may be prepared in a kitchen where allergens are present and cross-contamination is possible.
              <strong> Always inform a member of staff of any allergy or dietary requirement before ordering.</strong>
              {' '}Do not rely solely on this menu if you have a severe allergy.
            </p>
          </div>
        </div>
      </div>

      {/* Footer allergen key */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-gray-700 mb-3">Allergen key (UK Food Information Regulations 2014)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {ALLERGENS.map((a) => (
              <div key={a.key} className="flex items-center gap-2 text-xs text-gray-600">
                <AllergenBadge allergenKey={a.key} size="sm" />
                <span>{a.shortLabel}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            This allergen information is provided by {restaurant.name} in good faith. MenuSafe is a
            management tool — the accuracy of allergen data is the sole responsibility of the
            restaurant operator. Always speak to staff before ordering if you have an allergy.
          </p>
          <p className="text-xs text-gray-300 mt-2">
            <a href="/terms" className="underline hover:text-gray-500">MenuSafe Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  )
}
