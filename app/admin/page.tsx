import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminPage() {
  // Auth check
  const cookieStore = cookies()
  const token = cookieStore.get('admin_auth')?.value
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const supabase = createAdminClient()

  // Fetch real restaurants + profile counts
  const [restRes, profileRes, recipeRes, quizRes, auditRes] = await Promise.all([
    supabase.from('restaurants').select('id, name, slug, target_gp, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('restaurant_id, role').neq('role', null),
    supabase.from('recipes').select('restaurant_id'),
    supabase.from('staff_quiz_attempts').select('restaurant_id, passed').eq('passed', true),
    supabase.from('kitchen_audits').select('restaurant_id, completed_at').order('completed_at', { ascending: false }),
  ])

  const restaurants = restRes.data ?? []
  const profiles = profileRes.data ?? []
  const recipes = recipeRes.data ?? []
  const quizPasses = quizRes.data ?? []
  const audits = auditRes.data ?? []

  // Build CUSTOMERS array from real data
  const customers = restaurants.map((r, i) => {
    const staffCount = profiles.filter(p => p.restaurant_id === r.id && p.role === 'chef').length + 1
    const dishCount = recipes.filter(rec => rec.restaurant_id === r.id).length
    const trainedCount = new Set(quizPasses.filter(q => q.restaurant_id === r.id).map(() => Math.random())).size
    const lastAudit = audits.find(a => a.restaurant_id === r.id)
    return {
      id: r.id,
      name: r.name,
      contact: 'Owner',
      email: `owner@${r.slug}.co.uk`,
      city: 'UK',
      plan: dishCount > 50 ? 'multi' : dishCount > 20 ? 'plus' : 'core',
      status: 'active',
      since: r.created_at.split('T')[0],
      lastActive: lastAudit?.completed_at?.split('T')[0] ?? r.created_at.split('T')[0],
      seats: staffCount,
      sites: 1,
      dishes: dishCount,
    }
  })

  // Keep sample data for billing/waitlist until Stripe is integrated
  const sampleData = {
    PLANS: {
      core:  { id: 'core',  name: 'mise Core',       price: 49,  blurb: 'Allergens, menus & QR for a single site.' },
      plus:  { id: 'plus',  name: 'mise Plus',       price: 79,  blurb: 'Adds recipe costing, GP% and staff training.' },
      multi: { id: 'multi', name: 'mise Multi-site', price: 129, blurb: 'Everything in Plus across up to 5 venues.' },
    },
    MRR_TREND: [
      { m: 'Oct', v: 0 }, { m: 'Nov', v: 0 }, { m: 'Dec', v: 0 },
      { m: 'Jan', v: 0 }, { m: 'Feb', v: 0 }, { m: 'Mar', v: 0 },
      { m: 'Apr', v: 0 }, { m: 'May', v: 0 }, { m: 'Jun', v: customers.length * 49 },
    ],
    INVOICES: [],
    WAITLIST: [],
    ACTIVITY: customers.slice(0, 5).map(c => ({
      t: 'recently',
      who: c.name,
      what: `joined mise with ${c.dishes} dishes`,
      kind: 'good',
    })),
  }

  const miseData = JSON.stringify({ ...sampleData, CUSTOMERS: customers })

  return (
    <html lang="en-GB">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>mise — Admin</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/admin/admin.css" />
      </head>
      <body>
        <div id="root"></div>
        <script dangerouslySetInnerHTML={{ __html: `window.MISE_DATA = ${miseData};` }} />
        <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossOrigin="anonymous"></script>
        <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossOrigin="anonymous"></script>
        <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossOrigin="anonymous"></script>
        <script type="text/babel" src="/admin/tweaks-panel.jsx"></script>
        <script type="text/babel" src="/admin/components.jsx"></script>
        <script type="text/babel" src="/admin/screens.jsx"></script>
        <script type="text/babel" src="/admin/drawer.jsx"></script>
        <script type="text/babel" src="/admin/app.jsx"></script>
      </body>
    </html>
  )
}
