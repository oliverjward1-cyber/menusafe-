import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent, calcGpPercent, calcSuggestedPrice } from '@/lib/utils'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import { Plus, BookOpen } from 'lucide-react'

export default async function RecipesPage() {
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
    .select('target_gp')
    .eq('id', profile?.restaurant_id ?? '')
    .single()

  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        quantity,
        ingredients ( cost_per_unit, unit_type, allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites )
      )
    `)
    .eq('restaurant_id', profile?.restaurant_id ?? '')
    .order('created_at', { ascending: false })

  const targetGp = restaurant?.target_gp ?? 70

  function calcFoodCost(recipe: NonNullable<typeof recipes>[number]): number {
    if (!recipe?.recipe_ingredients) return 0
    return recipe.recipe_ingredients.reduce((sum: number, ri: { quantity: number; ingredients: { cost_per_unit: number } | null }) => {
      if (!ri.ingredients) return sum
      return sum + ri.quantity * ri.ingredients.cost_per_unit
    }, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500 mt-1">Target GP: {targetGp}%</p>
        </div>
        <Link
          href="/chef/recipes/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add recipe
        </Link>
      </div>

      {!recipes || recipes.length === 0 ? (
        <Card className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No recipes yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Build your first recipe from your ingredients.
          </p>
          <Link
            href="/chef/recipes/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add recipe
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => {
            const foodCost = calcFoodCost(recipe)
            const sellPrice = recipe.sell_price ?? 0
            const gp = sellPrice > 0 ? calcGpPercent(foodCost, sellPrice) : null
            const suggested = calcSuggestedPrice(foodCost, targetGp)

            // Compute allergens present in this recipe
            const recipeAllergens = ALLERGENS.filter((a) =>
              recipe.recipe_ingredients?.some(
                (ri: any) => ri.ingredients?.[a.key]
              )
            )

            return (
              <Card key={recipe.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                      {recipe.category && (
                        <Badge variant="gray">{recipe.category}</Badge>
                      )}
                      <Badge
                        variant={
                          recipe.status === 'approved'
                            ? 'green'
                            : recipe.status === 'rejected'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {recipe.status}
                      </Badge>
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                    )}
                    {recipeAllergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipeAllergens.map((a) => (
                          <AllergenBadge key={a.key} allergenKey={a.key} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-6 text-right shrink-0">
                    <div>
                      <p className="text-xs text-gray-500">Food cost</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(foodCost)}</p>
                    </div>
                    {sellPrice > 0 && (
                      <div>
                        <p className="text-xs text-gray-500">GP</p>
                        <p
                          className={`font-semibold ${
                            gp !== null && gp >= targetGp ? 'text-green-700' : 'text-red-600'
                          }`}
                        >
                          {gp !== null ? formatPercent(gp) : '—'}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Suggested price</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(suggested)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
