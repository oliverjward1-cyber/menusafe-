import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent, calcGpPercent, calcSuggestedPrice } from '@/lib/utils'
import { ALLERGENS } from '@/lib/constants/allergens'
import { AllergenBadge } from '@/components/allergen/AllergenBadge'
import ApproveRejectButtons from './ApproveRejectButtons'
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react'

export default async function OwnerDashboard() {
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
    .select('*')
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

  const recipeStats = (recipes ?? []).map((r) => {
    const foodCost = calcFoodCost(r)
    const sellPrice = r.sell_price ?? 0
    const gp = sellPrice > 0 ? calcGpPercent(foodCost, sellPrice) : null
    const belowTarget = gp !== null && gp < targetGp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipeAllergens = ALLERGENS.filter((a) =>
      r.recipe_ingredients?.some((ri: any) => ri.ingredients?.[a.key])
    )
    return { ...r, foodCost, gp, belowTarget, recipeAllergens }
  })

  const approved = recipeStats.filter((r) => r.status === 'approved' && r.gp !== null)
  const avgGp = approved.length
    ? approved.reduce((s, r) => s + (r.gp ?? 0), 0) / approved.length
    : null
  const belowTargetCount = recipeStats.filter((r) => r.belowTarget).length
  const pendingCount = recipeStats.filter((r) => r.status === 'draft').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
        <p className="text-gray-500 mt-1">Owner dashboard · Target GP: {targetGp}%</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-gray-500">Total dishes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{recipeStats.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Avg menu GP</p>
          <p className={`text-2xl font-bold mt-1 ${avgGp === null ? 'text-gray-400' : avgGp >= targetGp ? 'text-green-700' : 'text-red-600'}`}>
            {avgGp !== null ? formatPercent(avgGp) : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Below target GP</p>
          <p className={`text-2xl font-bold mt-1 ${belowTargetCount > 0 ? 'text-red-600' : 'text-green-700'}`}>
            {belowTargetCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Pending approval</p>
          <p className={`text-2xl font-bold mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {pendingCount}
          </p>
        </Card>
      </div>

      {/* Recipe list */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">All dishes</h2>
        </div>
        {recipeStats.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No recipes yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recipeStats.map((recipe) => (
              <div key={recipe.id} className="px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{recipe.name}</span>
                      {recipe.category && <Badge variant="gray">{recipe.category}</Badge>}
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
                      {recipe.belowTarget && (
                        <Badge variant="red">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Below GP target
                        </Badge>
                      )}
                    </div>
                    {recipe.recipeAllergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.recipeAllergens.map((a: (typeof ALLERGENS)[number]) => (
                          <AllergenBadge key={a.key} allergenKey={a.key} size="sm" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Updated {new Date(recipe.updated_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Food cost</p>
                      <p className="font-semibold text-sm">{formatCurrency(recipe.foodCost)}</p>
                    </div>
                    {recipe.sell_price && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Sell price</p>
                        <p className="font-semibold text-sm">{formatCurrency(recipe.sell_price)}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">GP</p>
                      <p
                        className={`font-bold text-sm flex items-center gap-1 ${
                          recipe.gp === null
                            ? 'text-gray-400'
                            : recipe.gp >= targetGp
                            ? 'text-green-700'
                            : 'text-red-600'
                        }`}
                      >
                        {recipe.gp !== null ? (
                          <>
                            {recipe.gp >= targetGp ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {formatPercent(recipe.gp)}
                          </>
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                    {recipe.status === 'draft' && (
                      <ApproveRejectButtons recipeId={recipe.id} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
