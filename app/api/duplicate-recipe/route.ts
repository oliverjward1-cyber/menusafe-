import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { recipeId } = await req.json()
  if (!recipeId) return NextResponse.json({ error: 'recipeId required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    : { data: null }
  const rid = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value
  if (!rid) return NextResponse.json({ error: 'No restaurant found' }, { status: 400 })

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(ingredient_id, quantity, unit_type)')
    .eq('id', recipeId)
    .single()

  if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

  // Insert copy
  const { data: newRecipe, error } = await supabase
    .from('recipes')
    .insert({
      restaurant_id: rid,
      name: `${recipe.name} (copy)`,
      description: recipe.description,
      category: recipe.category,
      portion_size: recipe.portion_size,
      sell_price: recipe.sell_price,
      status: 'draft',
      is_active: false,
      may_contain_allergens: recipe.may_contain_allergens ?? [],
    })
    .select('id')
    .single()

  if (error || !newRecipe) return NextResponse.json({ error: error?.message ?? 'Failed to duplicate' }, { status: 500 })

  if (recipe.recipe_ingredients?.length > 0) {
    await supabase.from('recipe_ingredients').insert(
      recipe.recipe_ingredients.map((ri: any) => ({
        recipe_id: newRecipe.id,
        ingredient_id: ri.ingredient_id,
        quantity: ri.quantity,
        unit_type: ri.unit_type,
      }))
    )
  }

  return NextResponse.json({ id: newRecipe.id })
}
