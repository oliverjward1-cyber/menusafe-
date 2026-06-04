import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPercent, calcGpPercent } from '@/lib/utils'
import Link from 'next/link'
import {
  AlertTriangle, Globe, GlobeLock,
  Users, Clock, CheckCircle2, ArrowRight, MenuSquare, UserPlus,
} from 'lucide-react'
import { InviteChef } from './InviteChef'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export default async function OwnerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  const rid = profile?.restaurant_id ?? ''

  const [restaurantRes, recipesRes, menusRes, quizRes] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', rid).single(),
    supabase.from('recipes').select(`
      id, name, sell_price, status,
      recipe_ingredients ( quantity, ingredients ( cost_per_unit, unit_type ) )
    `).eq('restaurant_id', rid),
    supabase.from('menus').select('id, name, daypart, is_published, updated_at')
      .eq('restaurant_id', rid).order('updated_at', { ascending: false }),
    supabase.from('staff_quiz_attempts')
      .select('id, staff_name, score, total_questions, passed, completed_at')
      .eq('restaurant_id', rid).order('completed_at', { ascending: false }),
  ])

  const restaurant = restaurantRes.data
  const targetGp = restaurant?.target_gp ?? 70
  const allMenus = menusRes.data ?? []
  const publishedMenus = allMenus.filter(m => m.is_published)
  const allAttempts = quizRes.data ?? []

  // Get latest passing attempt per staff member
  const latestByStaff = new Map<string, typeof allAttempts[number]>()
  for (const a of allAttempts) {
    if (a.passed && !latestByStaff.has(a.staff_name)) {
      latestByStaff.set(a.staff_name, a)
    }
  }
  const trainedStaff = Array.from(latestByStaff.values())
  const now = new Date()
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const expiringStaff = trainedStaff.filter(s => {
    const expiry = addMonths(new Date(s.completed_at), 3)
    return expiry > now && expiry <= twoWeeksFromNow
  })
  const expiredStaff = trainedStaff.filter(s => {
    return addMonths(new Date(s.completed_at), 3) < now
  })

  function calcFoodCost(recipe: NonNullable<typeof recipesRes.data>[number]): number {
    if (!recipe?.recipe_ingredients) return 0
    return recipe.recipe_ingredients.reduce((sum: number, ri: any) => {
      if (!ri.ingredients) return sum
      const { cost_per_unit, unit_type } = ri.ingredients
      switch (unit_type) {
        case 'kg': return sum + (ri.quantity / 1000) * cost_per_unit
        case 'litre': return sum + (ri.quantity / 1000) * cost_per_unit
        case 'each': return sum + ri.quantity * cost_per_unit
        default: return sum + ri.quantity * cost_per_unit
      }
    }, 0)
  }

  const recipeStats = (recipesRes.data ?? []).map(r => {
    const foodCost = calcFoodCost(r)
    const sellPrice = r.sell_price ?? 0
    const gp = sellPrice > 0 ? calcGpPercent(foodCost, sellPrice) : null
    const belowTarget = gp !== null && gp < targetGp
    return { ...r, foodCost, gp, belowTarget }
  })

  const approved = recipeStats.filter(r => r.status === 'approved' && r.gp !== null)
  const avgGp = approved.length
    ? approved.reduce((s, r) => s + (r.gp ?? 0), 0) / approved.length
    : null
  const belowTargetCount = recipeStats.filter(r => r.belowTarget).length
  const pendingCount = recipeStats.filter(r => r.status === 'draft').length

  const DAYPART_LABELS: Record<string, string> = {
    'all-day': 'All day', 'lunch': 'Lunch', 'dinner': 'Dinner',
    'brunch': 'Brunch', 'specials': 'Specials',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-mise-ink">{restaurant?.name}</h1>
        <p className="text-sm text-mise-ink/50 mt-0.5">Owner dashboard · Target GP: {targetGp}%</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Total dishes</p>
          <p className="text-3xl font-display font-semibold text-mise-ink mt-1">{recipeStats.length}</p>
          <Link href="/chef/recipes" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Avg menu GP</p>
          <p className={`text-3xl font-bold mt-1 ${avgGp === null ? 'text-gray-400' : avgGp >= targetGp ? 'text-green-700' : 'text-red-600'}`}>
            {avgGp !== null ? formatPercent(avgGp) : '—'}
          </p>
          <p className="text-xs text-mise-ink/40 mt-2">Target: {targetGp}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Below target GP</p>
          <p className={`text-3xl font-bold mt-1 ${belowTargetCount > 0 ? 'text-red-600' : 'text-green-700'}`}>
            {belowTargetCount}
          </p>
          <p className="text-xs text-mise-ink/40 mt-2">{belowTargetCount === 0 ? 'All dishes on target' : `dish${belowTargetCount !== 1 ? 'es' : ''} need pricing review`}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <p className="text-xs font-sans font-semibold text-mise-ink/40 uppercase tracking-widest">Pending approval</p>
          <p className={`text-3xl font-bold mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {pendingCount}
          </p>
          <p className="text-xs text-mise-ink/40 mt-2">{pendingCount === 0 ? 'All up to date' : `recipe${pendingCount !== 1 ? 's' : ''} awaiting review`}</p>
        </div>
      </div>

      {/* Published menus + staff training row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Published menus */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MenuSquare className="h-4 w-4 text-green-700" />
              <h2 className="text-sm font-semibold text-mise-ink">Live menus</h2>
            </div>
            <Link href="/chef/menus" className="text-xs text-mise-mid hover:text-mise-deep font-medium">Manage →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {allMenus.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <GlobeLock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-mise-ink/40">No menus created yet</p>
                <Link href="/chef/menus/new" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
                  Create first menu <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              allMenus.slice(0, 5).map(menu => (
                <div key={menu.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    {menu.is_published
                      ? <Globe className="h-4 w-4 text-green-600 shrink-0" />
                      : <GlobeLock className="h-4 w-4 text-gray-300 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium text-mise-ink">{menu.name}</p>
                      <p className="text-xs text-mise-ink/40">{DAYPART_LABELS[menu.daypart] ?? menu.daypart}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${menu.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {menu.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
              ))
            )}
            {publishedMenus.length === 0 && allMenus.length > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No menus are currently published to customers
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Staff training */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-mise-ink">Staff training</h2>
            </div>
            <Link href="/owner/staff-quiz" className="text-xs text-mise-mid hover:text-mise-deep font-medium">View all →</Link>
          </div>

          {trainedStaff.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-mise-ink/40">No staff trained yet</p>
              <Link href="/owner/staff-quiz" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
                Set up staff quiz <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                <div className="px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{trainedStaff.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Trained</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className={`text-2xl font-bold ${expiringStaff.length > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                    {expiringStaff.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Expiring soon</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className={`text-2xl font-bold ${expiredStaff.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                    {expiredStaff.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Expired</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {expiringStaff.length > 0 && (
                  <div className="px-4 py-2 bg-amber-50">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Expiring within 2 weeks</p>
                  </div>
                )}
                {expiringStaff.map(s => {
                  const expiry = addMonths(new Date(s.completed_at), 3)
                  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5 bg-amber-50/50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <p className="text-sm font-medium text-mise-ink">{s.staff_name}</p>
                      </div>
                      <p className="text-xs text-amber-600 font-medium">{daysLeft}d left</p>
                    </div>
                  )
                })}
                {expiredStaff.length > 0 && (
                  <div className="px-4 py-2 bg-red-50">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Training expired</p>
                  </div>
                )}
                {expiredStaff.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 bg-red-50/40">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <p className="text-sm font-medium text-mise-ink">{s.staff_name}</p>
                    </div>
                    <p className="text-xs text-red-500 font-medium">Needs retraining</p>
                  </div>
                ))}
                {trainedStaff.filter(s => !expiringStaff.includes(s) && !expiredStaff.includes(s)).map(s => {
                  const expiry = addMonths(new Date(s.completed_at), 3)
                  return (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <p className="text-sm text-gray-700">{s.staff_name}</p>
                      </div>
                      <p className="text-xs text-mise-ink/40">Expires {expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite head chef */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-mise-mid" />
          <h2 className="text-base font-semibold text-mise-ink">Invite your head chef</h2>
        </div>
        <p className="text-sm text-mise-ink/50 mb-4">
          Your head chef gets their own login to manage recipes, ingredients, and kitchen audits.
        </p>
        <InviteChef />
      </div>

    </div>
  )
}
