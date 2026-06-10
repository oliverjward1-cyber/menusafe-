import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PrintButton from './PrintButton'
import {
  CheckCircle2, AlertTriangle, XCircle, ClipboardCheck,
  Users, ChefHat, BookOpen, ShieldCheck, Info,
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

function PassBadge({ pass }: { pass: boolean }) {
  return pass
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Pass</span>
    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">✗ Fail</span>
}

function tempPassFail(location: string, temp: number): 'pass' | 'fail' | 'unknown' {
  const loc = location.toLowerCase()
  if (loc.includes('freezer')) return temp <= -18 ? 'pass' : 'fail'
  if (loc.includes('hot') || loc.includes('hold')) return temp >= 63 ? 'pass' : 'fail'
  if (loc.includes('fridge') || loc.includes('walk-in') || loc.includes('display') || loc.includes('cabinet') || loc.includes('fridge')) return temp <= 8 ? 'pass' : 'fail'
  return 'unknown'
}

function safeRange(location: string): string {
  const loc = location.toLowerCase()
  if (loc.includes('freezer')) return '≤ −18°C'
  if (loc.includes('hot') || loc.includes('hold')) return '≥ 63°C'
  if (loc.includes('fridge') || loc.includes('walk-in') || loc.includes('display') || loc.includes('cabinet')) return '≤ 8°C'
  return '—'
}

export default async function EHOInspectionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('restaurant_id, role').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/owner')
  const rid = profile.restaurant_id

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    restaurantRes, recipesRes, menusRes, quizRes, auditRes, profilesRes,
    tempLogsRes, cleaningLogsRes, deliveriesRes, incidentsRes,
    haccpRes, calibrationsRes,
  ] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', rid).single(),
    supabase.from('recipes').select(`
      id, name, status, sell_price,
      recipe_ingredients(quantity, ingredients(cost_per_unit, unit_type, allergen_celery, allergen_cereals_gluten, allergen_crustaceans, allergen_eggs, allergen_fish, allergen_lupin, allergen_milk, allergen_molluscs, allergen_mustard, allergen_nuts, allergen_peanuts, allergen_sesame, allergen_soya, allergen_sulphites))
    `).eq('restaurant_id', rid),
    supabase.from('menus').select('id, name, daypart, is_published, updated_at').eq('restaurant_id', rid),
    supabase.from('staff_quiz_attempts')
      .select('id, staff_name, score, total_questions, passed, completed_at, quiz_type, assessment_type')
      .eq('restaurant_id', rid).order('completed_at', { ascending: false }),
    supabase.from('kitchen_audits')
      .select('id, score, total, status, completed_at, completed_by, notes')
      .eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('full_name, role').eq('restaurant_id', rid),
    supabase.from('temperature_logs')
      .select('id, location, temperature, unit, check_type, recorded_by, notes, corrective_action, logged_at')
      .eq('restaurant_id', rid).order('logged_at', { ascending: false }).limit(30),
    supabase.from('cleaning_logs').select('*').eq('restaurant_id', rid).order('completed_at', { ascending: false }).limit(20),
    supabase.from('delivery_records').select('*').eq('restaurant_id', rid).order('delivered_at', { ascending: false }).limit(10),
    supabase.from('incidents')
      .select('id, type, severity, title, description, action_taken, affected_person, reported_by, resolved, resolved_at, occurred_at')
      .eq('restaurant_id', rid).order('occurred_at', { ascending: false }).limit(15),
    supabase.from('haccp_plans').select('*').eq('restaurant_id', rid).order('last_reviewed_date', { ascending: false }).limit(1),
    supabase.from('probe_calibrations').select('*').eq('restaurant_id', rid).order('calibrated_at', { ascending: false }).limit(10),
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
  const haccpPlan = haccpRes.data?.[0] ?? null
  const calibrations = calibrationsRes.data ?? []

  // --- Staff training ---
  const latestByStaff = new Map<string, typeof allAttempts[number]>()
  for (const a of allAttempts) {
    if (a.passed && !latestByStaff.has(a.staff_name)) latestByStaff.set(a.staff_name, a)
  }
  const trainedStaff = Array.from(latestByStaff.values())
  const expiredStaff = trainedStaff.filter(s => addM(new Date(s.completed_at), 6) < now)
  const validStaff = trainedStaff.filter(s => addM(new Date(s.completed_at), 6) >= now)

  // --- Recipes / Menus ---
  const approvedRecipes = recipes.filter(r => r.status === 'approved')
  const publishedMenus = menus.filter(m => m.is_published)

  // --- Audit ---
  const nextAuditDue = lastAudit ? addM(new Date(lastAudit.completed_at), 1) : null
  const auditOverdue = nextAuditDue ? nextAuditDue < now : true

  // --- Temperature: today's checks ---
  const todayTempLogs = tempLogs.filter(l => l.logged_at.startsWith(todayStr))
  const amDoneToday = todayTempLogs.some(l => l.check_type === 'am')
  const pmDoneToday = todayTempLogs.some(l => l.check_type === 'pm')
  const tempMissingToday = !amDoneToday || !pmDoneToday

  // --- Failing temp readings with no corrective action ---
  const failingLogsNoAction = tempLogs.filter(l => {
    const result = tempPassFail(l.location, l.temperature)
    return result === 'fail' && !l.corrective_action
  })

  // --- Incidents ---
  const unresolvedCritical = incidentsList.filter(i => !i.resolved && i.severity === 'critical')
  const openIncidentsNoAction = incidentsList.filter(i => !i.resolved && !i.action_taken)

  // --- HACCP ---
  const haccpOverdue = haccpPlan
    ? addM(new Date(haccpPlan.last_reviewed_date), 12) < now
    : true

  // --- Probe calibration ---
  const lastCalibration = calibrations[0] ?? null
  const calibrationOverdue = !lastCalibration || new Date(lastCalibration.calibrated_at) < new Date(thirtyDaysAgo)

  // --- Overall status badge logic ---
  type BadgeStatus = 'compliant' | 'action' | 'review'
  let badgeStatus: BadgeStatus = 'compliant'
  const actionReasons: string[] = []
  const reviewReasons: string[] = []

  if (unresolvedCritical.length > 0) {
    badgeStatus = 'action'
    actionReasons.push(`${unresolvedCritical.length} unresolved critical incident${unresolvedCritical.length > 1 ? 's' : ''}`)
  }
  if (failingLogsNoAction.length > 0) {
    badgeStatus = 'action'
    actionReasons.push(`${failingLogsNoAction.length} temperature failure${failingLogsNoAction.length > 1 ? 's' : ''} with no corrective action`)
  }
  if (badgeStatus !== 'action') {
    if (expiredStaff.length > 0) { badgeStatus = 'review'; reviewReasons.push(`${expiredStaff.length} expired staff cert${expiredStaff.length > 1 ? 's' : ''}`) }
    if (auditOverdue) { badgeStatus = 'review'; reviewReasons.push('kitchen audit overdue') }
    if (tempMissingToday) { badgeStatus = 'review'; reviewReasons.push(`${!amDoneToday ? 'AM' : ''}${!amDoneToday && !pmDoneToday ? ' & ' : ''}${!pmDoneToday ? 'PM' : ''} temperature check not logged today`) }
    if (haccpOverdue) { badgeStatus = 'review'; reviewReasons.push('HACCP plan review overdue') }
    if (calibrationOverdue) { badgeStatus = 'review'; reviewReasons.push('probe calibration overdue') }
  }

  const badgeConfig = {
    compliant: { label: 'Compliant', cls: 'bg-green-100 text-green-700' },
    action: { label: 'Action Required', cls: 'bg-red-100 text-red-700' },
    review: { label: 'Review Needed', cls: 'bg-amber-100 text-amber-700' },
  }

  const inspectionDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const inspectionTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const typeLabels: Record<string, string> = {
    allergen_reaction: 'Allergen reaction', injury: 'Injury', near_miss: 'Near miss',
    contamination: 'Contamination', pest: 'Pest sighting', equipment: 'Equipment failure', other: 'Other',
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">

      {/* Screen-only header bar */}
      <div className="print:hidden sticky top-0 z-10 bg-hospopilot-ink px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-4 w-4 text-hospopilot-fresh flex-shrink-0" />
            <span className="text-white font-semibold text-sm truncate">EHO Inspection Mode</span>
            <span className="text-xs text-gray-400 hidden sm:inline flex-shrink-0">· {inspectionTime}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PrintButton />
            <Link href="/owner" className="text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap">← Back</Link>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 sm:hidden">Live data · {inspectionTime}</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ── Cover ── */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-hospopilot-ink">{restaurant?.name}</h1>
              <p className="text-hospopilot-ink/50 mt-1 text-sm">Food Safety & Allergen Compliance Record</p>
              <p className="text-sm text-hospopilot-ink/40 mt-0.5">Inspection date: {inspectionDate}</p>
            </div>
            {/* Status badge — full width on mobile */}
            <div className={`flex items-start gap-3 p-4 rounded-xl ${badgeConfig[badgeStatus].cls}`}>
              <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{badgeConfig[badgeStatus].label}</p>
                {badgeStatus === 'compliant' ? (
                  <p className="text-xs mt-0.5 opacity-80">All checks passed: certs valid, audit current, temps logged today, no critical incidents.</p>
                ) : badgeStatus === 'action' ? (
                  <ul className="text-xs mt-1 space-y-0.5 opacity-90">
                    {actionReasons.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                ) : (
                  <ul className="text-xs mt-1 space-y-0.5 opacity-90">
                    {reviewReasons.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                )}
                <p className="text-xs mt-1.5 opacity-50 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Status auto-calculated from live data
                </p>
              </div>
            </div>
          </div>

          {/* Quick summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Approved dishes', value: approvedRecipes.length, ok: approvedRecipes.length > 0 },
              { label: 'Published menus', value: publishedMenus.length, ok: publishedMenus.length > 0 },
              { label: 'Staff trained', value: validStaff.length, ok: validStaff.length > 0 },
              { label: 'Last audit', value: lastAudit ? `${Math.round((lastAudit.score / lastAudit.total) * 100)}%` : 'None', ok: !!lastAudit && lastAudit.status !== 'red' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-hospopilot-ink/40 font-medium uppercase tracking-wide">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.ok ? 'text-hospopilot-ink' : 'text-red-500'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 1. Kitchen Audit ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-hospopilot-mid" /> Kitchen Audit Records
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
                  <div key={audit.id} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <StatusDot status={audit.status as 'green' | 'amber' | 'red'} />
                      <div>
                        <p className="text-sm font-medium text-hospopilot-ink">
                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {i === 0 && <span className="ml-2 text-xs bg-hospopilot-mid/10 text-hospopilot-mid px-2 py-0.5 rounded-full">Most recent</span>}
                        </p>
                        <p className="text-xs text-hospopilot-ink/40">Completed by {audit.completed_by}</p>
                        {audit.notes && <p className="text-xs text-hospopilot-ink/50 mt-0.5 italic">"{audit.notes}"</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${audit.status === 'green' ? 'text-green-600' : audit.status === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</p>
                      <p className="text-xs text-hospopilot-ink/40">{audit.score}/{audit.total} passed</p>
                    </div>
                  </div>
                )
              })}
              {auditOverdue && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Next audit overdue — due {nextAuditDue?.toLocaleDateString('en-GB')}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 2. HACCP Plan ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> HACCP Plan
          </h2>
          {!haccpPlan ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">No HACCP plan on record</p>
                <p className="text-xs text-red-600 mt-0.5">A documented HACCP plan is required for EHO inspection. Add one via the owner portal.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-hospopilot-ink">{haccpPlan.title}</p>
                  <p className="text-sm text-hospopilot-ink/60 mt-1">
                    Last reviewed: <span className="font-medium">{new Date(haccpPlan.last_reviewed_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {' '}by <span className="font-medium">{haccpPlan.reviewed_by}</span>
                  </p>
                  {haccpPlan.notes && <p className="text-xs text-hospopilot-ink/40 mt-1 italic">"{haccpPlan.notes}"</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {haccpOverdue
                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-3 py-1 rounded-full"><AlertTriangle className="h-3 w-3" /> Overdue</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Current</span>}
                  {haccpPlan.document_url && (
                    <a href={haccpPlan.document_url} target="_blank" rel="noreferrer"
                      className="text-xs text-hospopilot-mid font-semibold hover:underline">
                      View document →
                    </a>
                  )}
                </div>
              </div>
              {haccpOverdue && (
                <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-600">
                  HACCP plan not reviewed within 12 months — review required before inspection.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 3. Staff Allergen Training ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Assessment type</th>
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
                    const assessmentLabel = s.assessment_type ?? (s.quiz_type === 'kitchen' ? 'Kitchen Allergen Knowledge' : 'Front of House Allergen Knowledge')
                    return (
                      <tr key={s.id} className={expired ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 font-medium text-hospopilot-ink">{s.staff_name}</td>
                        <td className="px-4 py-3 text-hospopilot-ink/70">
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{assessmentLabel}</span>
                        </td>
                        <td className="px-4 py-3 text-hospopilot-ink">{pct}% ({s.score}/{s.total_questions})</td>
                        <td className="px-4 py-3 text-hospopilot-ink/60">{new Date(s.completed_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-hospopilot-ink/60">{expiry.toLocaleDateString('en-GB')}</td>
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

        {/* ── 4. Kitchen Team (all roles) ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
            <ChefHat className="h-5 w-5 text-hospopilot-gold" /> Full Team — Allergen Training Status
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Allergen training</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-hospopilot-ink/40 text-sm text-center">No team members found</td></tr>
                ) : profiles.map((p, i) => {
                  const trained = trainedStaff.find(s => s.staff_name.toLowerCase() === (p.full_name ?? '').toLowerCase())
                  const expired = trained ? addM(new Date(trained.completed_at), 6) < now : false
                  const expiry = trained ? addM(new Date(trained.completed_at), 6) : null
                  return (
                    <tr key={i} className={expired ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 font-medium text-hospopilot-ink">{p.full_name ?? '—'}</td>
                      <td className="px-4 py-3 capitalize text-hospopilot-ink/60">{p.role?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        {trained
                          ? expired
                            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><XCircle className="h-3.5 w-3.5" /> Expired</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Valid</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Not recorded</span>}
                      </td>
                      <td className="px-4 py-3 text-hospopilot-ink/50 text-xs">{expiry ? expiry.toLocaleDateString('en-GB') : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 5. Allergen Matrix ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
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
                        <td className="px-3 py-2 font-medium text-hospopilot-ink">{recipe.name}</td>
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

        {/* ── 6. Temperature Monitoring ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
            <span className="text-blue-400 text-xl">🌡</span> Temperature Monitoring
          </h2>

          {/* Today's check status */}
          <div className="flex gap-3 mb-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${amDoneToday ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {amDoneToday ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              AM check {amDoneToday ? 'logged' : 'missing today'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${pmDoneToday ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {pmDoneToday ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              PM check {pmDoneToday ? 'logged' : 'missing today'}
            </div>
          </div>

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
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Reading</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Safe range</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Result</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Check</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Corrective action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">By</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tempLogs.slice(0, 20).map((log: any) => {
                    const result = tempPassFail(log.location, log.temperature)
                    const isFail = result === 'fail'
                    const noAction = isFail && !log.corrective_action
                    return (
                      <tr key={log.id} className={isFail ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2.5 font-medium text-hospopilot-ink">{log.location}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-hospopilot-ink">{log.temperature}°{log.unit ?? 'C'}</td>
                        <td className="px-4 py-2.5 text-hospopilot-ink/50 text-xs">{safeRange(log.location)}</td>
                        <td className="px-4 py-2.5">
                          {result === 'unknown'
                            ? <span className="text-xs text-gray-400">—</span>
                            : <PassBadge pass={result === 'pass'} />}
                        </td>
                        <td className="px-4 py-2.5 text-hospopilot-ink/60 capitalize text-xs">{log.check_type}</td>
                        <td className="px-4 py-2.5">
                          {log.corrective_action
                            ? <span className="text-xs text-green-700">{log.corrective_action}</span>
                            : noAction
                              ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><AlertTriangle className="h-3 w-3" /> No action recorded</span>
                              : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-hospopilot-ink/60 text-xs">{log.recorded_by}</td>
                        <td className="px-4 py-2.5 text-hospopilot-ink/40 text-xs whitespace-nowrap">
                          {new Date(log.logged_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Probe Calibration ── */}
          <div className="mt-6">
            <h3 className="text-base font-semibold text-hospopilot-ink mb-3">Probe calibration log</h3>

            {calibrationOverdue && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Probe calibration overdue — last recorded {lastCalibration
                  ? new Date(lastCalibration.calibrated_at).toLocaleDateString('en-GB')
                  : 'never'}
              </div>
            )}

            {calibrations.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" /> No probe calibration records on file
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ice point (0°C ±1)</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Boiling point (100°C ±1)</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Overall</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Recorded by</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {calibrations.map((cal: any) => {
                      const icePass = cal.ice_point >= -1 && cal.ice_point <= 1
                      const boilPass = cal.boiling_point >= 99 && cal.boiling_point <= 101
                      const overallPass = icePass && boilPass
                      return (
                        <tr key={cal.id} className={!overallPass ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2.5 text-hospopilot-ink font-medium text-xs whitespace-nowrap">
                            {new Date(cal.calibrated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`font-mono text-sm ${icePass ? 'text-hospopilot-ink' : 'text-red-600 font-bold'}`}>{cal.ice_point}°C</span>
                            {' '}<PassBadge pass={icePass} />
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`font-mono text-sm ${boilPass ? 'text-hospopilot-ink' : 'text-red-600 font-bold'}`}>{cal.boiling_point}°C</span>
                            {' '}<PassBadge pass={boilPass} />
                          </td>
                          <td className="px-4 py-2.5"><PassBadge pass={overallPass} /></td>
                          <td className="px-4 py-2.5 text-hospopilot-ink/60 text-xs">{cal.recorded_by}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── 7. Cleaning Records ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
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
                  {cleaningLogs.slice(0, 15).map((log: any) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2.5 font-medium text-hospopilot-ink">{log.task_name}</td>
                      <td className="px-4 py-2.5 text-hospopilot-ink/60">{log.signed_by}</td>
                      <td className="px-4 py-2.5 text-hospopilot-ink/40 text-xs">{new Date(log.completed_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 8. Delivery Records ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
            <span className="text-hospopilot-gold text-xl">📦</span> Delivery Records (recent)
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Received by</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.map((rec: any) => (
                    <tr key={rec.id} className={rec.condition === 'rejected' ? 'bg-red-50' : rec.condition === 'borderline' ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-2.5 font-medium text-hospopilot-ink">{rec.supplier}</td>
                      <td className="px-4 py-2.5 text-hospopilot-ink/70 max-w-xs truncate">{rec.items}</td>
                      <td className="px-4 py-2.5 font-mono text-hospopilot-ink/70 text-xs">{rec.temperature != null ? `${rec.temperature}°C` : '—'}</td>
                      <td className="px-4 py-2.5 capitalize">
                        <span className={`text-xs font-semibold ${rec.condition === 'rejected' ? 'text-red-600' : rec.condition === 'borderline' ? 'text-amber-600' : 'text-green-700'}`}>
                          {rec.condition}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-hospopilot-ink/60 text-xs">{rec.received_by}</td>
                      <td className="px-4 py-2.5 text-hospopilot-ink/40 text-xs">{new Date(rec.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 9. Incident Log ── */}
        <section>
          <h2 className="text-lg font-semibold text-hospopilot-ink flex items-center gap-2 mb-4">
            <span className="text-red-500 text-xl">⚠️</span> Incident Log
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
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Incident</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Severity</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Corrective action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {incidentsList.map((inc: any) => {
                    const noAction = !inc.resolved && !inc.action_taken
                    return (
                      <tr key={inc.id} className={!inc.resolved && inc.severity === 'critical' ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2.5 text-hospopilot-ink/60 text-xs capitalize">{typeLabels[inc.type] ?? inc.type}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-hospopilot-ink">{inc.title}</p>
                          {inc.description && <p className="text-xs text-hospopilot-ink/50 mt-0.5 line-clamp-2">{inc.description}</p>}
                          {inc.affected_person && <p className="text-xs text-hospopilot-ink/40 mt-0.5">Person: {inc.affected_person}</p>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold capitalize ${
                            inc.severity === 'critical' ? 'text-red-700' :
                            inc.severity === 'high' ? 'text-orange-600' :
                            inc.severity === 'medium' ? 'text-amber-600' : 'text-gray-500'
                          }`}>{inc.severity}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {inc.action_taken
                            ? <span className="text-xs text-green-700">{inc.action_taken}</span>
                            : noAction
                              ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap"><AlertTriangle className="h-3 w-3" /> No action recorded</span>
                              : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {inc.resolved
                            ? <span className="text-green-600 text-xs font-medium">Resolved</span>
                            : <span className="text-red-600 text-xs font-semibold">Open</span>}
                        </td>
                        <td className="px-4 py-2.5 text-hospopilot-ink/40 text-xs whitespace-nowrap">
                          {new Date(inc.occurred_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-xs text-hospopilot-ink/30 flex items-center justify-between">
          <span>Generated by HospoPilot · {inspectionDate} at {inspectionTime}</span>
          <span>{restaurant?.name}</span>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .print\\:hidden { display: none !important; }
          body { font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { page-break-inside: avoid; break-inside: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  )
}
