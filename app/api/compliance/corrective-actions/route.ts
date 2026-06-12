import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { blockIfImpersonating } from '@/lib/dev/guard'

async function getRestaurantId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  return profile?.restaurant_id ?? null
}

export async function GET() {
  const rid = await getRestaurantId()
  if (!rid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('corrective_actions')
    .select('*')
    .eq('restaurant_id', rid)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ actions: data })
}

export async function POST(request: Request) {
  const blocked = await blockIfImpersonating()
  if (blocked) return blocked
  const rid = await getRestaurantId()
  if (!rid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, assignedTo, dueDate, sourceType = 'manual', sourceId } = body

  const admin = createAdminClient()
  const { data, error } = await admin.from('corrective_actions').insert({
    restaurant_id: rid,
    title,
    description: description || null,
    assigned_to: assignedTo || null,
    due_date: dueDate || null,
    source_type: sourceType,
    source_id: sourceId || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, action: data })
}
