import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getStaffRestaurantId } from '@/lib/staff-session'

export async function POST(request: Request) {
  const body = await request.json()
  const { restaurantId, icePoint, boilingPoint, recordedBy, notes, source } = body

  const adminSupabase = createAdminClient()

  if (source === 'staff') {
    const staffRid = getStaffRestaurantId()
    if (!staffRid || staffRid !== restaurantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
    if (profile?.restaurant_id !== restaurantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await adminSupabase.from('probe_calibrations').insert({
    restaurant_id: restaurantId,
    ice_point: parseFloat(icePoint),
    boiling_point: parseFloat(boilingPoint),
    recorded_by: recordedBy,
    notes: notes || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
