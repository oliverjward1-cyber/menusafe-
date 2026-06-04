import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CheckCircle2, AlertTriangle, XCircle, ClipboardCheck,
  Users, ChefHat, BookOpen, ShieldCheck, Printer,
} from 'lucide-react'
import { ALLERGENS } from '@/lib/constants/allergens'

function addM(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function StatusDot({ status }: { status: 'green' | 'amber' | 'red' }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full flex-none ${
      status === 'green' ? 'bg-green-500' : status === 'amber' ? 'bg-amber-400' : 'bg-red-500'
    }`} />
  )
}

export default async function EHOInspectionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('restaurant_id, role').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')
  const rid = profile.restaurant_id

  const now = new Date()

  const [
    restaurantRes, recipesRes, menusRes, quizRes, auditRes, profilesRes,
    tempLogsRes, cleaningLogsRes, deliveriesRes, incidentsRes,
  ] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', rid).single(),
    supabase.from('recipes').select(`
      id, name, status, sell_price,
      recipe_ingredients(quantity, ingredients(cost_per_unit, unit_type, allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites))
    `).eq('restaurant_id', rid),
    supabase.from('menus').select('id, name, daypart, is_published, updated_at').eq('restaurant_id', rid),
    supabase.from('staff_quiz_attempts')
      .select('id, staff_name, score, total_questions, passed, completed_at')
      .eq('restaurant_id', rid).order('completed_at', { ascending: false }),
    supabase.from('kitchen_audits')
      .select('id, score, total, status, completed_at, completed_by, notes')
      .eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('full_name, role').eq('restaurant_id', rid),
    supabase.from('temperature_logs').select('*').eq('restaurant_id', rid).order('logged_at', { ascending: false }).limit(20),
    supabase.from('cleaning_logs').select('*').eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(20),
    supabase.from('delivery_records').select('*').eq('restaurant_id', rid).order('delivered_at', { ascending: false }).limit(10),
    supabase.from('incidents').select('*').eq('restaurant_id', rid).order('occurred_at', { ascending: false }).limit(10),
  ])

  const restaurant = restaurantRes.data
  const recipes = recipesRes.data ?? []
  const menus = menusRes.data ?? []
  const allAttempts = quizRes.data ?? []
  const audits = auditRes.data ?? []
  const tempLogs = tempLogsRes.data ?? []
  const cleaningLogs = cleaningLogsRes.data ?? []
  const deliveries = deliveriesRes.data ?? []
  const incidentsList = incidentsRes.data ?? []
  const profiles = profilesRes.data ?? []
  const lastAudit = audits[0]

  // Staff training status
  const latestByStaff = new Map<string, typeof allAttempts[number]>()
  for (const a of allAttempts) {
    if (a.passed && !latestByStaff.has(a.staff_name)) latestByStaff.set(a.staff_name, a)
  }
  const trainedStaff = Array.from(latestByStaff.values())
  const expiredStaff = trainedStaff.filter(s => addM(new Date(s.completed_at), 6) < now)
  const validStaff = trainedStaff.filter(s => addM(new Date(s.completed_at), 6) >= now)

  // Allergen matrix from recipes
  const approvedRecipes = recipes.filter(r => r.status === 'approved')

  // Published menus
  const publishedMenus = menus.filter(m => m.is_published)

  // Audit status
  const auditStatus = lastAudit
    ? lastAudit.status as 'green' | 'amber' | 'red'
    : 'red'
  const nextAuditDue = lastAudit ? addM(new Date(lastAudit.completed_at), 1) : null
  const auditOverdue = nextAuditDue ? nextAuditDue < now : true

  const inspectionDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const inspectionTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-white print:bg-white">

      {/* Screen-only header bar */}
      <div className="print:hidden sticky top-0 z-10 bg-mise-ink px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-mise-fresh" />
          <span className="text-white font-semibold text-sm">EHO Inspection Mode</span>
          <span className="text-xs text-gray-400">Live data · {inspectionTime}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
          <Link href="/owner" className="text-xs text-gray-400 hover:text-white transition-colors">← Back to dashboard</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Cover */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-mise-ink">{restaurant?.name}</h1>
              <p className="text-mise-ink/50 mt-1">Food Safety & Allergen Compliance Record</p>
              <p className="text-sm text-mise-ink/40 mt-0.5">Inspection date: {inspectionDate}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                expiredStaff.length === 0 && !auditOverdue && publishedMenus.length > 0
                  ? 'bg-green-100 text-green-700'
                  : expiredStaff.length > 0 || auditOverdue
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <ShieldCheck className="h-4 w-4" />
                {expiredStaff.length === 0 && !auditOverdue && publishedMenus.length > 0
                  ? 'Compliant'
                  : expiredStaff.length > 0 || auditOverdue ? 'Action required' : 'Review needed'}
              </div>
            </div>
          </div>

          {/* Quick summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Approved dishes', value: approvedRecipes.length, ok: approvedRecipes.length > 0 },
              { label: 'Published menus', value: publishedMenus.length, ok: publishedMenus.length > 0 },
              { label: 'Staff trained', value: validStaff.length, ok: validStaff.length > 0 },
              { label: 'Last audit score', value: lastAudit ? `${Math.round((lastAudit.score / lastAudit.total) * 100)}%` : 'None', ok: !!lastAudit && lastAudit.status !== 'red' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-mise-ink/40 font-medium uppercase tracking-wide">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.ok ? 'text-mise-ink' : 'text-red-500'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 1. Kitchen Audit */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-mise-mid" /> Kitchen Audit Records
          </h2>
          {audits.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-sm text-red-600">
              <XCircle className="h-4 w-4 shrink-0" /> No kitchen audits on record
            </div>
          ) : (
            <div className="space-y-3">
              {audits.map((audit, i) => {
                const pct = Math.round((audit.score / audit.total) * 100)
                const date = new Date(audit.completed_at)
                return (
                  <div key={audit.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                    i === 0 ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <StatusDot status={audit.status as 'green' | 'amber' | 'red'} />
                      <div>
                        <p className="text-sm font-medium text-mise-ink">
                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {i === 0 && <span className="ml-2 text-xs bg-mise-mid/10 text-mise-mid px-2 py-0.5 rounded-full">Most recent</span>}
                        </p>
                        <p className="text-xs text-mise-ink/40">Completed by {audit.completed_by}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${audit.status === 'green' ? 'text-green-600' : audit.status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</p>
                      <p className="text-xs text-mise-ink/40">{audit.score}/{audit.total} passed</p>
                    </div>
                  </div>
                )
              })}
              {auditOverdue && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Next audit is overdue — due {nextAuditDue?.toLocaleDateString('en-GB')}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Staff Allergen Training */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" /> Staff Allergen Training Records
          </h2>
          {trainedStaff.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-sm text-red-600">
              <XCircle className="h-4 w-4 shrink-0" /> No staff allergen training on record
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Staff member</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Completed</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Expires</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trainedStaff.map(s => {
                    const expiry = addM(new Date(s.completed_at), 6)
                    const expired = expiry < now
                    const pct = Math.round((s.score / s.total_questions) * 100)
                    return (
                      <tr key={s.id} className={expired ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 font-medium text-mise-ink">{s.staff_name}</td>
                        <td className="px-4 py-3 text-mise-ink">{pct}% ({s.score}/{s.total_questions})</td>
                        <td className="px-4 py-3 text-mise-ink/60">{new Date(s.completed_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-mise-ink/60">{expiry.toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3">
                          {expired
                            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><XCircle className="h-3.5 w-3.5" /> Expired</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Valid</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. Team */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <ChefHat className="h-5 w-5 text-mise-gold" /> Kitchen Team
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Allergen training</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p, i) => {
                  const trained = trainedStaff.find(s => s.staff_name.toLowerCase() === (p.full_name ?? '').toLowerCase())
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 font-medium text-mise-ink">{p.full_name ?? '—'}</td>
                      <td className="px-4 py-3 capitalize text-mise-ink/60">{p.role}</td>
                      <td className="px-4 py-3">
                        {trained
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Passed</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Not recorded</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Allergen Matrix */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-purple-600" /> Allergen Matrix — {approvedRecipes.length} approved dishes
          </h2>
          {approvedRecipes.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> No approved recipes on record
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600 min-w-[140px]">Dish</th>
                    {ALLERGENS.map(a => (
                      <th key={a.key} className="px-1.5 py-2.5 font-medium text-gray-500 text-center" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 80 }}>
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvedRecipes.map(recipe => {
                    const allergenSet = new Set(
                      (recipe.recipe_ingredients ?? []).flatMap((ri: any) =>
                        ri.ingredients ? ALLERGENS.filter(a => ri.ingredients[a.key]).map(a => a.key) : []
                      )
                    )
                    return (
                      <tr key={recipe.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-mise-ink">{recipe.name}</td>
                        {ALLERGENS.map(a => (
                          <td key={a.key} className="px-1.5 py-2 text-center">
                            {allergenSet.has(a.key)
                              ? <span className="text-red-500 font-bold text-sm">●</span>
                              : <span className="text-gray-200">○</span>}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. Temperature Logs */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <span className="text-blue-400 text-xl">🌡</span> Temperature Monitoring (recent)
          </h2>
          {tempLogs.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> No temperature records on file
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Temp</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Check</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">By</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tempLogs.slice(0, 10).map((log: any) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 font-medium text-mise-ink">{log.location}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-mise-ink">{log.temperature}°{log.unit}</td>
                      <td className="px-4 py-2.5 text-mise-ink/60 capitalize">{log.check_type}</td>
                      <td className="px-4 py-2.5 text-mise-ink/60">{log.recorded_by}</td>
                      <td className="px-4 py-2.5 text-mise-ink/40">{new Date(log.logged_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 6. Cleaning Records */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <span className="text-green-500 text-xl">✓</span> Cleaning Schedule (recent sign-offs)
          </h2>
          {cleaningLogs.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> No cleaning records on file
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Task</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Signed by</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cleaningLogs.slice(0, 10).map((log: any) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 font-medium text-mise-ink">{log.task_name}</td>
                      <td className="px-4 py-2.5 text-mise-ink/60">{log.signed_by}</td>
                      <td className="px-4 py-2.5 text-mise-ink/40">{new Date(log.completed_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 7. Delivery Records */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <span className="text-mise-gold text-xl">📦</span> Delivery Records (recent)
          </h2>
          {deliveries.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> No delivery records on file
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Supplier</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Items</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Temp</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Condition</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.map((rec: any) => (
                    <tr key={rec.id}>
                      <td className="px-4 py-2.5 font-medium text-mise-ink">{rec.supplier}</td>
                      <td className="px-4 py-2.5 text-mise-ink/70 max-w-xs truncate">{rec.items}</td>
                      <td className="px-4 py-2.5 font-mono text-mise-ink/70">{rec.temperature != null ? `${rec.temperature}°C` : '—'}</td>
                      <td className="px-4 py-2.5 capitalize text-mise-ink/60">{rec.condition}</td>
                      <td className="px-4 py-2.5 text-mise-ink/40">{new Date(rec.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 8. Incident Log */}
        <section>
          <h2 className="text-lg font-semibold text-mise-ink flex items-center gap-2 mb-4">
            <span className="text-red-500 text-xl">⚠️</span> Incident Log (recent)
          </h2>
          {incidentsList.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> No incidents on record
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Incident</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Severity</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {incidentsList.map((inc: any) => (
                    <tr key={inc.id} className={!inc.resolved && inc.severity === 'critical' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2.5 font-medium text-mise-ink">{inc.title}</td>
                      <td className="px-4 py-2.5 capitalize text-mise-ink/70">{inc.severity}</td>
                      <td className="px-4 py-2.5">
                        {inc.resolved
                          ? <span className="text-green-600 text-xs font-medium">Resolved</span>
                          : <span className="text-red-600 text-xs font-medium">Open</span>}
                      </td>
                      <td className="px-4 py-2.5 text-mise-ink/40">{new Date(inc.occurred_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-xs text-mise-ink/30 flex items-center justify-between">
          <span>Generated by mise · {inspectionDate} at {inspectionTime}</span>
          <span>{restaurant?.name}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { font-size: 11px; }
        }
      `}</style>
    </div>
  )
}
