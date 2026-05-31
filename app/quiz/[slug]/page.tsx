import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuizClient from './QuizClient'
import { ALLERGENS } from '@/lib/constants/allergens'

interface Props {
  params: { slug: string }
}

export default async function StaffQuizPage({ params }: Props) {
  const supabase = createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', params.slug)
    .single()

  if (!restaurant) notFound()

  // Load approved dishes with allergens
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id, name,
      recipe_ingredients (
        ingredients ( allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites )
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'approved')
    .eq('is_active', true)

  if (!recipes || recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500 mt-2">No quiz questions available yet.</p>
        </div>
      </div>
    )
  }

  // Build questions from recipe data
  type Question = {
    question: string
    options: string[]
    correctIndex: number
  }

  const questions: Question[] = []

  for (const recipe of recipes) {
    const presentAllergens = ALLERGENS.filter((a) =>
      recipe.recipe_ingredients?.some(
        (ri: any) => ri.ingredients?.[a.key]
      )
    )

    if (presentAllergens.length === 0) continue

    // Question: which allergen is in this dish?
    const correct = presentAllergens[Math.floor(Math.random() * presentAllergens.length)]
    const wrongOptions = ALLERGENS.filter((a) => !presentAllergens.find((p) => p.key === a.key))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((a) => a.label)

    const allOptions = [correct.label, ...wrongOptions].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(correct.label)

    questions.push({
      question: `Which of the following allergens is present in "${recipe.name}"?`,
      options: allOptions,
      correctIndex,
    })
  }

  // Also add "which dish contains X" questions
  const allergenDishes: Record<string, string[]> = {}
  for (const recipe of recipes) {
    for (const allergen of ALLERGENS) {
      if (recipe.recipe_ingredients?.some((ri: any) => ri.ingredients?.[allergen.key])) {
        if (!allergenDishes[allergen.key]) allergenDishes[allergen.key] = []
        allergenDishes[allergen.key].push(recipe.name)
      }
    }
  }

  for (const [allergenKey, dishes] of Object.entries(allergenDishes)) {
    if (dishes.length === 0 || recipes.length < 4) continue
    const allergen = ALLERGENS.find((a) => a.key === allergenKey)
    if (!allergen) continue

    const correctDish = dishes[Math.floor(Math.random() * dishes.length)]
    const wrongDishes = recipes
      .map((r) => r.name)
      .filter((n) => !dishes.includes(n))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    if (wrongDishes.length < 3) continue

    const allOptions = [correctDish, ...wrongDishes].sort(() => Math.random() - 0.5)
    const correctIndex = allOptions.indexOf(correctDish)

    questions.push({
      question: `Which dish on our menu contains ${allergen.label.toLowerCase()}?`,
      options: allOptions,
      correctIndex,
    })
  }

  // Shuffle and limit to 10 questions
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 10)

  return (
    <QuizClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      questions={shuffled}
    />
  )
}
