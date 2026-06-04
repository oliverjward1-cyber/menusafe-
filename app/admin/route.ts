import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_auth')?.value
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const supabase = createAdminClient()

  const [restRes, profileRes, recipeRes, auditRes, quizRes, loginEventsRes, sessionsRes] = await Promise.all([
    supabase.from('restaurants').select('id, name, slug, plan, target_gp, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, restaurant_id, role, full_name').order('created_at', { ascending: true }),
    supabase.from('recipes').select('restaurant_id'),
    supabase.from('kitchen_audits').select('restaurant_id, completed_at').order('completed_at', { ascending: false }),
    supabase.from('staff_quiz_attempts').select('restaurant_id, staff_name, passed, score, total_questions, completed_at').order('completed_at', { ascending: false }),
    supabase.from('login_events').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('user_sessions').select('*').order('last_seen', { ascending: false }),
  ])

  const restaurants = restRes.data ?? []
  const profiles = profileRes.data ?? []
  const recipes = recipeRes.data ?? []
  const audits = auditRes.data ?? []
  const quizAttempts = quizRes.data ?? []
  const loginEvents = loginEventsRes.data ?? []
  const userSessions = sessionsRes.data ?? []

  const customers = restaurants.map(r => {
    const restProfiles = profiles.filter(p => p.restaurant_id === r.id)
    const owner = restProfiles.find(p => p.role === 'owner')
    const chef = restProfiles.find(p => p.role === 'chef')
    const dishCount = recipes.filter(rec => rec.restaurant_id === r.id).length
    const lastAudit = audits.find(a => a.restaurant_id === r.id)
    const restQuizzes = quizAttempts.filter(q => q.restaurant_id === r.id)
    const trainedStaff = new Set(restQuizzes.filter(q => q.passed).map(q => q.staff_name)).size
    const totalQuizAttempts = restQuizzes.length

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      contact: owner?.full_name ?? 'Owner',
      email: owner?.full_name ? `${owner.full_name.toLowerCase().replace(' ', '.')}@${r.slug}.co.uk` : `owner@${r.slug}.co.uk`,
      city: 'UK',
      plan: r.plan ?? (dishCount > 50 ? 'multi' : dishCount > 20 ? 'plus' : 'core'),
      status: 'active',
      since: r.created_at.split('T')[0],
      lastActive: lastAudit?.completed_at?.split('T')[0] ?? r.created_at.split('T')[0],
      seats: restProfiles.length,
      sites: 1,
      dishes: dishCount,
      // Extra fields for drawer
      profiles: restProfiles.map(p => ({ id: p.id, name: p.full_name ?? 'Unknown', role: p.role })),
      ownerName: owner?.full_name ?? null,
      chefName: chef?.full_name ?? null,
      trainedStaff,
      totalQuizAttempts,
    }
  })

  const miseData = JSON.stringify({
    PLANS: {
      core:  { id: 'core',  name: 'mise Core',       price: 49,  blurb: 'Allergens, menus & QR for a single site.' },
      plus:  { id: 'plus',  name: 'mise Plus',       price: 79,  blurb: 'Adds recipe costing, GP% and staff training.' },
      multi: { id: 'multi', name: 'mise Multi-site', price: 129, blurb: 'Everything in Plus across up to 5 venues.' },
    },
    CUSTOMERS: customers,
    LOGIN_EVENTS: loginEvents,
    USER_SESSIONS: userSessions,
    MRR_TREND: [
      { m: 'Oct', v: 0 }, { m: 'Nov', v: 0 }, { m: 'Dec', v: 0 },
      { m: 'Jan', v: 0 }, { m: 'Feb', v: 0 }, { m: 'Mar', v: 0 },
      { m: 'Apr', v: 0 }, { m: 'May', v: 0 },
      { m: 'Jun', v: customers.length * 49 },
    ],
    INVOICES: [],
    WAITLIST: [],
    ACTIVITY: customers.slice(0, 6).map(c => ({
      t: 'recently',
      who: c.name,
      what: `joined mise with ${c.dishes} dish${c.dishes !== 1 ? 'es' : ''}`,
      kind: 'good',
    })),
  })

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>mise — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/admin/admin.css" />
</head>
<body>
<div id="root"></div>
<script>window.MISE_DATA = ${miseData};</script>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
<script type="text/babel" src="/admin/tweaks-panel.jsx"></script>
<script type="text/babel" src="/admin/components.jsx"></script>
<script type="text/babel" src="/admin/screens.jsx"></script>
<script type="text/babel" src="/admin/drawer.jsx"></script>
<script type="text/babel" src="/admin/app.jsx"></script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
