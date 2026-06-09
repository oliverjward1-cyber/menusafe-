import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getRestaurantId(supabase: any, userId: string) {
  const { data } = await supabase.from('profiles').select('restaurant_id, role').eq('id', userId).single()
  return data
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const profile = await getRestaurantId(supabase, user.id)
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  const { data } = await supabase
    .from('ops_task_templates')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('sort_order')

  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const profile = await getRestaurantId(supabase, user.id)
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  const body = await req.json()

  // Get next sort_order
  const { data: existing } = await supabase
    .from('ops_task_templates')
    .select('sort_order')
    .eq('restaurant_id', profile.restaurant_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.sort_order) ?? 0) + 1

  const { data, error } = await supabase
    .from('ops_task_templates')
    .insert({
      restaurant_id: profile.restaurant_id,
      title: body.title,
      description: body.description ?? null,
      task_type: body.task_type,
      target_team: body.target_team ?? 'kitchen',
      schedule_type: body.schedule_type ?? 'daily',
      schedule_days: body.schedule_days ?? null,
      scheduled_time: body.scheduled_time ?? null,
      checklist_items: body.checklist_items ?? null,
      sort_order: nextOrder,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Wipe today's generated logs so trail regenerates with updated templates
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('ops_task_logs').delete()
    .eq('restaurant_id', profile.restaurant_id)
    .eq('scheduled_date', today)

  return NextResponse.json({ template: data })
}
