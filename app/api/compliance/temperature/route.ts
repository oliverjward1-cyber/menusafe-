import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  const body = await request.json()
  const { restaurantId, location, temperature, checkType, recordedBy, notes } = body

  if (profile?.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('temperature_logs').insert({
    restaurant_id: restaurantId,
    location,
    temperature,
    check_type: checkType,
    recorded_by: recordedBy,
    notes: notes || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
