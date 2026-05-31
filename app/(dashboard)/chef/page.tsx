import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { Package, BookOpen, Plus } from 'lucide-react'

export default async function ChefDashboard() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, full_name')
    .eq('id', user.id)
    .single()

  const [ingredientsRes, recipesRes] = await Promise.all([
    supabase
      .from('ingredients')
      .select('id', { count: 'exact' })
      .eq('restaurant_id', profile?.restaurant_id ?? ''),
    supabase
      .from('recipes')
      .select('id, name, status, updated_at')
      .eq('restaurant_id', profile?.restaurant_id ?? '')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const ingredientCount = ingredientsRes.count ?? 0
  const recentRecipes = recipesRes.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good day, {profile?.full_name?.split(' ')[0] ?? 'Chef'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening in the kitchen.</p>
      </div>

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
          <Link
            href="/chef/ingredients/new"
            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> Add ingredient
          </Link>
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
          <Link
            href="/chef/recipes/new"
            className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> Add recipe
          </Link>
        </Card>
      </div>

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
            ))}
          </div>
          <Link
            href="/chef/recipes"
            className="inline-block mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all recipes →
          </Link>
        </Card>
      )}
    </div>
  )
}
