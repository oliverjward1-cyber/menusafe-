import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPercent, calcGpPercent } from '@/lib/utils'
import Link from 'next/link'
import {
  AlertTriangle, Globe, GlobeLock,
  Users, Clock, CheckCircle2, ArrowRight, MenuSquare, ClipboardCheck, ShieldCheck, AlertOctagon, Truck, ListChecks, History,
} from 'lucide-react'

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

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentHour = now.getHours()

  const [restaurantRes, recipesRes, menusRes, quizRes, auditRes, tempLogsToday, openIncidentsRes, todayTrailLogs] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', rid).single(),
    supabase.from('recipes').select(`
      id, name, sell_price, status,
      recipe_ingredients ( quantity, ingredients ( cost_per_unit, unit_type ) )
    `).eq('restaurant_id', rid),
    supabase.from('menus').select('id, name, daypart, is_published, updated_at')
      .eq('restaurant_id', rid).order('updated_at', { ascending: false }),
    supabase.from('staff_quiz_attempts')
      .select('id, staff_name, score, total_questions, passed, completed_at, quiz_type')
      .eq('restaurant_id', rid).order('completed_at', { ascending: false }),
    supabase.from('kitchen_audits')
      .select('id, score, total, status, completed_at, completed_by')
      .eq('restaurant_id', rid)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase.from('temperature_logs')
      .select('check_type')
      .eq('restaurant_id', rid)
      .gte('logged_at', `${todayStr}T00:00:00Z`),
    supabase.from('incidents')
      .select('id, severity')
      .eq('restaurant_id', rid)
      .eq('resolved', false),
    supabase.from('ops_task_logs')
      .select('id, title, task_type, status, scheduled_time, sort_order, data')
      .eq('restaurant_id', rid)
      .eq('scheduled_date', todayStr)
      .order('sort_order'),
  ])

  // Week dates (Mon–today)
  const weekDates: string[] = []
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
  weekStart.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    weekDates.push(d.toISOString().split('T')[0])
  }
  const weekStartStr = weekDates[0]

  const [weekTrailRes] = await Promise.all([
    supabase.from('ops_task_logs')
      .select('scheduled_date, status')
      .eq('restaurant_id', rid)
      .gte('scheduled_date', weekStartStr)
      .lte('scheduled_date', todayStr),
  ])

  const restaurant = restaurantRes.data
  const targetGp = restaurant?.target_gp ?? 70
  const lastAudit = auditRes.data
  const allMenus = menusRes.data ?? []
  const publishedMenus = allMenus.filter(m => m.is_published)
  const allAttempts = quizRes.data ?? []

  // Open incidents
  const openIncidents = openIncidentsRes.data ?? []
  const criticalIncidents = openIncidents.filter(i => i.severity === 'critical' || i.severity === 'high')

  // Temperature check alerts
  const todayTempLogs = tempLogsToday.data ?? []
  const hasAmCheck = todayTempLogs.some(l => l.check_type === 'am')
  const hasPmCheck = todayTempLogs.some(l => l.check_type === 'pm')
  const amOverdue = !hasAmCheck && currentHour >= 10
  const pmOverdue = !hasPmCheck && currentHour >= 18
  const tempAlerts: string[] = []
  if (amOverdue) tempAlerts.push('AM temperature check (due by 10:00)')
  if (pmOverdue) tempAlerts.push('PM temperature check (due by 18:00)')

  // Today's trail progress
  const allTrailTasks = todayTrailLogs.data ?? []
  const trailDone = allTrailTasks.filter(t => t.status === 'done' || t.status === 'flagged').length
  const trailFlagged = allTrailTasks.filter(t => t.status === 'flagged').length
  const trailTotal = allTrailTasks.length
  const trailPct = trailTotal > 0 ? Math.round((trailDone / trailTotal) * 100) : 0
  const nowTimeStr = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const pendingTrailTasks = allTrailTasks.filter(t => t.status === 'pending')
  const missedTasks = pendingTrailTasks.filter(t => t.scheduled_time && t.scheduled_time < nowTimeStr)
  const upcomingPending = pendingTrailTasks.filter(t => !t.scheduled_time || t.scheduled_time >= nowTimeStr)
  const nextTask = upcomingPending[0] ?? null

  // Today's delivery spend (from trail delivery tasks)
  const deliveryLogs = allTrailTasks.filter(t => t.task_type === 'delivery' && t.status === 'done')
  const todayDeliveries: { supplier: string; cost: number | null }[] = []
  for (const log of deliveryLogs) {
    for (const d of (log.data?.deliveries ?? [])) {
      if (d.supplier) todayDeliveries.push({ supplier: d.supplier, cost: d.cost ?? null })
    }
  }
  const todaySpend = todayDeliveries.reduce((sum, d) => sum + (d.cost ?? 0), 0)

  // Staff compliance helpers
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  function buildCompliance(attempts: typeof allAttempts) {
    type Record = { name: string; completedAt: Date; expiry: Date; status: 'valid' | 'expiring' | 'expired' }
    const map = new Map<string, Record>()
    for (const a of attempts) {
      if (!a.passed || map.has(a.staff_name)) continue
      const completedAt = new Date(a.completed_at)
      const expiry = addMonths(completedAt, 6)
      const status = expiry < now ? 'expired' : expiry <= thirtyDaysFromNow ? 'expiring' : 'valid'
      map.set(a.staff_name, { name: a.staff_name, completedAt, expiry, status })
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  const fohCompliance = buildCompliance(allAttempts.filter(a => a.quiz_type === 'front_of_house'))
  const bohCompliance = buildCompliance(allAttempts.filter(a => a.quiz_type === 'kitchen'))

  const lastFohQuiz = allAttempts.filter(a => a.quiz_type === 'front_of_house')[0] ?? null
  const lastBohQuiz = allAttempts.filter(a => a.quiz_type === 'kitchen')[0] ?? null

  // Weekly trail summary per day
  const weekTasksByDate = new Map<string, { done: number; total: number }>()
  for (const d of weekDates) weekTasksByDate.set(d, { done: 0, total: 0 })
  for (const t of weekTrailRes.data ?? []) {
    const entry = weekTasksByDate.get(t.scheduled_date)
    if (!entry) continue
    entry.total++
    if (t.status === 'done' || t.status === 'flagged') entry.done++
  }
  const weekDays = weekDates.map(d => {
    const { done, total } = weekTasksByDate.get(d)!
    const pct = total > 0 ? Math.round((done / total) * 100) : null
    const label = new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
    return { date: d, done, total, pct, label, isToday: d === todayStr, isFuture: d > todayStr }
  })
  const weekCompletedDays = weekDays.filter(d => !d.isFuture && d.pct === 100).length
  const weekTotalDaysSoFar = weekDays.filter(d => !d.isFuture && d.total > 0).length

  // Daily compliance score
  type ComplianceIssue = { label: string; severity: 'critical' | 'warning' }
  const complianceIssues: ComplianceIssue[] = []
  if (criticalIncidents.length > 0)
    complianceIssues.push({ label: `${criticalIncidents.length} critical incident${criticalIncidents.length !== 1 ? 's' : ''} unresolved`, severity: 'critical' })
  if (amOverdue) complianceIssues.push({ label: 'AM temperature check overdue', severity: 'critical' })
  if (pmOverdue) complianceIssues.push({ label: 'PM temperature check overdue', severity: 'critical' })
  if (trailTotal > 0 && missedTasks.length > 0)
    complianceIssues.push({ label: `${missedTasks.length} trail task${missedTasks.length !== 1 ? 's' : ''} past due time`, severity: 'warning' })
  if (expiredStaff.length > 0)
    complianceIssues.push({ label: `${expiredStaff.length} staff member${expiredStaff.length !== 1 ? 's' : ''} with expired training`, severity: 'warning' })
  if (openIncidents.filter(i => i.severity !== 'critical' && i.severity !== 'high').length > 0)
    complianceIssues.push({ label: `${openIncidents.length - criticalIncidents.length} open incident${openIncidents.length - criticalIncidents.length !== 1 ? 's' : ''} require resolution`, severity: 'warning' })
  const criticalCount = complianceIssues.filter(i => i.severity === 'critical').length
  const complianceScore = complianceIssues.length === 0 ? 100
    : Math.max(0, 100 - criticalCount * 25 - (complianceIssues.length - criticalCount) * 10)
  const complianceStatus = complianceScore === 100 ? 'compliant' : criticalCount > 0 ? 'critical' : 'needs-attention'

  // Legacy: combined for old code
  const trainedStaff = [...new Map([...fohCompliance, ...bohCompliance].map(s => [s.name, s])).values()]
  const expiringStaff = trainedStaff.filter(s => s.status === 'expiring')
  const expiredStaff = trainedStaff.filter(s => s.status === 'expired')

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

      {/* Daily Compliance Bar */}
      <div className={`rounded-2xl border p-5 ${
        complianceStatus === 'compliant' ? 'bg-green-50 border-green-200' :
        complianceStatus === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-4 w-4 ${complianceStatus === 'compliant' ? 'text-green-600' : complianceStatus === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
            <p className={`text-sm font-semibold ${complianceStatus === 'compliant' ? 'text-green-700' : complianceStatus === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
              {complianceStatus === 'compliant' ? 'Fully compliant today' : complianceStatus === 'critical' ? 'Compliance action required' : 'Areas need attention'}
            </p>
          </div>
          <span className={`text-lg font-bold ${complianceStatus === 'compliant' ? 'text-green-700' : complianceStatus === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
            {complianceScore}%
          </span>
        </div>
        <div className="h-2.5 bg-white/60 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${complianceStatus === 'compliant' ? 'bg-green-500' : complianceStatus === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        {complianceIssues.length > 0 ? (
          <ul className="space-y-1">
            {complianceIssues.map((issue, i) => (
              <li key={i} className={`flex items-center gap-2 text-xs font-medium ${issue.severity === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                {issue.severity === 'critical'
                  ? <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                  : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                {issue.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-green-600">All compliance checks passed — great work!</p>
        )}
      </div>

      {/* Weekly Trail Overview */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-mise-mid" />
            <h2 className="text-sm font-semibold text-mise-ink">This week&apos;s trail</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-mise-ink/40">
              {weekCompletedDays}/{weekTotalDaysSoFar} days fully complete
            </span>
            <Link href="/owner/trail-history" className="text-xs text-mise-mid hover:text-mise-deep font-medium">Full history →</Link>
          </div>
        </div>
        <div className="flex items-end gap-2">
          {weekDays.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full relative">
                {!day.isFuture && day.total > 0 ? (
                  <div className="relative h-16 flex flex-col justify-end">
                    <div className="w-full bg-gray-100 rounded-lg overflow-hidden h-full flex flex-col justify-end">
                      <div
                        className={`w-full rounded-lg transition-all ${day.pct === 100 ? 'bg-green-400' : (day.pct ?? 0) >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ height: `${Math.max(day.pct ?? 0, 8)}%` }}
                      />
                    </div>
                    <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap
                      ${day.pct === 100 ? 'text-green-600' : (day.pct ?? 0) >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {day.pct}%
                    </span>
                  </div>
                ) : (
                  <div className={`h-16 w-full rounded-lg ${day.isFuture ? 'bg-gray-50 border-2 border-dashed border-gray-200' : 'bg-gray-100'}`} />
                )}
              </div>
              <span className={`text-[11px] font-medium ${day.isToday ? 'text-mise-mid' : 'text-mise-ink/40'}`}>{day.label}</span>
              {day.isToday && <span className="w-1 h-1 rounded-full bg-mise-mid" />}
            </div>
          ))}
        </div>
      </div>

      {/* Open incidents alert */}
      {openIncidents.length > 0 && (
        <Link href="/owner/incidents" className="block">
          <div className={`border rounded-2xl px-5 py-4 flex items-start gap-3 hover:opacity-90 transition-opacity ${
            criticalIncidents.length > 0 ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'
          }`}>
            <AlertOctagon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${criticalIncidents.length > 0 ? 'text-red-600' : 'text-orange-500'}`} />
            <div>
              <p className={`text-sm font-semibold ${criticalIncidents.length > 0 ? 'text-red-700' : 'text-orange-700'}`}>
                {criticalIncidents.length > 0 ? 'Critical incident requires attention' : 'Open incidents require resolution'}
              </p>
              <p className={`text-sm mt-0.5 ${criticalIncidents.length > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                {openIncidents.length} open incident{openIncidents.length !== 1 ? 's' : ''} — tap to view
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Temperature check overdue alert */}
      {tempAlerts.length > 0 && (
        <Link href="/owner/temperature-logs" className="block">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3 hover:bg-red-100 transition-colors">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Temperature check overdue</p>
              <p className="text-sm text-red-600 mt-0.5">
                {tempAlerts.join(' · ')} — tap to log now
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">{restaurant?.name}</h1>
          <p className="text-sm text-mise-ink/50 mt-0.5">Owner dashboard · Target GP: {targetGp}%</p>
        </div>
        <Link
          href="/owner/eho"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-mise-deep text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow hover:bg-mise-deep/90 transition-colors"
        >
          <ShieldCheck className="h-4 w-4" />
          EHO Inspection Mode
        </Link>
      </div>

      {/* Today's Trail Progress */}
      <Link href="/owner/trail" className="block">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm px-5 py-4 hover:border-mise-mid/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-mise-mid" />
              <h2 className="text-sm font-semibold text-mise-ink">Today&apos;s Trail</h2>
            </div>
            <span className={`text-xs font-semibold ${trailPct === 100 ? 'text-green-600' : trailPct > 0 ? 'text-mise-mid' : 'text-mise-ink/30'}`}>
              {trailTotal === 0 ? 'No tasks yet' : `${trailDone}/${trailTotal} complete`}
            </span>
          </div>
          {trailTotal > 0 && (
            <>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-mise-mid rounded-full transition-all" style={{ width: `${trailPct}%` }} />
              </div>
              <div className="flex items-center gap-4 flex-wrap text-xs">
                {missedTasks.length > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {missedTasks.length} task{missedTasks.length !== 1 ? 's' : ''} overdue
                  </span>
                )}
                {trailFlagged > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    ⚑ {trailFlagged} flagged
                  </span>
                )}
                {nextTask && (
                  <span className="text-mise-ink/50">
                    Next: <span className="font-medium text-mise-ink">{nextTask.title}</span>
                    {nextTask.scheduled_time && (
                      <span className="ml-1 text-mise-ink/40">@ {nextTask.scheduled_time.slice(0, 5)}</span>
                    )}
                  </span>
                )}
                {trailPct === 100 && (
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All tasks complete
                  </span>
                )}
              </div>
            </>
          )}
          {trailTotal === 0 && (
            <p className="text-xs text-mise-ink/40">Trail tasks will appear here once today&apos;s trail has been loaded.</p>
          )}
        </div>
      </Link>

      {/* Today's delivery spend */}
      <Link href="/owner/trail" className="block">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm px-5 py-4 flex items-center justify-between hover:border-mise-mid/30 transition-colors">
          <div>
            <p className="text-xs font-semibold text-mise-ink/40 uppercase tracking-widest mb-1">Today&apos;s delivery spend</p>
            <p className="text-2xl font-display font-bold text-mise-ink">
              {todayDeliveries.length === 0 ? '—' : `£${todaySpend.toFixed(2)}`}
            </p>
            {todayDeliveries.length > 0 && (
              <p className="text-xs text-mise-ink/40 mt-1">
                {todayDeliveries.length} deliver{todayDeliveries.length !== 1 ? 'ies' : 'y'} · {todayDeliveries.map(d => d.supplier).filter(Boolean).join(', ')}
              </p>
            )}
            {todayDeliveries.length === 0 && (
              <p className="text-xs text-mise-ink/40 mt-1">No deliveries logged today</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-mise-ink/20">
            <Truck className="h-6 w-6" />
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>

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

      {/* Staff Training — FOH + BOH side by side */}
      {(() => {
        function CompliancePanel({ label, quizUrl, compliance, lastAttempt, colour }: {
          label: string; quizUrl: string
          compliance: { name: string; expiry: Date; status: 'valid' | 'expiring' | 'expired' }[]
          lastAttempt: { completed_at: string } | null
          colour: 'amber' | 'blue'
        }) {
          const valid = compliance.filter(s => s.status === 'valid')
          const expiring = compliance.filter(s => s.status === 'expiring')
          const expired = compliance.filter(s => s.status === 'expired')
          const total = compliance.length
          const pct = total > 0 ? Math.round((valid.length / total) * 100) : 0
          const barColour = colour === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
          const iconColour = colour === 'amber' ? 'text-amber-600' : 'text-blue-600'
          const bgLight = colour === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
          return (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className={`h-4 w-4 ${iconColour}`} />
                  <h2 className="text-sm font-semibold text-mise-ink">{label}</h2>
                </div>
                <Link href={quizUrl} className="text-xs text-mise-mid hover:text-mise-deep font-medium">View →</Link>
              </div>
              {total === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-mise-ink/40">No {label.toLowerCase()} staff trained yet</p>
                  <Link href={quizUrl} className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
                    Share quiz link <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-mise-ink/50 font-medium">{valid.length} of {total} fully trained</span>
                      <span className={`font-bold ${pct === 100 ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColour} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> {valid.length} valid</span>
                      {expiring.length > 0 && <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3.5 w-3.5" /> {expiring.length} expiring</span>}
                      {expired.length > 0 && <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="h-3.5 w-3.5" /> {expired.length} expired</span>}
                    </div>
                    {lastAttempt && (
                      <p className="text-xs text-mise-ink/30 mt-2">Last quiz: {new Date(lastAttempt.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 max-h-44 overflow-y-auto">
                    {expired.map(s => (
                      <div key={s.name} className="flex items-center justify-between px-4 py-2.5 bg-red-50/40">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <p className="text-sm font-medium text-mise-ink">{s.name}</p>
                        </div>
                        <p className="text-xs text-red-500 font-medium">Needs retraining</p>
                      </div>
                    ))}
                    {expiring.map(s => {
                      const daysLeft = Math.ceil((s.expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={s.name} className="flex items-center justify-between px-4 py-2.5 bg-amber-50/50">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <p className="text-sm font-medium text-mise-ink">{s.name}</p>
                          </div>
                          <p className="text-xs text-amber-600 font-medium">{daysLeft}d left</p>
                        </div>
                      )
                    })}
                    {valid.map(s => (
                      <div key={s.name} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <p className="text-sm text-gray-700">{s.name}</p>
                        </div>
                        <p className="text-xs text-mise-ink/40">Expires {s.expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        }
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompliancePanel
              label="FOH Training"
              quizUrl="/owner/staff-quiz?type=front_of_house&tab=compliance"
              compliance={fohCompliance}
              lastAttempt={lastFohQuiz}
              colour="amber"
            />
            <CompliancePanel
              label="BOH Training"
              quizUrl="/owner/staff-quiz?type=kitchen&tab=compliance"
              compliance={bohCompliance}
              lastAttempt={lastBohQuiz}
              colour="blue"
            />
          </div>
        )
      })()}

      {/* Kitchen audit + Live menus row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kitchen Audit */}
        {(() => {
          const auditScore = lastAudit ? Math.round((lastAudit.score / lastAudit.total) * 100) : null
          const auditDate = lastAudit ? new Date(lastAudit.completed_at) : null
          const nextDue = auditDate ? addMonths(auditDate, 1) : null
          const isOverdue = nextDue ? nextDue < now : false
          const isDueSoon = nextDue ? !isOverdue && nextDue <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : false
          const statusColour = lastAudit?.status === 'green' ? 'text-green-700' : lastAudit?.status === 'amber' ? 'text-amber-600' : lastAudit?.status === 'red' ? 'text-red-600' : 'text-gray-400'
          return (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-mise-mid" />
                  <h2 className="text-sm font-semibold text-mise-ink">Kitchen Audit</h2>
                </div>
                <Link href="/chef/audit" className="text-xs text-mise-mid hover:text-mise-deep font-medium">Run audit →</Link>
              </div>
              {!lastAudit ? (
                <div className="text-center py-4">
                  <p className="text-sm text-mise-ink/40">No audits completed yet</p>
                  <Link href="/chef/audit/new" className="inline-flex items-center gap-1 text-xs text-mise-mid hover:text-mise-deep mt-2 font-medium">
                    Start first audit <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-mise-ink/40 uppercase tracking-widest mb-1">Last score</p>
                    <p className={`text-2xl font-bold ${statusColour}`}>{auditScore}%</p>
                    <p className="text-xs text-mise-ink/40 mt-0.5">by {lastAudit.completed_by}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-mise-ink/40 uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-sm font-semibold text-mise-ink">{auditDate!.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-mise-ink/40 uppercase tracking-widest mb-1">Next due</p>
                    <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-mise-ink'}`}>
                      {nextDue!.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {isOverdue && <p className="text-xs text-red-500 mt-0.5">Overdue</p>}
                    {isDueSoon && !isOverdue && <p className="text-xs text-amber-600 mt-0.5">Due soon</p>}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

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
      </div>

    </div>
  )
}
