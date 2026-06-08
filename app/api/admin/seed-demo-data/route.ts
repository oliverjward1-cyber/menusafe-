import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STAFF = [
  { name: 'Aisha Khan', role: 'manager' },
  { name: 'Tom Reilly', role: 'head_chef' },
  { name: 'Priya Patel', role: 'chef' },
  { name: 'Liam O’Connor', role: 'chef' },
  { name: 'Sofia Rossi', role: 'chef' },
  { name: 'Jamal Edwards', role: 'chef' },
  { name: 'Megan Clarke', role: 'chef' },
  { name: 'Daniel Wright', role: 'chef' },
  { name: 'Hannah Wilson', role: 'foh' },
  { name: 'Oscar Bennett', role: 'foh' },
  { name: 'Ruby Thompson', role: 'foh' },
  { name: 'Ethan Walsh', role: 'foh' },
  { name: 'Chloe Davies', role: 'foh' },
  { name: 'Nathan Murphy', role: 'foh' },
  { name: 'Grace Robinson', role: 'foh' },
]

const LOCATIONS = ['Walk-in fridge', 'Freezer 1', 'Freezer 2', 'Hot hold', 'Prep fridge', 'Display chiller']
const SUPPLIERS = ['Fresh Direct Foods', 'Harbour Fish Co.', 'Greenfield Farms', 'Metro Meats', 'Bakers Supply Ltd']
const CLEANING_TASKS = ['Deep clean fryers', 'Wipe down pass', 'Sanitise prep surfaces', 'Clean walk-in fridge', 'Mop kitchen floor', 'Descale coffee machine']
const INCIDENT_TYPES = ['near_miss', 'equipment', 'contamination', 'injury', 'pest'] as const

function daysAgo(n: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, restaurant_id').eq('id', user.id).single()

  if (profile?.role !== 'owner' || !profile.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden: owners only' }, { status: 403 })
  }

  const rid = profile.restaurant_id
  const admin = createAdminClient()
  const names: string[] = []

  // Create demo staff users + profiles
  for (let i = 0; i < STAFF.length; i++) {
    const staff = STAFF[i]
    const email = `demo.staff${i + 1}+${rid.slice(0, 8)}@mise-demo.app`
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { full_name: staff.name, demo: true },
    })

    if (createErr || !created.user) continue

    await admin.from('profiles').upsert({
      id: created.user.id,
      restaurant_id: rid,
      role: staff.role,
      full_name: staff.name,
    })

    names.push(staff.name)
  }

  if (names.length === 0) {
    return NextResponse.json({ error: 'Could not create demo staff' }, { status: 500 })
  }

  // 3 weeks (21 days) of compliance activity
  const tempLogs: any[] = []
  const cleaningLogs: any[] = []
  const deliveries: any[] = []
  const incidents: any[] = []
  const audits: any[] = []

  for (let day = 20; day >= 0; day--) {
    // Temperature checks — twice daily across a couple of locations
    LOCATIONS.slice(0, 2).forEach((loc, idx) => {
      tempLogs.push({
        restaurant_id: rid,
        location: loc,
        temperature: (Number((Math.random() * 3 + (idx === 0 ? 1 : -20)).toFixed(1))),
        unit: 'C',
        check_type: idx === 0 ? 'am' : 'pm',
        recorded_by: pick(names, day + idx),
        logged_at: daysAgo(day, idx === 0 ? 8 : 17, 30),
      })
    })

    // Cleaning — one or two tasks signed off per day
    const tasksToday = day % 3 === 0 ? 2 : 1
    for (let t = 0; t < tasksToday; t++) {
      cleaningLogs.push({
        restaurant_id: rid,
        task_name: pick(CLEANING_TASKS, day + t),
        signed_by: pick(names, day + t + 3),
        completed_at: daysAgo(day, 15, t * 10),
      })
    }

    // Deliveries every other day
    if (day % 2 === 0) {
      deliveries.push({
        restaurant_id: rid,
        supplier: pick(SUPPLIERS, day),
        items: 'Mixed produce, dairy & dry goods',
        temperature: Number((Math.random() * 2 + 2).toFixed(1)),
        temp_acceptable: true,
        condition: day === 6 ? 'borderline' : 'acceptable',
        received_by: pick(names, day + 5),
        delivered_at: daysAgo(day, 10, 0),
      })
    }
  }

  // Weekly kitchen audits (3 over the period)
  ;[18, 11, 4].forEach((day, i) => {
    const score = 16 - i
    audits.push({
      restaurant_id: rid,
      completed_by: pick(names, i),
      score,
      total: 18,
      status: score >= 16 ? 'green' : score >= 13 ? 'amber' : 'red',
      notes: 'Routine weekly kitchen audit',
      completed_at: daysAgo(day, 14, 0),
    })
  })

  // A handful of incidents
  ;[15, 9, 2].forEach((day, i) => {
    const type = pick(INCIDENT_TYPES, i)
    incidents.push({
      restaurant_id: rid,
      type,
      severity: i === 2 ? 'medium' : 'low',
      title: type === 'near_miss' ? 'Wet floor near fryer station' : type === 'equipment' ? 'Walk-in fridge door seal worn' : type === 'contamination' ? 'Raw chicken stored above salad prep' : type === 'injury' ? 'Minor knife cut during prep' : 'Signs of pest activity near bins',
      description: 'Logged during routine shift checks — addressed per kitchen procedure.',
      reported_by: pick(names, day),
      action_taken: 'Area inspected, corrective action taken and logged.',
      resolved: i !== 2,
      resolved_at: i !== 2 ? daysAgo(day - 1, 12, 0) : null,
      occurred_at: daysAgo(day, 13, 0),
    })
  })

  await Promise.all([
    tempLogs.length ? admin.from('temperature_logs').insert(tempLogs) : null,
    cleaningLogs.length ? admin.from('cleaning_logs').insert(cleaningLogs) : null,
    deliveries.length ? admin.from('delivery_records').insert(deliveries) : null,
    incidents.length ? admin.from('incidents').insert(incidents) : null,
    audits.length ? admin.from('kitchen_audits').insert(audits) : null,
  ].filter(Boolean))

  return NextResponse.json({
    staffCreated: names.length,
    tempLogs: tempLogs.length,
    cleaningLogs: cleaningLogs.length,
    deliveries: deliveries.length,
    incidents: incidents.length,
    audits: audits.length,
  })
}
