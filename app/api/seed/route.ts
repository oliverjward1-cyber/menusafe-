import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const INGREDIENTS = [
  { name: 'Chicken breast', cost_per_unit: 7.50, unit_type: 'kg', kcal_per_100g: 165 },
  { name: 'Salmon fillet', cost_per_unit: 12.00, unit_type: 'kg', kcal_per_100g: 208, allergen_fish: true },
  { name: 'Beef mince', cost_per_unit: 8.00, unit_type: 'kg', kcal_per_100g: 254 },
  { name: 'King prawns', cost_per_unit: 14.00, unit_type: 'kg', kcal_per_100g: 99, allergen_crustaceans: true },
  { name: 'Pasta (penne)', cost_per_unit: 1.20, unit_type: 'kg', kcal_per_100g: 371, allergen_cereals_gluten: true },
  { name: 'Burger bun', cost_per_unit: 0.35, unit_type: 'each', kcal_per_100g: 265, allergen_cereals_gluten: true },
  { name: 'Double cream', cost_per_unit: 2.50, unit_type: 'litre', kcal_per_100g: 345, allergen_milk: true },
  { name: 'Cheddar cheese', cost_per_unit: 8.00, unit_type: 'kg', kcal_per_100g: 402, allergen_milk: true },
  { name: 'Parmesan', cost_per_unit: 14.00, unit_type: 'kg', kcal_per_100g: 431, allergen_milk: true },
  { name: 'Butter', cost_per_unit: 6.00, unit_type: 'kg', kcal_per_100g: 717, allergen_milk: true },
  { name: 'Plain flour', cost_per_unit: 0.80, unit_type: 'kg', kcal_per_100g: 364, allergen_cereals_gluten: true },
  { name: 'Eggs (free range)', cost_per_unit: 0.30, unit_type: 'each', kcal_per_100g: 155, allergen_eggs: true },
  { name: 'Dark chocolate', cost_per_unit: 6.00, unit_type: 'kg', kcal_per_100g: 546, allergen_milk: true },
  { name: 'Caster sugar', cost_per_unit: 1.00, unit_type: 'kg', kcal_per_100g: 387 },
  { name: 'Raspberries', cost_per_unit: 8.00, unit_type: 'kg', kcal_per_100g: 52 },
  { name: 'Vanilla pod', cost_per_unit: 2.00, unit_type: 'each', kcal_per_100g: 288 },
  { name: 'Mushrooms', cost_per_unit: 3.00, unit_type: 'kg', kcal_per_100g: 22 },
  { name: 'Spinach', cost_per_unit: 2.50, unit_type: 'kg', kcal_per_100g: 23 },
  { name: 'Cherry tomatoes', cost_per_unit: 3.00, unit_type: 'kg', kcal_per_100g: 18 },
  { name: 'Gem lettuce', cost_per_unit: 1.20, unit_type: 'kg', kcal_per_100g: 15 },
  { name: 'Garlic', cost_per_unit: 4.00, unit_type: 'kg', kcal_per_100g: 149 },
  { name: 'Olive oil', cost_per_unit: 5.00, unit_type: 'litre', kcal_per_100g: 884 },
  { name: 'Lemon', cost_per_unit: 0.25, unit_type: 'each', kcal_per_100g: 29 },
  { name: 'New potatoes', cost_per_unit: 0.90, unit_type: 'kg', kcal_per_100g: 77 },
  { name: 'Sourdough bread', cost_per_unit: 2.50, unit_type: 'kg', kcal_per_100g: 274, allergen_cereals_gluten: true },
  { name: 'Mozzarella', cost_per_unit: 10.00, unit_type: 'kg', kcal_per_100g: 280, allergen_milk: true },
  { name: 'Bacon lardons', cost_per_unit: 4.50, unit_type: 'kg', kcal_per_100g: 337 },
  { name: 'Beef stock', cost_per_unit: 1.50, unit_type: 'litre', kcal_per_100g: 10 },
]

// Each recipe_ingredient: [ingredientName, quantityInGrams]
const RECIPES = [
  // STARTERS
  {
    name: 'Prawn Cocktail',
    category: 'Starters',
    description: 'Classic prawn cocktail with Marie Rose sauce on a bed of gem lettuce.',
    portion_size: '180g',
    sell_price: 8.50,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['King prawns', 120],
      ['Gem lettuce', 60],
      ['Cherry tomatoes', 40],
      ['Lemon', 30],
    ],
  },
  {
    name: 'Garlic Mushrooms on Toast',
    category: 'Starters',
    description: 'Wild mushrooms sautéed in garlic butter, served on toasted sourdough.',
    portion_size: '200g',
    sell_price: 7.50,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['Mushrooms', 160],
      ['Butter', 25],
      ['Garlic', 10],
      ['Sourdough bread', 80],
      ['Parmesan', 15],
    ],
  },
  {
    name: 'Bruschetta Trio',
    category: 'Starters',
    description: 'Three slices of toasted sourdough topped with cherry tomatoes, mozzarella and fresh basil.',
    portion_size: '220g',
    sell_price: 8.00,
    status: 'draft',
    is_active: true,
    ingredients: [
      ['Sourdough bread', 120],
      ['Cherry tomatoes', 100],
      ['Mozzarella', 60],
      ['Olive oil', 15],
      ['Garlic', 5],
    ],
  },
  // MAINS
  {
    name: 'Pan-Seared Salmon',
    category: 'Mains',
    description: 'Fresh salmon fillet with wilted spinach, new potatoes and a lemon butter sauce.',
    portion_size: '480g',
    sell_price: 18.00,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['Salmon fillet', 200],
      ['New potatoes', 180],
      ['Spinach', 80],
      ['Butter', 20],
      ['Lemon', 25],
    ],
  },
  {
    name: 'Chicken & Mushroom Pasta',
    category: 'Mains',
    description: 'Grilled chicken breast with penne pasta in a creamy mushroom and parmesan sauce.',
    portion_size: '460g',
    sell_price: 15.50,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['Chicken breast', 180],
      ['Pasta (penne)', 120],
      ['Mushrooms', 80],
      ['Double cream', 90],
      ['Parmesan', 25],
      ['Garlic', 8],
    ],
  },
  {
    name: 'Classic Beef Burger',
    category: 'Mains',
    description: '6oz beef patty with mature cheddar, gem lettuce and cherry tomatoes in a brioche bun.',
    portion_size: '420g',
    sell_price: 14.00,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['Beef mince', 180],
      ['Burger bun', 1],
      ['Cheddar cheese', 30],
      ['Gem lettuce', 40],
      ['Cherry tomatoes', 40],
    ],
  },
  // DESSERTS
  {
    name: 'Chocolate Fondant',
    category: 'Desserts',
    description: 'Warm dark chocolate fondant with a molten centre, served with vanilla ice cream.',
    portion_size: '180g',
    sell_price: 8.00,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['Dark chocolate', 80],
      ['Butter', 50],
      ['Caster sugar', 40],
      ['Eggs (free range)', 2],
      ['Plain flour', 20],
    ],
  },
  {
    name: 'Raspberry Eton Mess',
    category: 'Desserts',
    description: 'Crushed meringue with whipped double cream and fresh raspberries.',
    portion_size: '220g',
    sell_price: 7.00,
    status: 'approved',
    is_active: true,
    ingredients: [
      ['Raspberries', 100],
      ['Double cream', 110],
      ['Caster sugar', 20],
    ],
  },
  {
    name: 'Vanilla Crème Brûlée',
    category: 'Desserts',
    description: 'Classic French crème brûlée with a caramelised sugar crust and fresh raspberries.',
    portion_size: '200g',
    sell_price: 7.50,
    status: 'draft',
    is_active: true,
    ingredients: [
      ['Double cream', 150],
      ['Eggs (free range)', 3],
      ['Caster sugar', 35],
      ['Vanilla pod', 1],
      ['Raspberries', 30],
    ],
  },
]

function cpg(ing: typeof INGREDIENTS[number]): number {
  switch (ing.unit_type) {
    case 'kg': return ing.cost_per_unit / 1000
    case 'g': return ing.cost_per_unit
    case 'litre': return ing.cost_per_unit / 1000
    case 'ml': return ing.cost_per_unit / 1000
    case 'each': return ing.cost_per_unit
    default: return 0
  }
}

export async function POST(req: NextRequest) {
  const rid = cookies().get('msafe_rid')?.value
  if (!rid) return NextResponse.json({ error: 'No restaurant found. Complete onboarding first.' }, { status: 400 })

  const supabase = createClient()

  // Allow force reset via query param
  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === 'true'

  // Check for existing data
  const { count } = await supabase
    .from('ingredients').select('id', { count: 'exact', head: true }).eq('restaurant_id', rid)
  if ((count ?? 0) > 0 && !force) {
    return NextResponse.json({ error: 'Sample data already loaded.' }, { status: 409 })
  }

  // Wipe existing data if force reset
  if (force) {
    await supabase.from('recipe_ingredients').delete().in(
      'recipe_id',
      (await supabase.from('recipes').select('id').eq('restaurant_id', rid)).data?.map(r => r.id) ?? []
    )
    await supabase.from('recipes').delete().eq('restaurant_id', rid)
    await supabase.from('ingredients').delete().eq('restaurant_id', rid)
  }

  // Insert ingredients
  const allergenDefaults = {
    allergen_celery: false, allergen_cereals_gluten: false, allergen_crustaceans: false,
    allergen_eggs: false, allergen_fish: false, allergen_lupin: false, allergen_milk: false,
    allergen_molluscs: false, allergen_mustard: false, allergen_nuts: false,
    allergen_peanuts: false, allergen_sesame: false, allergen_soya: false, allergen_sulphites: false,
  }

  const { data: insertedIngs, error: ingErr } = await supabase
    .from('ingredients')
    .insert(INGREDIENTS.map((i) => ({
      restaurant_id: rid,
      name: i.name,
      cost_per_unit: i.cost_per_unit,
      unit_type: i.unit_type,
      kcal_per_100g: i.kcal_per_100g ?? null,
      ...allergenDefaults,
      ...(i.allergen_fish ? { allergen_fish: true } : {}),
      ...(i.allergen_milk ? { allergen_milk: true } : {}),
      ...(i.allergen_eggs ? { allergen_eggs: true } : {}),
      ...(i.allergen_crustaceans ? { allergen_crustaceans: true } : {}),
      ...(i.allergen_cereals_gluten ? { allergen_cereals_gluten: true } : {}),
    })))
    .select('id, name')

  if (ingErr || !insertedIngs) {
    return NextResponse.json({ error: ingErr?.message ?? 'Failed to insert ingredients' }, { status: 500 })
  }

  const ingMap = new Map(insertedIngs.map((i) => [i.name, i.id]))
  const ingDataMap = new Map(INGREDIENTS.map((i) => [i.name, i]))

  // Insert recipes + recipe_ingredients
  for (const recipe of RECIPES) {
    const { data: rec, error: recErr } = await supabase
      .from('recipes')
      .insert({
        restaurant_id: rid,
        name: recipe.name,
        category: recipe.category,
        description: recipe.description,
        portion_size: recipe.portion_size,
        sell_price: recipe.sell_price,
        status: recipe.status,
        is_active: recipe.is_active,
      })
      .select('id')
      .single()

    if (recErr || !rec) continue

    const riRows = recipe.ingredients
      .filter(([name]) => ingMap.has(name as string))
      .map(([name, qty]) => {
        const ingData = ingDataMap.get(name as string)!
        const isEach = ingData.unit_type === 'each'
        return {
          recipe_id: rec.id,
          ingredient_id: ingMap.get(name as string)!,
          quantity: isEach ? (qty as number) : (qty as number),
          unit_type: isEach ? 'each' : 'g',
        }
      })

    if (riRows.length > 0) {
      await supabase.from('recipe_ingredients').insert(riRows)
    }
  }

  return NextResponse.json({ ok: true, ingredients: insertedIngs.length, recipes: RECIPES.length })
}
