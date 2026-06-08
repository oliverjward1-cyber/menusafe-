import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function generateDemoInvoices(demos: any[]) {
  const invoices: any[] = []
  const planPrice: Record<string, number> = { core: 49, plus: 79, multi: 129 }
  const statuses = ['paid', 'paid', 'paid', 'paid', 'overdue', 'refunded']
  demos.filter(d => d.status === 'active' || d.status === 'past_due').forEach(d => {
    for (let i = 0; i < 3; i++) {
      const date = new Date(2025, 4 - i, 1).toISOString().split('T')[0]
      invoices.push({
        id: `INV-${d.id.slice(-3)}-${3 - i}`,
        cust: d.id,
        date,
        amount: planPrice[d.plan] ?? 49,
        status: i === 0 && d.status === 'past_due' ? 'overdue' : statuses[Math.floor(Math.random() * 4)],
      })
    }
  })
  return invoices
}

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_auth')?.value
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const supabase = createAdminClient()

  const [restRes, profileRes, recipeRes, auditRes, quizRes, loginEventsRes, sessionsRes, notesRes, menusRes] = await Promise.all([
    supabase.from('restaurants').select('id, name, slug, plan, target_gp, created_at, acquisition_source, referral_code, referred_by').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, restaurant_id, role, full_name').order('created_at', { ascending: true }),
    supabase.from('recipes').select('restaurant_id'),
    supabase.from('kitchen_audits').select('restaurant_id, completed_at').order('completed_at', { ascending: false }),
    supabase.from('staff_quiz_attempts').select('restaurant_id, staff_name, passed, score, total_questions, completed_at').order('completed_at', { ascending: false }),
    supabase.from('login_events').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('user_sessions').select('*').order('last_seen', { ascending: false }),
    supabase.from('customer_notes').select('restaurant_id, note, created_by, created_at').order('created_at', { ascending: false }),
    supabase.from('menus').select('restaurant_id, is_published'),
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

    // Health score: 0-100
    // +25 if has any recipes
    // +20 if has a published menu
    // +20 if has done a quiz attempt in last 30 days
    // +20 if has done a kitchen audit in last 30 days
    // +15 if logged in (has a login_event) in last 7 days
    const recentQuiz = quizAttempts.find(q => q.restaurant_id === r.id && new Date(q.completed_at) > new Date(Date.now() - 30*24*60*60*1000))
    const recentAudit = audits.find(a => a.restaurant_id === r.id && new Date(a.completed_at) > new Date(Date.now() - 30*24*60*60*1000))
    const hasPublishedMenu = (menusRes.data ?? []).some(m => m.restaurant_id === r.id && m.is_published)
    const recentLogin = loginEvents.find(e => e.restaurant_id === r.id && new Date(e.created_at) > new Date(Date.now() - 7*24*60*60*1000))
    const healthScore =
      (dishCount > 0 ? 25 : 0) +
      (hasPublishedMenu ? 20 : 0) +
      (recentQuiz ? 20 : 0) +
      (recentAudit ? 20 : 0) +
      (recentLogin ? 15 : 0)

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
      healthScore,
      healthStatus: healthScore >= 70 ? 'good' : healthScore >= 40 ? 'warn' : 'bad',
      acquisitionSource: r.acquisition_source ?? null,
      referralCode: r.referral_code ?? null,
      referredBy: r.referred_by ?? null,
      notes: (notesRes.data ?? []).filter(n => n.restaurant_id === r.id),
    }
  })

  // Demo customers injected alongside real ones for dashboard preview
  const DEMO_CUSTOMERS = [
    { id:'d01',name:'The Ivy Garden',contact:'James Hart',email:'james.hart@ivygarden.co.uk',city:'London',plan:'multi',status:'active',since:'2024-01-15',lastActive:'2025-05-30',seats:8,sites:3,dishes:74,ownerName:'James Hart',chefName:'Rachel Mowbray',trainedStaff:6,totalQuizAttempts:14,healthScore:100,healthStatus:'good',acquisitionSource:'Trade show/event',referralCode:'IVYG4X1A',referredBy:null,profiles:[{id:'dp01a',name:'James Hart',role:'owner'},{id:'dp01b',name:'Rachel Mowbray',role:'chef'},{id:'dp01c',name:'Tom Ellis',role:'staff'},{id:'dp01d',name:'Priya Shah',role:'staff'}],notes:[{note:'Flagship account — referred 2 others.',created_by:'Admin',created_at:'2025-02-01T10:00:00Z'}]},
    { id:'d02',name:'Rosso Trattoria',contact:'Elena Russo',email:'elena@rossotrattoria.co.uk',city:'Manchester',plan:'plus',status:'active',since:'2024-02-20',lastActive:'2025-05-28',seats:5,sites:1,dishes:42,ownerName:'Elena Russo',chefName:'Marco Bianchi',trainedStaff:4,totalQuizAttempts:9,healthScore:85,healthStatus:'good',acquisitionSource:'Instagram/TikTok',referralCode:'ROSS7B2C',referredBy:null,profiles:[{id:'dp02a',name:'Elena Russo',role:'owner'},{id:'dp02b',name:'Marco Bianchi',role:'chef'}],notes:[]},
    { id:'d03',name:'The Bull & Gate',contact:'David Clarke',email:'david@bullandgate.co.uk',city:'Birmingham',plan:'core',status:'active',since:'2024-03-05',lastActive:'2025-05-20',seats:3,sites:1,dishes:18,ownerName:'David Clarke',chefName:null,trainedStaff:2,totalQuizAttempts:3,healthScore:60,healthStatus:'warn',acquisitionSource:'Google search',referralCode:'BULL3D4E',referredBy:'IVYG4X1A',profiles:[{id:'dp03a',name:'David Clarke',role:'owner'},{id:'dp03b',name:'Steph Reed',role:'chef'}],notes:[]},
    { id:'d04',name:'Kai Sushi',contact:'Yuki Tanaka',email:'yuki@kaisushi.co.uk',city:'London',plan:'plus',status:'active',since:'2024-03-18',lastActive:'2025-05-29',seats:6,sites:1,dishes:55,ownerName:'Yuki Tanaka',chefName:'Hiro Nakamura',trainedStaff:5,totalQuizAttempts:11,healthScore:95,healthStatus:'good',acquisitionSource:'Referred by another restaurant',referralCode:'KAIS5F6G',referredBy:null,profiles:[{id:'dp04a',name:'Yuki Tanaka',role:'owner'},{id:'dp04b',name:'Hiro Nakamura',role:'chef'}],notes:[]},
    { id:'d05',name:'Brindisa Tapas',contact:'Sofia Moreno',email:'sofia@brindisatapas.co.uk',city:'London',plan:'core',status:'trial',since:'2025-05-01',lastActive:'2025-05-31',seats:2,sites:1,dishes:8,ownerName:'Sofia Moreno',chefName:null,trainedStaff:0,totalQuizAttempts:0,healthScore:25,healthStatus:'bad',acquisitionSource:'Instagram/TikTok',referralCode:'BRIN8H9I',referredBy:null,profiles:[{id:'dp05a',name:'Sofia Moreno',role:'owner'}],notes:[{note:'On trial — check in at day 7.',created_by:'Admin',created_at:'2025-05-02T09:00:00Z'}]},
    { id:'d06',name:'The Ledbury',contact:'Brett Graham',email:'brett@theledbury.co.uk',city:'London',plan:'multi',status:'active',since:'2024-01-28',lastActive:'2025-05-27',seats:12,sites:2,dishes:91,ownerName:'Brett Graham',chefName:'Anna Wells',trainedStaff:9,totalQuizAttempts:22,healthScore:100,healthStatus:'good',acquisitionSource:'Direct outreach',referralCode:'LEDB1J2K',referredBy:null,profiles:[{id:'dp06a',name:'Brett Graham',role:'owner'},{id:'dp06b',name:'Anna Wells',role:'chef'}],notes:[]},
    { id:'d07',name:'Masala Zone',contact:'Ravi Patel',email:'ravi@masalazone.co.uk',city:'Edinburgh',plan:'core',status:'active',since:'2024-04-10',lastActive:'2025-05-10',seats:4,sites:1,dishes:31,ownerName:'Ravi Patel',chefName:'Deepa Singh',trainedStaff:3,totalQuizAttempts:5,healthScore:70,healthStatus:'good',acquisitionSource:'Reddit/Facebook group',referralCode:'MASA3L4M',referredBy:null,profiles:[{id:'dp07a',name:'Ravi Patel',role:'owner'},{id:'dp07b',name:'Deepa Singh',role:'chef'}],notes:[]},
    { id:'d08',name:'Patty & Bun',contact:'Joe Grossman',email:'joe@pattyandbun.co.uk',city:'London',plan:'plus',status:'active',since:'2024-05-12',lastActive:'2025-05-26',seats:7,sites:1,dishes:24,ownerName:'Joe Grossman',chefName:'Amy Lee',trainedStaff:5,totalQuizAttempts:8,healthScore:80,healthStatus:'good',acquisitionSource:'Google search',referralCode:'PATT5N6O',referredBy:null,profiles:[{id:'dp08a',name:'Joe Grossman',role:'owner'},{id:'dp08b',name:'Amy Lee',role:'chef'}],notes:[]},
    { id:'d09',name:'Flat Iron Steak',contact:'Charlie Carroll',email:'charlie@flatiron.co.uk',city:'London',plan:'plus',status:'past_due',since:'2024-02-14',lastActive:'2025-04-30',seats:5,sites:1,dishes:19,ownerName:'Charlie Carroll',chefName:null,trainedStaff:2,totalQuizAttempts:3,healthScore:45,healthStatus:'warn',acquisitionSource:'Google search',referralCode:'FLAT7P8Q',referredBy:null,profiles:[{id:'dp09a',name:'Charlie Carroll',role:'owner'}],notes:[{note:'Card declined twice. Reached out by phone.',created_by:'Admin',created_at:'2025-05-01T14:00:00Z'}]},
    { id:'d10',name:'Dishoom Covent Garden',contact:'Shamil Thakrar',email:'shamil@dishoom.co.uk',city:'London',plan:'multi',status:'active',since:'2024-01-05',lastActive:'2025-05-31',seats:15,sites:4,dishes:68,ownerName:'Shamil Thakrar',chefName:'Naved Nasir',trainedStaff:11,totalQuizAttempts:28,healthScore:100,healthStatus:'good',acquisitionSource:'Trade show/event',referralCode:'DISH9R0S',referredBy:null,profiles:[{id:'dp10a',name:'Shamil Thakrar',role:'owner'},{id:'dp10b',name:'Naved Nasir',role:'chef'}],notes:[]},
    { id:'d11',name:'Hawksmoor',contact:'Will Beckett',email:'will@thehawksmoor.co.uk',city:'London',plan:'multi',status:'active',since:'2024-01-10',lastActive:'2025-05-29',seats:14,sites:3,dishes:52,ownerName:'Will Beckett',chefName:'Richard Turner',trainedStaff:10,totalQuizAttempts:19,healthScore:95,healthStatus:'good',acquisitionSource:'Direct outreach',referralCode:'HAWK2T3U',referredBy:null,profiles:[{id:'dp11a',name:'Will Beckett',role:'owner'},{id:'dp11b',name:'Richard Turner',role:'chef'}],notes:[]},
    { id:'d12',name:'Ottolenghi Islington',contact:'Yotam Ottolenghi',email:'yotam@ottolenghi.co.uk',city:'London',plan:'plus',status:'active',since:'2024-03-25',lastActive:'2025-05-25',seats:6,sites:1,dishes:47,ownerName:'Yotam Ottolenghi',chefName:'Sami Tamimi',trainedStaff:4,totalQuizAttempts:7,healthScore:85,healthStatus:'good',acquisitionSource:'Instagram/TikTok',referralCode:'OTTO4V5W',referredBy:null,profiles:[{id:'dp12a',name:'Yotam Ottolenghi',role:'owner'},{id:'dp12b',name:'Sami Tamimi',role:'chef'}],notes:[]},
    { id:'d13',name:'Bao Soho',contact:'Erchen Chang',email:'erchen@baolondon.co.uk',city:'London',plan:'core',status:'active',since:'2024-04-02',lastActive:'2025-05-22',seats:3,sites:1,dishes:22,ownerName:'Erchen Chang',chefName:null,trainedStaff:2,totalQuizAttempts:4,healthScore:65,healthStatus:'warn',acquisitionSource:'Referred by another restaurant',referralCode:'BAO56X7Y',referredBy:'KAIS5F6G',profiles:[{id:'dp13a',name:'Erchen Chang',role:'owner'}],notes:[]},
    { id:'d14',name:'Kiln Thai',contact:'Ben Chapman',email:'ben@kilnsoho.co.uk',city:'London',plan:'plus',status:'active',since:'2024-02-28',lastActive:'2025-05-27',seats:5,sites:1,dishes:38,ownerName:'Ben Chapman',chefName:'Som Pak',trainedStaff:4,totalQuizAttempts:6,healthScore:80,healthStatus:'good',acquisitionSource:'Google search',referralCode:'KILN8Z9A',referredBy:null,profiles:[{id:'dp14a',name:'Ben Chapman',role:'owner'},{id:'dp14b',name:'Som Pak',role:'chef'}],notes:[]},
    { id:'d15',name:'St John Bread & Wine',contact:'Trevor Gulliver',email:'trevor@stjohngroup.co.uk',city:'London',plan:'multi',status:'active',since:'2024-01-20',lastActive:'2025-05-28',seats:10,sites:2,dishes:63,ownerName:'Trevor Gulliver',chefName:'Fergus Henderson',trainedStaff:8,totalQuizAttempts:17,healthScore:90,healthStatus:'good',acquisitionSource:'Direct outreach',referralCode:'STJB2C3D',referredBy:null,profiles:[{id:'dp15a',name:'Trevor Gulliver',role:'owner'},{id:'dp15b',name:'Fergus Henderson',role:'chef'}],notes:[]},
    { id:'d16',name:'Clove Club',contact:'Isaac McHale',email:'isaac@thecloveclub.com',city:'London',plan:'plus',status:'active',since:'2024-03-08',lastActive:'2025-05-23',seats:6,sites:1,dishes:28,ownerName:'Isaac McHale',chefName:'Daniel Willis',trainedStaff:5,totalQuizAttempts:9,healthScore:88,healthStatus:'good',acquisitionSource:'Trade show/event',referralCode:'CLOV4E5F',referredBy:null,profiles:[{id:'dp16a',name:'Isaac McHale',role:'owner'},{id:'dp16b',name:'Daniel Willis',role:'chef'}],notes:[]},
    { id:'d17',name:'Moro Exmouth Market',contact:'Sam Clark',email:'sam@moro.co.uk',city:'London',plan:'core',status:'active',since:'2024-05-20',lastActive:'2025-05-18',seats:3,sites:1,dishes:25,ownerName:'Sam Clark',chefName:'Samantha Clark',trainedStaff:2,totalQuizAttempts:3,healthScore:55,healthStatus:'warn',acquisitionSource:'Google search',referralCode:'MORO6G7H',referredBy:null,profiles:[{id:'dp17a',name:'Sam Clark',role:'owner'}],notes:[]},
    { id:'d18',name:'Cafe Murano',contact:'Angela Hartnett',email:'angela@cafemurano.co.uk',city:'London',plan:'plus',status:'active',since:'2024-04-14',lastActive:'2025-05-24',seats:7,sites:1,dishes:34,ownerName:'Angela Hartnett',chefName:'Oscar Sherwood',trainedStaff:5,totalQuizAttempts:8,healthScore:82,healthStatus:'good',acquisitionSource:'Referred by another restaurant',referralCode:'CAFE8I9J',referredBy:'LEDB1J2K',profiles:[{id:'dp18a',name:'Angela Hartnett',role:'owner'},{id:'dp18b',name:'Oscar Sherwood',role:'chef'}],notes:[]},
    { id:'d19',name:'Barrafina Adelaide St',contact:'Hart Brothers',email:'info@barrafina.co.uk',city:'London',plan:'core',status:'trial',since:'2025-05-10',lastActive:'2025-05-30',seats:2,sites:1,dishes:11,ownerName:'Eddie Hart',chefName:null,trainedStaff:0,totalQuizAttempts:1,healthScore:30,healthStatus:'bad',acquisitionSource:'Instagram/TikTok',referralCode:'BARR1K2L',referredBy:null,profiles:[{id:'dp19a',name:'Eddie Hart',role:'owner'}],notes:[{note:'Trial ending soon — book demo call.',created_by:'Admin',created_at:'2025-05-15T11:00:00Z'}]},
    { id:'d20',name:'Duck & Waffle',contact:'Igor Shirman',email:'igor@duckandwaffle.com',city:'London',plan:'multi',status:'active',since:'2024-01-30',lastActive:'2025-05-31',seats:11,sites:2,dishes:58,ownerName:'Igor Shirman',chefName:'Tom Cenci',trainedStaff:9,totalQuizAttempts:20,healthScore:97,healthStatus:'good',acquisitionSource:'Trade show/event',referralCode:'DUCK3M4N',referredBy:null,profiles:[{id:'dp20a',name:'Igor Shirman',role:'owner'},{id:'dp20b',name:'Tom Cenci',role:'chef'}],notes:[]},
    { id:'d21',name:'Rosa\'s Thai Cafe',contact:'Saiphin Moore',email:'saiphin@rosasthai.co.uk',city:'Leeds',plan:'core',status:'active',since:'2024-06-05',lastActive:'2025-05-12',seats:3,sites:1,dishes:29,ownerName:'Saiphin Moore',chefName:null,trainedStaff:2,totalQuizAttempts:4,healthScore:50,healthStatus:'warn',acquisitionSource:'Reddit/Facebook group',referralCode:'ROSA5O6P',referredBy:null,profiles:[{id:'dp21a',name:'Saiphin Moore',role:'owner'}],notes:[]},
    { id:'d22',name:'Dishoom Kings Cross',contact:'Manu Mathew',email:'manu@dishoom.co.uk',city:'London',plan:'multi',status:'active',since:'2024-02-08',lastActive:'2025-05-30',seats:13,sites:4,dishes:68,ownerName:'Manu Mathew',chefName:'Naved Nasir',trainedStaff:10,totalQuizAttempts:25,healthScore:100,healthStatus:'good',acquisitionSource:'Direct outreach',referralCode:'DISK7Q8R',referredBy:null,profiles:[{id:'dp22a',name:'Manu Mathew',role:'owner'},{id:'dp22b',name:'Naved Nasir',role:'chef'}],notes:[]},
    { id:'d23',name:'Pho Street Kitchen',contact:'Stephen Wall',email:'stephen@phocafe.co.uk',city:'Bristol',plan:'core',status:'cancelled',since:'2024-04-22',lastActive:'2025-03-15',seats:2,sites:1,dishes:20,ownerName:'Stephen Wall',chefName:null,trainedStaff:1,totalQuizAttempts:2,healthScore:20,healthStatus:'bad',acquisitionSource:'Google search',referralCode:'PHOS9S0T',referredBy:null,profiles:[{id:'dp23a',name:'Stephen Wall',role:'owner'}],notes:[{note:'Cancelled due to cost. Possible reactivation at renewal.',created_by:'Admin',created_at:'2025-03-16T09:00:00Z'}]},
    { id:'d24',name:'Barber & Q Shawarma',contact:'Josh Katz',email:'josh@barberandq.com',city:'London',plan:'plus',status:'active',since:'2024-05-30',lastActive:'2025-05-29',seats:5,sites:1,dishes:31,ownerName:'Josh Katz',chefName:'Dom Jacobs',trainedStaff:3,totalQuizAttempts:5,healthScore:75,healthStatus:'good',acquisitionSource:'Referred by another restaurant',referralCode:'BARB2U3V',referredBy:'PATT5N6O',profiles:[{id:'dp24a',name:'Josh Katz',role:'owner'},{id:'dp24b',name:'Dom Jacobs',role:'chef'}],notes:[]},
    { id:'d25',name:'Honest Burgers Camden',contact:'Tom Barton',email:'tom@honestburgers.co.uk',city:'London',plan:'plus',status:'active',since:'2024-04-28',lastActive:'2025-05-25',seats:6,sites:1,dishes:15,ownerName:'Tom Barton',chefName:'Phil Eeles',trainedStaff:5,totalQuizAttempts:8,healthScore:78,healthStatus:'good',acquisitionSource:'Google search',referralCode:'HONE4W5X',referredBy:null,profiles:[{id:'dp25a',name:'Tom Barton',role:'owner'},{id:'dp25b',name:'Phil Eeles',role:'chef'}],notes:[]},
    { id:'d26',name:'BRAT Shoreditch',contact:'Tomos Parry',email:'tomos@bratrestaurant.co.uk',city:'London',plan:'plus',status:'active',since:'2024-03-15',lastActive:'2025-05-28',seats:6,sites:1,dishes:39,ownerName:'Tomos Parry',chefName:'Luke Selby',trainedStaff:5,totalQuizAttempts:10,healthScore:90,healthStatus:'good',acquisitionSource:'Instagram/TikTok',referralCode:'BRAT6Y7Z',referredBy:null,profiles:[{id:'dp26a',name:'Tomos Parry',role:'owner'},{id:'dp26b',name:'Luke Selby',role:'chef'}],notes:[]},
    { id:'d27',name:'Rawduck Hackney',contact:'Olia Hercules',email:'olia@rawduck.co.uk',city:'London',plan:'core',status:'active',since:'2024-06-12',lastActive:'2025-05-16',seats:3,sites:1,dishes:22,ownerName:'Olia Hercules',chefName:null,trainedStaff:2,totalQuizAttempts:3,healthScore:48,healthStatus:'warn',acquisitionSource:'Reddit/Facebook group',referralCode:'RAWD8A9B',referredBy:null,profiles:[{id:'dp27a',name:'Olia Hercules',role:'owner'}],notes:[]},
    { id:'d28',name:'Cornerstone Hackney',contact:'Tom Brown',email:'tom@cornerstonerestaurant.co.uk',city:'London',plan:'plus',status:'active',since:'2024-04-05',lastActive:'2025-05-26',seats:5,sites:1,dishes:27,ownerName:'Tom Brown',chefName:'Ali Medley',trainedStaff:4,totalQuizAttempts:7,healthScore:83,healthStatus:'good',acquisitionSource:'Trade show/event',referralCode:'CORN1C2D',referredBy:null,profiles:[{id:'dp28a',name:'Tom Brown',role:'owner'},{id:'dp28b',name:'Ali Medley',role:'chef'}],notes:[]},
    { id:'d29',name:'Lorne Victoria',contact:'Katie Lundie',email:'katie@lornelondon.co.uk',city:'London',plan:'core',status:'paused',since:'2024-05-08',lastActive:'2025-04-20',seats:2,sites:1,dishes:17,ownerName:'Katie Lundie',chefName:null,trainedStaff:1,totalQuizAttempts:2,healthScore:25,healthStatus:'bad',acquisitionSource:'Instagram/TikTok',referralCode:'LORN3E4F',referredBy:null,profiles:[{id:'dp29a',name:'Katie Lundie',role:'owner'}],notes:[{note:'Paused for refurb. Resume expected July.',created_by:'Admin',created_at:'2025-04-21T10:00:00Z'}]},
    { id:'d30',name:'Cora Pearl Covent Garden',contact:'Tom Mullion',email:'tom@corapearl.co.uk',city:'London',plan:'plus',status:'active',since:'2024-03-30',lastActive:'2025-05-27',seats:5,sites:1,dishes:33,ownerName:'Tom Mullion',chefName:'Harriet Mansell',trainedStaff:4,totalQuizAttempts:6,healthScore:80,healthStatus:'good',acquisitionSource:'Google search',referralCode:'CORA5G6H',referredBy:null,profiles:[{id:'dp30a',name:'Tom Mullion',role:'owner'},{id:'dp30b',name:'Harriet Mansell',role:'chef'}],notes:[]},
  ]

  const allCustomers = [...customers, ...DEMO_CUSTOMERS]

  // Build MRR trend based on allCustomers
  const planPrice: Record<string, number> = { core: 49, plus: 79, multi: 129 }
  const mrrByMonth: Record<string, number> = {}
  const months = ['2024-10','2024-11','2024-12','2025-01','2025-02','2025-03','2025-04','2025-05','2025-06']
  for (const m of months) {
    const activeByMonth = allCustomers.filter(c => {
      if (c.status !== 'active' && c.status !== 'past_due') return false
      return c.since <= m + '-31'
    })
    mrrByMonth[m] = activeByMonth.reduce((sum, c) => sum + (planPrice[c.plan] ?? 49), 0)
  }

  const miseData = JSON.stringify({
    PLANS: {
      core:  { id: 'core',  name: 'mise Core',       price: 49,  blurb: 'Allergens, menus & QR for a single site.' },
      plus:  { id: 'plus',  name: 'HospoPilot Plus',       price: 79,  blurb: 'Adds recipe costing, GP% and staff training.' },
      multi: { id: 'multi', name: 'mise Multi-site', price: 129, blurb: 'Everything in Plus across up to 5 venues.' },
    },
    CUSTOMERS: allCustomers,
    LOGIN_EVENTS: loginEvents,
    USER_SESSIONS: userSessions,
    MRR_TREND: months.map((m, i) => ({ m: m.slice(5), v: mrrByMonth[m] ?? 0 })),
    TRIAL_FUNNEL: {
      signups: allCustomers.length,
      activeTrials: allCustomers.filter(c => c.status === 'trial').length,
      converted: allCustomers.filter(c => c.status === 'active').length,
      conversionRate: allCustomers.length > 0 ? Math.round((allCustomers.filter(c => c.status === 'active').length / allCustomers.length) * 100) : 0,
    },
    ACQUISITION_SOURCES: (() => {
      const sources: Record<string, number> = {}
      allCustomers.forEach(c => {
        const src = (c as any).acquisitionSource || 'Unknown'
        sources[src] = (sources[src] || 0) + 1
      })
      return Object.entries(sources).map(([source, count]) => ({ source, count }))
    })(),
    INVOICES: generateDemoInvoices(DEMO_CUSTOMERS),
    WAITLIST: [
      { id:'w1',name:'La Petite Maison',email:'contact@lapetitemaison.co.uk',city:'London',plan:'plus',signed:'2025-05-28',status:'pending' },
      { id:'w2',name:'Temper Soho',email:'info@temper.co.uk',city:'London',plan:'core',signed:'2025-05-29',status:'pending' },
      { id:'w3',name:'Galvin at Windows',email:'hello@galvinatwindows.com',city:'London',plan:'multi',signed:'2025-05-30',status:'invited' },
      { id:'w4',name:'Mildreds Camden',email:'info@mildreds.co.uk',city:'London',plan:'core',signed:'2025-05-31',status:'pending' },
      { id:'w5',name:'Native Victoria',email:'hello@eatnative.co.uk',city:'London',plan:'plus',signed:'2025-06-01',status:'pending' },
    ],
    ACTIVITY: allCustomers.slice(0, 8).map(c => ({
      t: 'recently',
      who: c.name,
      what: `joined HospoPilot with ${c.dishes} dish${c.dishes !== 1 ? 'es' : ''}`,
      kind: 'good',
    })),
  })

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>HospoPilot — Admin</title>
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
