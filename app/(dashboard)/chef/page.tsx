import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { Package, BookOpen, Plus, Upload, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { SeedButton } from '@/components/SeedButton'
import { AllergenAlertBanner } from '@/components/AllergenAlertBanner'

export default async function ChefDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id, full_name').eq('id', user.id).single()
    : { data: null }

  const restaurantId = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value ?? null

  const [ingredientsRes, recipesRes, alertsRes] = await Promise.all([
    supabase.from('ingredients').select('id', { count: 'exact' }).eq('restaurant_id', restaurantId ?? ''),
    supabase.from('recipes').select('id, name, status, updated_at')
      .eq('restaurant_id', restaurantId ?? '')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase.from('allergen_alerts')
      .select('id, ingredient_name, changed_allergens, created_at')
      .eq('restaurant_id', restaurantId ?? '')
      .eq('dismissed', false)
      .order('created_at', { ascending: false }),
  ])

  const ingredientCount = ingredientsRes.count ?? 0
  const recentRecipes = recipesRes.data ?? []
  const allergenAlerts = alertsRes.data ?? []
  const isNewUser = ingredientCount === 0 && recentRecipes.length === 0

  const checklist = [
    {
      done: true,
      label: 'Restaurant set up',
      sublabel: 'Your restaurant is configured and ready.',
      href: null,
    },
    {
      done: ingredientCount > 0,
      label: 'Add your ingredients',
      sublabel: ingredientCount > 0
        ? `${ingredientCount} ingredient${ingredientCount !== 1 ? 's' : ''} in your library.`
        : 'Upload a costing sheet or add ingredients manually.',
      href: ingredientCount > 0 ? '/chef/ingredients' : '/chef/ingredients/upload',
      cta: ingredientCount > 0 ? 'View library' : 'Upload costing sheet',
    },
    {
      done: recentRecipes.length > 0,
      label: 'Build your first recipe',
      sublabel: recentRecipes.length > 0
        ? `${recentRecipes.length} recipe${recentRecipes.length !== 1 ? 's' : ''} created.`
        : 'Add ingredients to a recipe and see food cost and GP in real time.',
      href: recentRecipes.length > 0 ? '/chef/recipes' : '/chef/recipes/new',
      cta: recentRecipes.length > 0 ? 'View recipes' : 'Add first recipe',
    },
  ]

  const completedSteps = checklist.filter((c) => c.done).length

  return (
    <div className="space-y-6">
      {allergenAlerts.length > 0 && <AllergenAlertBanner alerts={allergenAlerts} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNewUser ? 'Welcome to mise' : `Good day, ${firstName}`}
        </h1>
        <p className="text-gray-500 mt-1">
          {isNewUser ? 'Let\'s get your kitchen set up.' : 'Here\'s what\'s happening in the kitchen.'}
        </p>
      </div>

      {/* Getting started checklist */}
      {completedSteps < checklist.length && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Getting started</h2>
            <span className="text-sm text-gray-400">{completedSteps} of {checklist.length} done</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(completedSteps / checklist.length) * 100}%` }}
            />
          </div>
          <div className="space-y-4">
            {checklist.map((item) => (
              <div key={item.label} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${item.done ? 'bg-green-50/50' : 'bg-gray-50'}`}>
                {item.done
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  : <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
                </div>
                {!item.done && item.href && (
                  <Link href={item.href}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 transition-colors">
                    {item.cta} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <SeedButton hasData={!isNewUser} />
          </div>
        </Card>
      )}

      {/* Stats */}
      {!isNewUser && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ingredients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{ingredientCount}</p>
              </div>
              <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-brand-600" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Link href="/chef/ingredients/new"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                <Plus className="h-4 w-4" /> Add
              </Link>
              <Link href="/chef/ingredients/upload"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                <Upload className="h-4 w-4" /> Upload
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recipes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{recentRecipes.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Link href="/chef/recipes/new"
              className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">
              <Plus className="h-4 w-4" /> Add recipe
            </Link>
          </Card>
        </div>
      )}

      {/* Recent recipes */}
      {recentRecipes.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent recipes</h2>
          <div className="divide-y divide-gray-100">
            {recentRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{recipe.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Updated {new Date(recipe.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <Badge variant={recipe.status === 'approved' ? 'green' : recipe.status === 'rejected' ? 'red' : 'yellow'}>
                  {recipe.status}
                </Badge>
              </div>
            ))}
          </div>
          <Link href="/chef/recipes"
            className="inline-block mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">
            View all recipes →
          </Link>
        </Card>
      )}
    </div>
  )
}
