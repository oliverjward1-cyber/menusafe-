import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Package, BookOpen, Plus, Upload, ArrowRight, CheckCircle2, Circle,
  Sparkles, ChefHat, MenuSquare, Globe,
} from 'lucide-react'
import { SeedButton } from '@/components/SeedButton'
import { AllergenAlertBanner } from '@/components/AllergenAlertBanner'

export default async function ChefDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('restaurant_id, full_name').eq('id', user.id).single()
    : { data: null }

  const restaurantId = profile?.restaurant_id ?? cookies().get('msafe_rid')?.value ?? null

  const [ingredientsRes, recipesRes, alertsRes, menusRes] = await Promise.all([
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
    supabase.from('menus')
      .select('id, name, is_published, daypart')
      .eq('restaurant_id', restaurantId ?? '')
      .eq('is_published', true)
      .limit(3),
  ])

  const ingredientCount = ingredientsRes.count ?? 0
  const recentRecipes = recipesRes.data ?? []
  const allergenAlerts = alertsRes.data ?? []
  const publishedMenus = menusRes.data ?? []
  const isNewUser = ingredientCount === 0 && recentRecipes.length === 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Chef'

  const checklist = [
    {
      done: true,
      label: 'Restaurant set up',
      sublabel: 'Your restaurant is configured.',
      href: null,
      cta: null,
    },
    {
      done: ingredientCount > 0,
      label: 'Add your ingredients',
      sublabel: ingredientCount > 0
        ? `${ingredientCount} ingredient${ingredientCount !== 1 ? 's' : ''} in your library`
        : 'Upload a supplier invoice or add ingredients manually',
      href: ingredientCount > 0 ? '/chef/ingredients' : '/chef/ingredients/upload',
      cta: ingredientCount > 0 ? 'View library' : 'Upload invoice',
    },
    {
      done: recentRecipes.length > 0,
      label: 'Build your first recipe',
      sublabel: recentRecipes.length > 0
        ? `${recentRecipes.length} recipe${recentRecipes.length !== 1 ? 's' : ''} created`
        : 'Combine ingredients and see food cost and GP in real time',
      href: recentRecipes.length > 0 ? '/chef/recipes' : '/chef/recipes/new',
      cta: recentRecipes.length > 0 ? 'View recipes' : 'Create recipe',
    },
  ]

  const completedSteps = checklist.filter(c => c.done).length

  const DAYPART_LABELS: Record<string, string> = {
    'all-day': 'All day', 'lunch': 'Lunch', 'dinner': 'Dinner',
    'brunch': 'Brunch', 'specials': 'Specials',
  }

  return (
    <div className="space-y-6">
      {allergenAlerts.length > 0 && <AllergenAlertBanner alerts={allergenAlerts} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-mise-ink">
          {isNewUser ? 'Welcome to mise' : `Good day, ${firstName}`}
        </h1>
        <p className="text-sm text-mise-ink/50 mt-0.5">
          {isNewUser ? "Let's get your kitchen set up." : "Here's what's happening in your kitchen."}
        </p>
      </div>

      {/* Getting started checklist */}
      {completedSteps < checklist.length && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-mise-ink">Getting started</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{completedSteps} / {checklist.length}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(completedSteps / checklist.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.done ? 'bg-green-50/60' : 'bg-gray-50 border border-gray-100'}`}>
                {item.done
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  : <Circle className="h-5 w-5 text-gray-300 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
                </div>
                {!item.done && item.href && (
                  <Link href={item.href}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors">
                    {item.cta} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <SeedButton hasData={!isNewUser} />
          </div>
        </div>
      )}

      {/* Quick actions */}
      {!isNewUser && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/chef/ingredients/new"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-black/[0.06] hover:border-green-300 hover:bg-green-50/40 transition-colors group shadow-sm">
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Package className="h-5 w-5 text-green-700" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Add ingredient</span>
          </Link>
          <Link href="/chef/ingredients/scan"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-black/[0.06] hover:border-purple-300 hover:bg-purple-50/40 transition-colors group shadow-sm">
            <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Sparkles className="h-5 w-5 text-purple-700" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Scan invoice</span>
          </Link>
          <Link href="/chef/recipes/new"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-black/[0.06] hover:border-blue-300 hover:bg-blue-50/40 transition-colors group shadow-sm">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">New recipe</span>
          </Link>
          <Link href="/chef/menus/new"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-black/[0.06] hover:border-orange-300 hover:bg-orange-50/40 transition-colors group shadow-sm">
            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <MenuSquare className="h-5 w-5 text-orange-700" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">New menu</span>
          </Link>
        </div>
      )}

      {/* Stats row */}
      {!isNewUser && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
            <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Ingredients</p>
            <p className="text-3xl font-display font-semibold text-mise-ink mt-1">{ingredientCount}</p>
            <Link href="/chef/ingredients" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
              View library <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
            <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Recipes</p>
            <p className="text-3xl font-display font-semibold text-mise-ink mt-1">{recentRecipes.length}</p>
            <Link href="/chef/recipes" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Live menus</p>
            <p className={`text-3xl font-bold mt-1 ${publishedMenus.length > 0 ? 'text-green-700' : 'text-gray-300'}`}>
              {publishedMenus.length}
            </p>
            <Link href="/chef/menus" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
              Manage menus <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Published menus */}
      {publishedMenus.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-semibold text-mise-ink">Currently live</h2>
            </div>
            <Link href="/chef/menus" className="text-xs text-mise-mid hover:text-mise-deep font-medium">Manage →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {publishedMenus.map(menu => (
              <div key={menu.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-mise-ink">{menu.name}</p>
                <span className="text-xs text-mise-ink/40">{DAYPART_LABELS[menu.daypart] ?? menu.daypart}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent recipes */}
      {recentRecipes.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-mise-ink/40" />
              <h2 className="text-sm font-semibold text-mise-ink">Recent recipes</h2>
            </div>
            <Link href="/chef/recipes/new"
              className="inline-flex items-center gap-1 text-xs font-medium text-white bg-mise-gold hover:bg-yellow-600 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="h-3 w-3" /> Add
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRecipes.map(recipe => (
              <Link key={recipe.id} href={`/chef/recipes/${recipe.id}/edit`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-mise-ink">{recipe.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Updated {new Date(recipe.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  recipe.status === 'approved' ? 'bg-green-100 text-green-700' :
                  recipe.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-700'
                }`}>{recipe.status}</span>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/chef/recipes" className="text-xs font-medium text-mise-mid hover:text-mise-deep">
              View all recipes →
            </Link>
          </div>
        </div>
      )}

      {/* Empty state after checklist complete */}
      {!isNewUser && recentRecipes.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center shadow-sm">
          <ChefHat className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-mise-ink/50">No recipes yet</p>
          <p className="text-xs text-gray-400 mt-1">Build your first dish to start tracking food costs and GP</p>
          <Link href="/chef/recipes/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mise-mid hover:text-mise-deep mt-3">
            Create first recipe <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
